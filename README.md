# XKR-cards
This project is my take on how to create cards for paying with Kryptokrona (https://kryptokrona.org)

# The base idea
The plan is rather simple. If we create wallets with a set number, lets say 100 XKR. And then make 5 of those. We have 500 XKR worth of wallets, if we then would take the private and public key of those and program to a keycard we can let devices take those keys and use them to get out the money from the wallets, on the keycard  wil also be a pre-programmed address for the POS machine to send the change to. This system would make the XKR safe because even if the cards got hacked, they can only access the XKR on the card. Wich are small amounts and wouldnt matter in the same way. To refill a card you just have to reprogram the cards with new wallets.

The POS machines idea is also rather simple, as a start we have a ESP8266 with a NFC reader, when the ESP reads a card it saves the data as a json. The reason for the ESP is the addition of Wi-Fi that makes it possible to host a webserver with the json on. A host computer can then download the json and use the data to access the wallets and count the XKR. All change would go to the card owner

```mermaid
flowchart LR
id1(Card: Wallets, change address) --> id2(Scanner: ESP8266 takes in raw data, returns JSON to POS machine);
id2(Scanner: ESP8266 takes in raw data, returns JSON to POS machine) --> --> id3(POS machine: Uses the wallets to get out the money form wallets, sends change to change address);
    
```

# Why?
This project is mainly a hobby project for me to test the possibility of payment cards without a bank. Only decentralized machines that anyone can host. But it has the potential of evolving over time and become a viable system of paying


# Donate to the project
If you want to support the project please look here: 
https://github.com/kryptokrona/Donations

I want no money for myself and want it to instead support the main project