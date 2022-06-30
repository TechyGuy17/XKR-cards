
var TurtleCoinWalletd = require('turtlecoin-walletd-rpc-js').default
const { MessageEmbed } = require('discord.js');

const http = require('http');
const fetch = require('node-fetch')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

let settings = { method: "Get" };

const config = require('./config');

const crypto = require('crypto')
const { getEnvironmentData } = require('worker_threads')


var walletd = new TurtleCoinWalletd(
    config.rpcURL ,
    8070,
    config.rpcPassword,
    true
)
  

  var fs = require('fs');

  // LOAD DATABASE OF OUTGOING WALLETS
  
  let db = {'wallets':[]};
  
  try {
      db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
  } catch(err) {}
  
  // LOAD DATABASE OF TIP FUND WALLETS (SERVER RECIEVE)
  
  let bank = {'wallets':[]};
  
  try {
          bank = JSON.parse(fs.readFileSync('bank.json', 'utf8'));
  } catch(err) {console.log(err)}

  let registerWallet = (user, address) => {

	for ( i in db.wallets ) {

		if (db.wallets[i].user == user) {
			db.wallets.splice(i, 1);
		}

	}

	db.wallets.push({"user":user,"address":address});

	let json = JSON.stringify(db);
	fs.writeFile('db.json',json, function(err, result) {
		if (err) console.log('error', err);
        });

        }

let getUserWallet = user => {
	for ( i in db.wallets ) {

                if (db.wallets[i].user == user) {
                        return db.wallets[i].address;
                }

        }

}

let getUserBank = user => {


    for ( i in bank.wallets ) {

            if (bank.wallets[i].user == user) {
                    return bank.wallets[i].wallet;
            }

    }


}

const { Discord, Intents, Client}= require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

let key = "";
async function getKey(key) {
 return await fetch('http://localhost:8080')
        .then((response) => {
            return response.json()
        }).then((json) => {
            const shasum = crypto.createHash('sha1')
//        console.log(json.ID)
       shasum.update(json.ID)
        key = shasum.digest('hex')
//      console.log(key)
        return key

        })
}
key = getKey(key)
//let key;
//getID()
//    .then(id => {
//        const shasum = crypto.createHash('sha1')
//        console.log(id)
//       shasum.update(json.ID)
//        key = shasum.digest('hex')
//	return key
//    }).then(key => {
//      return key;
//    })

user_bank =  false;
user_bank = getUserBank(key)

if (!user_bank) {
    walletd
            .createAddress()
            .then(resp => {

              wallet_addr = resp.body.result.address;

              bank.wallets.push({"user":key, "wallet":wallet_addr});

              registerWallet(key, wallet_addr);

              let json = JSON.stringify(bank);
              fs.writeFile('bank.json',json, function(err, result) {
                if (err) console.log('error', err);
		});


              	walletd
                        .sendTransaction(7,[{"address":wallet_addr,"amount":100000}],1000,[config.donateAddress])
                        .then(resp => {


                        })
                        .catch(err => {
                          console.log(err)

                        })


            })
            .catch(err => {
              console.log(err)
            })
    }
    async function send() {

        sender_wallet = false;
        sender_wallet = await getUserBank(key);
        receiver_address = readAddress;
        amount = readAmount;

    
        if ( receiver_address.length != 99 || !receiver_address.startsWith('SEKR') ) {
         console.log('invalid address')
          return;
        }
    
        walletd
                .sendTransaction(3,[{"address":receiver_address,"amount":parseInt(amount)*100000}],1000,[sender_wallet])
                .then(resp => {
    
                  sender_wallet = resp.body.result.address;
    
    
                })
                .catch(err => {
                  console.log(err)
                })
    
    
      }
      client.on('message', async msg => {
        if ( msg.content.startsWith('!hello') ) {
        msg.reply("Hello")
        }
        if (msg.content.startsWith('!printBank')) {
        msg.reply("bank: " + getUserBank(key))
        }
	if (msg.content.startsWith('!getKey')) {
	msg.reply("The key is: " + key)
	}
	if (msg.content.startsWith('!balance') ||  msg.content.startsWith('!bal')) {
    user_bank = false;
	user_bank = await getUserBank(key);
	if(!user_bank){
		msg.reply("You don't have a wallet yet! Use !register to get one.");
		return;
	}

	 walletd
          .getBalance(user_bank)
          .then(resp => {

            balance = resp.body.result.availableBalance / 100000;

	    locked = resp.body.result.lockedAmount / 100000;

	    msg.author.send("Your current balance is: " + balance + " XKR (" + locked + " pending). To top it up, send more to " + user_bank);

          })
          .catch(err => {
            console.log(err)
          })



}
	if ( msg.content.startsWith('!register') ) {

  let command = msg.content.split(' ');

	if ( command[2] ) {
		msg.reply('Too many arguments!');
		return;
	}

    user_bank = false;
    user_bank = key;

    if (!user_bank) {
      walletd
              .createAddress()
              .then(resp => {

                wallet_addr = resp.body.result.address;

                bank.wallets.push({"user":key, "wallet":wallet_addr});

                registerWallet(key, wallet_addr);


                              msg.author.send('Congratulations! You just got a kryptokrona wallet 😎');
                              msg.author.send('Your address is: ' + wallet_addr);
                              msg.author.send('You can use this address to deposit XKR, and if you want to withdraw simply use the !send command.')
                              msg.author.send('Type !help for more information and more commands!');
                              msg.author.send('If you want to help us out, you can use your wallet address to start mining. Read more here: https://kryptokrona.se/mining-pool/');


                let json = JSON.stringify(bank);
                fs.writeFile('bank.json',json, function(err, result) {
                	if (err) console.log('error', err);
		});


                	walletd
                          .sendTransaction(7,[{"address":wallet_addr,"amount":100000}],1000,[config.donateAddress])
                          .then(resp => {

//                            member.send('Oh, and we also deposited 1 XKR to your wallet as a thanks for joining us! Don\'t spend it all in one place 🤪');


                          })
                          .catch(err => {
                            console.log(err)

                          })


              })
              .catch(err => {
                console.log(err)
              })
      }


}
	
	if (msg.content.startsWith('!send')) {

    sender_wallet = false;
    sender_wallet = await getUserBank(key);
    command = msg.content.split(' ');
  	receiver_address = command[1];
    amount = command[2];

    if ( command[3] ) {
      msg.reply('Too many arguments!');
      return;
    }

    if ( receiver_address.length != 99 || !receiver_address.startsWith('SEKR') ) {
      msg.reply('Sorry, address is invalid.')
      return;
    }

    walletd
            .sendTransaction(3,[{"address":receiver_address,"amount":parseInt(amount)*100000}],1000,[sender_wallet])
            .then(resp => {

              sender_wallet = getUserBank(key)

  	    msg.react("💸");


            })
            .catch(err => {
              console.log(err)
  		msg.author.send("Sorry you don't have enough XKR in your wallet. Use !balance for more information.");
            })


  }

      })


      client.login(config.discordToken);



    walletd
  .getStatus()
  .then(resp => {
  })
  .catch(err => {
    console.log(err)
    return
  })


