var TurtleCoinWalletd = require('turtlecoin-walletd-rpc-js').default

const http = require('http');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

let settings = { method: "Get" };

const config = require('./config');

var walletd = new TurtleCoinWalletd(
    'http://localhost',
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
const crypto = require('crypto');
const shasum = crypto.createHash('sha1');

var readHex = "M5$p]Fg]x_9axJ$/==c9iU[RUdD/_RRUpxkZt2}%+SeMD=(vxnk%{MZ2%[gUzLhX";
shasum.update(readHex);
var key  = shasum.digest('hex');



user_bank = false;
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

//     walletd
//   .getStatus()
//   .then(resp => {
//   })
//   .catch(err => {
//     console.log(err)
//   })


