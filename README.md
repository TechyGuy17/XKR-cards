# XKR-cards
This project is my take on how to create cards for paying with Kryptokrona (https://kryptokrona.org)

# The base idea
The plan is rather simple. On a server we create a wallet. Then when people register we create subwallets, the subwallets will have some way of verifying. Lets call it a key. The key will be a hex number encrypted with a PIN of your choice. The hex can then be written to something like a keycard together with a URL to the wallet. Then have a little machine, a ESP8266 and a keycard reader + a numpad. If we then use the machine to read the hex, get the PIN and find the URL. Then we send the hex, PIN and a kryptokrona address to the owner of the ESP to the URL, if the wallet on the other side can find a subwallet that matches the hex and PIN, then it sends XKR from that subwallet to the XKR address. 

# Why?
This project is mainly a hobby project for me to test the possibility of payment cards for XKR on the cheap. But it has the potential of evolving over time and become a viable system of paying

# But this isnt decentralised!
It is, but not onchain. Since the URL isnt hardcoded anyone can host their own bank and write it to their own card. But i will ofcourse supply an "official" bank for the ones that dont want to


# Donate to the project
If you want to support the project please look here: 
https://github.com/kryptokrona/Donations

I want no money for myself and want it to instead support the main project