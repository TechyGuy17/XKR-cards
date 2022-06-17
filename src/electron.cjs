const windowStateManager = require('electron-window-state');
const contextMenu = require('electron-context-menu');
const {app, BrowserWindow, ipcMain, ipcRenderer} = require('electron');
const serve = require('electron-serve');
const path = require('path');
const {join} = require('path')
const {JSONFile, Low} = require("@commonify/lowdb");
const fs = require('fs')
const WB = require("kryptokrona-wallet-backend-js");
const {default: fetch} = require("electron-fetch");
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const naclSealed = require('tweetnacl-sealed-box')
const {extraDataToMessage} = require('hugin-crypto')
const sanitizeHtml = require('sanitize-html')
const sqlite3 = require('sqlite3').verbose();

const { Address,
    AddressPrefix,
    Block,
    BlockTemplate,
    Crypto,
    CryptoNote,
    LevinPacket,
    Transaction} = require('kryptokrona-utils')


const xkrUtils = new CryptoNote()
const hexToUint = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

function getXKRKeypair() {
    const [privateSpendKey, privateViewKey] = js_wallet.getPrimaryAddressPrivateKeys();
    return {privateSpendKey: privateSpendKey, privateViewKey: privateViewKey};
}

function getKeyPair() {
    // return new Promise((resolve) => setTimeout(resolve, ms));
    const [privateSpendKey, privateViewKey] = js_wallet.getPrimaryAddressPrivateKeys();
    let secretKey = naclUtil.decodeUTF8(privateSpendKey.substring(1, 33));
    let keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    return keyPair;
}

function getMsgKey() {

    const naclPubKey = getKeyPair().publicKey
    return  Buffer.from(naclPubKey).toString('hex');
}

function toHex(str,hex){
    try{
        hex = unescape(encodeURIComponent(str))
            .split('').map(function(v){
                return v.charCodeAt(0).toString(16)
            }).join('')
    }
    catch(e){
        hex = str
        //console.log('invalid text input: ' + str)
    }
    return hex
}



function nonceFromTimestamp(tmstmp) {

    let nonce = hexToUint(String(tmstmp));

    while ( nonce.length < nacl.box.nonceLength ) {

        let tmp_nonce = Array.from(nonce);

        tmp_nonce.push(0);

        nonce = Uint8Array.from(tmp_nonce);

    }

    return nonce;
}


function fromHex(hex, str) {
    try {
        str = decodeURIComponent(hex.replace(/(..)/g, '%$1'))
    } catch (e) {
        str = hex
        // console.log('invalid hex input: ' + hex)
    }
    return str
}


function trimExtra(extra) {

    try {
        let payload = fromHex(extra.substring(66));

        let payload_json = JSON.parse(payload);
        return fromHex(extra.substring(66))
    } catch (e) {
        return fromHex(Buffer.from(extra.substring(78)).toString())
    }
}

try {
    require('electron-reloader')(module);
} catch (e) {
    console.error(e);
}

const serveURL = serve({directory: "."});
const port = process.env.PORT || 3000;
const dev = !app.isPackaged;
let mainWindow;

function createWindow() {
    let windowState = windowStateManager({
        defaultWidth: 1100,
        defaultHeight: 700,
    });

    const mainWindow = new BrowserWindow({
        backgroundColor: '#202020',
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        trafficLightPosition: {
            x: 17,
            y: 12,
        },
        minHeight: 600,
        minWidth: 800,
        webPreferences: {
            enableRemoteModule: true,
            contextIsolation: true,
            nodeIntegration: true,
            spellcheck: false,
            devTools: dev,
            preload: path.join(__dirname, "preload.cjs")
        },
        x: windowState.x,
        y: windowState.y,
        width: windowState.width,
        height: windowState.height,
    });

    windowState.manage(mainWindow);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.openDevTools()
    });

    mainWindow.on('close', () => {
        windowState.saveState(mainWindow);
    });

    return mainWindow;
}

contextMenu({
    showLookUpSelection: false,
    showSearchWithGoogle: false,
    showCopyImage: false,
    prepend: (defaultActions, params, browserWindow) => [
        {
            label: 'Make App 💻',
        },
    ],
});

function loadVite(port) {
    mainWindow.loadURL(`http://localhost:${port}`).catch((e) => {
        console.log('Error loading URL, retrying', e);
        setTimeout(() => {
            loadVite(port);
        }, 200);
    });
}

function createMainWindow() {
    mainWindow = createWindow();
    mainWindow.once('close', () => {
        mainWindow = null
    });

    if (dev) loadVite(port);
    else serveURL(mainWindow);
}


app.on('ready', createMainWindow)
app.on('activate', () => {
    if (!mainWindow) {
        createMainWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const userDataDir = app.getPath('userData');

const dbPath = userDataDir + "/SQLmessages.db"
const database = new sqlite3.Database(dbPath, (err) => {
  if ( err) { console.log('Err', err); }
});


let node = 'blocksum.org'
let ports = 11898
const daemon = new WB.Daemon(node, ports);

//Create misc.db
const file = join(userDataDir, 'misc.db')
const adapter = new JSONFile(file)
const db = new Low(adapter)

//Create keychain.db
const fileKeys = join(userDataDir, 'keychain.db')
const adapterChain = new JSONFile(fileKeys)
const keychain = new Low(adapterChain)

//Create knownTxs.db
const fileTxs = join(userDataDir, 'knowntxs.db')
const adapterTxs = new JSONFile(fileTxs)
const knownTxs = new Low(adapterTxs)

let js_wallet;
let walletName
let known_keys = [];

ipcMain.on('app', (data) => {
    mainWindow.webContents.send('getPath', userDataDir)
    startCheck()
})


async function startCheck() {


if (fs.existsSync(userDataDir + '/misc.db')) {

    await db.read()
    let walletName = db.data.walletNames
    console.log('walletname', walletName)
    mainWindow.webContents.send('wallet-exist', true, walletName)

    ipcMain.on('login', async (event, data) => {
      let walletName = data.thisWallet
      let password = data.myPassword
      console.log('Starting this wallet', walletName);
      console.log('password', password);
      start_js_wallet(walletName, password);
    })

    } else {
    //No wallet found, probably first start
    console.log('wallet not found')
    txTable()
    knownTxsTable()
    messagesTable()
    mainWindow.webContents.send('wallet-exist', false)
    }

  }


function knownTxsTable() {
    const knownTxTable = `
                  CREATE TABLE knownTxs (
                     hash TEXT,
                     UNIQUE (hash)
                 )`
   return new Promise((resolve, reject) => {
    database.run(knownTxTable, (err) => {
      })
      console.log('created Known TX Table');

     }, () => {
       resolve();
     });
   }


function txTable() {
  const txTable = `
                CREATE TABLE bankTxs (
                   user TEXT,
                   amount TEXT,
                   sent BOOLEAN,
                   timestamp TEXT,
                   UNIQUE (timestamp)
               )`
 return new Promise((resolve, reject) => {
  database.run(txTable, (err) => {
    })
    console.log('created Table');
   }, () => {
     resolve();
   });
 }


 function messagesTable() {
   const messageTable = `
                 CREATE TABLE messages (
                    msg TEXT,
                    chat TEXT,
                    sent BOOLEAN,
                    timestamp TEXT,
                    UNIQUE (timestamp)
                )`
  return new Promise((resolve, reject) => {
   database.run(messageTable, (err) => {
     })
     console.log('created Table');
    }, () => {
      resolve();
    });
  }

  function welcomeMessage() {
   const huginMessage = `REPLACE INTO messages (msg, chat, sent, timestamp)
                          VALUES (?, ?, ?, ?)`
   return new Promise((resolve, reject) => {
    database.run(huginMessage,
        [
            'Welcome to hugin',
            'Hugin Messenger',
            false,
            '1650919475320'
        ], (err) => {
          console.log('Error creating msg', err);
      })
      console.log('created welcome msg');
     }, () => {
       resolve();
     });
}


function CreteDummyCardTx() {
   const cardTx = `REPLACE INTO bankTxs (user, amount, sent, timestamp)
                          VALUES (?, ?, ?, ?)`
   return new Promise((resolve, reject) => {
    database.run(cardTx,
        [
            'Welcome to Nordic Tech Bank',
            '9001',
            false,
            '1650919475320'
        ], (err) => {
          console.log('Error creating card msg', err);
      })
      console.log('created cad msg');
     }, () => {
       resolve();
     });
}

function CreateCardTx(newCard) {
  console.log('New card data', newCard)
  let card = ",,,"
  card = newCard
  cardarray = []
  let amount = cardarray[0]
  let carduser = cardarray[1]
  let sent = cardarray[2]
  let timestamp = cardarray[3]
  console.log('Creating user', carduser, amount, timestamp, sent)

  database.run(
    `REPLACE INTO bankTxs
       (user, amount, sent, timestamp)
    VALUES
        (?, ?, ?, ?)`,
    [
        carduser,
        amount,
        sent,
        timestamp
    ]
);
}
//Get one card tx from every unique user sorted by latest timestmap.
async function getCards() {

  const myCards = [];
     return new Promise((resolve, reject) => {
       const getMyCards =   `
         SELECT *
         FROM bankTxs D
         WHERE timestamp = (SELECT MAX(timestamp) FROM cardTxs WHERE user = D.user)
         ORDER BY
             timestamp
         ASC          `
       database.each(getMyCards, (err, row) => {
         if (err) {
           console.log('Error', err);
         }
         myCards.push(row);
       }, () => {
         resolve(myConversations);
       });
     })

    }
let myPassword;

ipcMain.on('create-account', async (e, accountData) => {
    //Create welcome message
    welcomeMessage()
    CreteDummyCardTx()
    let walletName = accountData.walletName
    let myPassword = accountData.password
    console.log('creating', walletName);
    const js_wallet = await WB.WalletBackend.createWallet(daemon);
    console.log(myPassword)
    //Create DBs on first start
    db.data = {walletNames:[],
              blockHeight:[],}
    keychain.data = {contacts:[ {
        chat: "Random 2FA Hugin Messenger SEKRAddress",
        key: "133376bcb04a2b6c62fc9ebdd719fbbc0c680aa411a8e5fd76536915371bba7f"},]}
    //Save welcome Hugin messenger test contact
    await keychain.write(keychain.data)
    //Saving wallet name
    db.data.walletNames.push(walletName)
    await db.write()
    console.log('creating dbs...');
    await js_wallet.saveWalletToFile(userDataDir + '/' + walletName + '.wallet', myPassword)
    start_js_wallet(walletName, myPassword);
  })

async function loadKeys() {

//Load known public keys from db and push them to known_keys
await keychain.read()

let contacts = keychain.data.contacts
console.log('contacts', contacts);
for (keys in contacts) {
console.log('thiskey', contacts[keys].key)
let thiskey = contacts[keys].key
known_keys.push(thiskey)
console.log('Pushin this', thiskey);
}

console.log('known keys', known_keys);

return contacts
}

async function loadKnownTxs() {

//Load known txs from db and then load them in to known_pool_txs
const knownTransactions = [];
return new Promise((resolve, reject) => {
  const getAllknownTxs = `SELECT * FROM knownTxs`
  database.each(getAllknownTxs, (err, txs) => {
    if (err) {
      console.log('Error', err);
    }
    knownTransactions.push(txs);
  }, () => {
    resolve(knownTransactions);
  });
})
}

async function logIntoWallet(walletName, password) {

    const [js_wallet, error] = await WB.WalletBackend.openWalletFromFile(daemon, userDataDir + '/' + walletName + '.wallet', password);
    if (error) {
        console.log('Failed to open wallet: ' + error.toString());
        return 'Wrong password'
        }

  return js_wallet
}

async function start_js_wallet(walletName, password) {

    js_wallet = await logIntoWallet(walletName, password)

    if (js_wallet === 'Wrong password') {
      console.log('A', js_wallet);
      return;
    }
    /* Start wallet sync process */
    await js_wallet.start();
    //Load known pool txs from db.
    let knownTxsIds = await loadKnownTxs()
    let checkedTxs = []
    for (n in knownTxsIds) {
        let knownTxId = knownTxsIds[n].hash
        checkedTxs.push(knownTxId)
    }
     //Load known public keys
    let myContacts = await loadKeys()

    mainWindow.webContents.send('sync', false)

    js_wallet.enableAutoOptimization(false);
    js_wallet.on('incomingtx', (transaction) => {

        console.log(`Incoming transaction of ${transaction.totalAmount()} received!`);

        // if (!syncing) {

        console.log('transaction', transaction);
        mainWindow.webContents.send('new-message', transaction.toJSON());
        // }

    });

    let i = 1;
    let myAddress
    for (const address of js_wallet.getAddresses()) {
        console.log(`Address [${i}]: ${address}`);
        let msgKey = getMsgKey()
        myAddress = address
        console.log('HuginAddress',myAddress + msgKey)

        mainWindow.webContents.send('addr', myAddress + msgKey)

        i++;
    }

    js_wallet.on('heightchange', async (walletBlockCount, localDaemonBlockCount, networkBlockCount) => {
      let synced = networkBlockCount - walletBlockCount <= 2
      if (synced) {
      //Send synced event to frontend
      mainWindow.webContents.send('sync', true)

      // Save js wallet to file
      console.log('******** SAVING WALLET ********');
      await js_wallet.saveWalletToFile(userDataDir + '/' + walletName + '.wallet', password)
    } else if (!synced) {
      return
      }
    })
    mainWindow.webContents.send('wallet-started', myContacts)
    console.log('Started wallet');
    await sleep(2000)
    console.log('Loading Sync');
    //Load knownTxsIds to backgroundSyncMessages on startup
    backgroundSyncMessages(checkedTxs)
    while (true) {

      try {
        //Start syncing
        await sleep(1000 * 3);
        backgroundSyncMessages()
        const [walletBlockCount, localDaemonBlockCount, networkBlockCount] =
            await js_wallet.getSyncStatus();
        if ((localDaemonBlockCount - walletBlockCount) < 2) {
            // Diff between wallet height and node height is 1 or 0, we are synced
            console.log('**********SYNCED**********');
            console.log('My Wallet ', walletBlockCount);
            console.log('The Network', networkBlockCount);
        } else {
            //If wallet is somehow stuck at block 0 for new users due to bad node connection, reset to the last 100 blocks.
            if (walletBlockCount === 0) {
              await js_wallet.reset(networkBlockCount - 100)
            }
            console.log('*.[~~~].SYNCING BLOCKS.[~~~].*');
            console.log('My Wallet ', walletBlockCount);
            console.log('The Network', networkBlockCount);
        }

      } catch (err) {
      console.log(err);
      }
    }
}


let known_pooL_txs = []

async function backgroundSyncMessages(knownTxsIds) {

    if (knownTxsIds) {
    console.log('First start, push knownTxs db to known pool txs');
    known_pool_txs = knownTxsIds
    }

    console.log('Background syncing...');
    let message_was_unknown;
    try {
        const resp = await fetch('http://' + 'blocksum.org:11898' + '/get_pool_changes_lite', {
            method: 'POST',
            body: JSON.stringify({knownTxsIds: known_pool_txs})
        })

        let json = await resp.json();

        json = JSON.stringify(json).replaceAll('.txPrefix', '').replaceAll('transactionPrefixInfo.txHash', 'transactionPrefixInfotxHash');

        json = JSON.parse(json);

        let transactions = json.addedTxs;
        let transaction;

        //Try clearing known pool txs from checked
        known_pooL_txs = known_pooL_txs.filter(n => !json.deletedTxsIds.includes(n))
        if (transactions.length === 0) {
            console.log('Empty array...')
            console.log('No incoming messages...');
            return;
        }

        for (transaction in transactions) {
            try {
                let thisExtra = transactions[transaction].transactionPrefixInfo.extra;
                let thisHash = transactions[transaction].transactionPrefixInfotxHash;
                if (known_pool_txs.indexOf(thisHash) === -1) {
                    known_pool_txs.push(thisHash);
                    message_was_unknown = true;

                } else {
                    message_was_unknown = false;
                    console.log("This transaction is already known", thisHash);
                    continue;
                }
                  let message
                  if (thisExtra !== undefined && thisExtra.length > 200) {
                      message = await extraDataToMessage(thisExtra, known_keys, getXKRKeypair());
                      if (!message || message === undefined) {
                        console.log('Caught undefined null message, continue');
                        continue;
                      }

                      message.sent = false

                      if (message.brd) {
                        continue;
                      } else {
                        console.log('Saving Message');
                        // await saveMsg(message);
                        saveMessageSQL(message)

                      }
                  }
                  console.log('Transaction checked');
                  saveHash(thisHash)

                } catch (err) {
                  console.log(err)
                }

            }


        } catch (err) {
        console.log(err);
        console.log('Sync error')
        }
}

//Listens for event from frontend and saves contact and nickname.
ipcMain.on('addChat', async (e, hugin_address, nickname) => {
  saveContact(hugin_address, nickname)
})
//Saves contact and nickname to db.
async function saveContact(hugin_address, nickname) {

  let addr = hugin_address.substring(0,99)
  let key = hugin_address.substring(99, 163)
  let huginaddr = {chat: addr, key: key, name: nickname}
  known_keys.push(key)
  console.log('Pushing this to known keys ', known_keys)
  mainWindow.webContents.send('saved-addr', huginaddr)
  keychain.data.contacts.push(huginaddr)
  await keychain.write()

}
//Saves txHash as checked to avoid syncing old messages from mempool in Munin upgrade.
async function saveHash(txHash) {

           database.run(
               `REPLACE INTO knownTxs (
                 hash
               )
               VALUES
                   ( ? )`,
               [
                   txHash
               ]
           );
  console.log('saved hash');
}


//Get all messages from db
async function getMessages() {
   const rows = [];
   return new Promise((resolve, reject) => {
     const getAllMessages = `SELECT * FROM messages`
     database.each(getAllMessages, (err, row) => {
         console.log(row);
       if (err) {
         console.log('Error', err);
       }
       rows.push(row);
     }, () => {
       resolve(rows);
     });
   })

}

//Get all cardtxs from db
async function getTxs() {
   const rows = [];
   return new Promise((resolve, reject) => {
     const getAlltxs = `SELECT * FROM bankTxs`
     database.each(getAlltxs, (err, row) => {
         console.log(row);
       if (err) {
         console.log('Error', err);
       }
       rows.push(row);
     }, () => {
       resolve(rows);
     });
   })

}

 //Get one message from every unique user sorted by latest timestmap.
async function getConversations() {

   const myConversations = [];
      return new Promise((resolve, reject) => {
        const getMyConversations =   `
          SELECT *
          FROM messages D
          WHERE timestamp = (SELECT MAX(timestamp) FROM messages WHERE chat = D.chat)
          ORDER BY
              timestamp
          ASC
          `
        database.each(getMyConversations, (err, row) => {
          if (err) {
            console.log('Error', err);
          }
          myConversations.push(row);
        }, () => {
          resolve(myConversations);
        });
      })

     }

 //Get a chosen conversation from the reciepients xkr address.
 async function getConversation(chat=false) {

      const thisConversation = [];
      return new Promise((resolve, reject) => {
        const getChat = `SELECT
            msg,
            chat,
            sent,
            timestamp
        FROM
            messages
        ${chat ? 'WHERE chat = "' + chat + '"' : ''}
        ORDER BY
            timestamp
        ASC`
        database.each(getChat, (err, row) => {
            console.log(row);
          if (err) {
            console.log('Error', err);
          }
          thisConversation.push(row);
        }, () => {
          resolve(thisConversation);
        });
      })
 }

//Saves private message
async function saveMessageSQL(msg) {

  let text = sanitizeHtml(msg.msg);
  let addr = sanitizeHtml(msg.from);
  let timestamp = escape(msg.t)
  let key = sanitizeHtml(msg.k)
  let sent = msg.sent

  //Checking if private msg is a call
  console.log('Checking if private msg is a call');
  let message = parseCall(text, addr)

  if (msg.type === 'sealedbox') {

   console.log('Saving key', key);
   let hugin = addr + key
   saveContact(hugin)

  }

 console.log('Saving message', text, addr, sent, timestamp);

     database.run(
         `REPLACE INTO messages
            (msg, chat, sent, timestamp)
         VALUES
             (?, ?, ?, ?)`,
         [
             text,
             addr,
             sent,
             timestamp
         ]
     );
     let newMsg = {msg: text, chat: addr, sent: sent, timestamp: timestamp}
     console.log('sending newmessage');
     mainWindow.webContents.send('newMsg', newMsg)
 }


//SWITCH NODE
ipcMain.on('switchNode', async (e, node) => {
    console.log(`Switching node to ${node}`)
    const daemon = new WB.Daemon(node.split(':')[0], parseInt(node.split(':')[1]));
    await js_wallet.swapNode(daemon);
    db.write()
});


ipcMain.on('sendMsg', (e, msg, receiver) => {
        sendMessage(msg, receiver);
        console.log(msg, receiver)
    }
)


async function sendMessage(message, receiver) {
    console.log('Want to send')
    let has_history
    console.log('address', receiver.length);
    if (receiver.length !== 163) {
      return
    }
    let address = receiver.substring(0,99);
    let messageKey =  receiver.substring(99,163);
        //receiver.substring(99,163);
    if (known_keys.indexOf(messageKey) > -1) {

      console.log('I know this contact?');
      has_history = true;

    } else {

      has_history = false
      saveContact(receiver);

    }

    if (message.length == 0) {
        return;
    }


    let my_address = await js_wallet.getPrimaryAddress();

    let my_addresses = await js_wallet.getAddresses();

    try {

        let [munlockedBalance, mlockedBalance] = await js_wallet.getBalance();
        //console.log('bal', munlockedBalance, mlockedBalance);

        if (munlockedBalance < 11 && mlockedBalance > 0) {

            log
            return;

        }
    } catch (err) {
        return;
    }

    let timestamp = Date.now();


    // History has been asserted, continue sending message

    let box;

    if (!has_history) {
        //console.log('No history found..');
        // payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp};
        const addr = await Address.fromAddress(my_address);
        const [privateSpendKey, privateViewKey] = js_wallet.getPrimaryAddressPrivateKeys();
        let xkr_private_key = privateSpendKey;
        let signature = await xkrUtils.signMessage(message, xkr_private_key);
        let payload_json = {
            "from": my_address,
            "k": Buffer.from(getKeyPair().publicKey).toString('hex'),
            "msg": message,
            "s": signature
        };
        let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));
        box = new naclSealed.sealedbox(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey));
    } else {
        //console.log('Has history, not using sealedbox');
        // Convert message data to json
        let payload_json = {"from": my_address, "msg": message};

        let payload_json_decoded = naclUtil.decodeUTF8(JSON.stringify(payload_json));


        box = nacl.box(payload_json_decoded, nonceFromTimestamp(timestamp), hexToUint(messageKey), getKeyPair().secretKey);

    }

    let payload_box = {"box": Buffer.from(box).toString('hex'), "t": timestamp};

    // let payload_box = {"box":Buffer.from(box).toString('hex'), "t":timestamp, "key":Buffer.from(getKeyPair().publicKey).toString('hex')};
    // Convert json to hex
    let payload_hex = toHex(JSON.stringify(payload_box));

    let result = await js_wallet.sendTransactionAdvanced(
        [[address, 1]], // destinations,
        3, // mixin
        {fixedFee: 7500, isFixedFee: true}, // fee
        undefined, //paymentID
        undefined, // subWalletsToTakeFrom
        undefined, // changeAddress
        true, // relayToNetwork
        false, // sneedAll
        Buffer.from(payload_hex, 'hex')
    );

    let sentMsg = {msg: message, k: messageKey, from: address, sent: true, t: timestamp}
    if (result.success) {
        saveMessageSQL(sentMsg)
        known_pool_txs.push(result.transactionHash)
        console.log(`Sent transaction, hash ${result.transactionHash}, fee ${WB.prettyPrintAmount(result.fee)}`);
        saveMessageSQL(sentMsg)
        mainWindow.webContents.send('sent', sentMsg)
    } else {
        console.log(`Failed to send transaction: ${result.error.toString()}`);
    }
}

ipcMain.handle('getMessages', async (data) => {
    return await getMessages()
})

ipcMain.handle('getTxs', async (data) => {
    return await getTxs()
})

ipcMain.handle('getReply', async (e, data) => {
    return await getReply(data)
})

ipcMain.handle('getConversations', async (e) => {
  console.log('Event');
  let contacts = await getConversations();
  return contacts.reverse()
})

ipcMain.handle('printBoard', async (e, board) => {
  return await printBoard(board)
})


ipcMain.handle('getBalance', async () => {
    return await js_wallet.getBalance()
})

ipcMain.handle('getAddress',  async () => {
    return js_wallet.getAddresses()

})

ipcMain.handle('newCard', async (newCard) => {
  console.log('data in newCard', newCard)
  // return await CreateCardTx(newCard)
})

let decode_fingerprint = (fingerprint) => {
    console.log('fingerprint', fingerprint);
    let decoded_fingerprint = "";
    let piece;
    let letters = atob(fingerprint).split('')
    for (letter in letters) {
        try {

            let piece = letters[letter].charCodeAt(0).toString(16);
            console.log('del', piece);
            if (piece.length == 1) {
                piece = "0" + piece;
            }
            decoded_fingerprint += piece;



        } catch (err) {
            console.log('error', piece)
            console.log('error', letter)

            continue;
        }
    }
    console.log('almost', decoded_fingerprint) ;

    decoded_fingerprint = decoded_fingerprint.toUpperCase().replace(/(.{2})/g,"$1:").slice(0,-1);

    console.log('There', decoded_fingerprint) ;

    return decoded_fingerprint;
}

let decode_ip = (ip, type) => {
  let decoded_ip = "";

  for (letter in atob(ip).split('')) {

    let piece = atob(ip).split('')[letter].charCodeAt(0).toString(16);
    if (piece.length == 1) {
      piece = "0" + piece;
    }
    decoded_ip += parseInt(piece, 16) + ".";


  }


  return type+decoded_ip.slice(0,-1);
}
