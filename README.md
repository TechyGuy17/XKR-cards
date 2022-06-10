# XKR-cards
This project is my take on how to create cards for paying with Kryptokrona (XKR) (https://kryptokrona.org)

## The base idea
**_The plan is rather simple._** 

On a server we create a **wallet**. Then when people register we create *subwallets*.
The subwallets will have some way of verifying ownership, so let's call it a *key*! 

The key will be a **Hex** number encrypted with a PIN of your choice. The Hex can then be written to something like a keycard together with a URL to the wallet. 
Using a *POS machine*, ie. an ESP8266 with a keycard reader and a numpad, we can then use the machine to read the Hex, get the PIN and find the URL.
 
Then we send the Hex, PIN and a Kryptokrona address to the owner of the ESP to the URL. 
If the wallet on the other side can find a subwallet that matches the Hex and PIN, it will send Kryptokrona from that subwallet to the XKR address.

### Why?
This project is mainly a hobby project for me to test the possibility of payment cards for XKR on the cheap. But it has the potential of evolving over time and become a viable system of paying.

#### But this isnt decentralised!
It is, but not onchain. Since the URL isnt hardcoded anyone can host their own bank and write it to their own card. I will ofcourse set up an "official" bank for the ones that don't want to.


##### Donate to the project
If you want to support the project please look here: 
https://github.com/kryptokrona/Donations

I want no money for myself and want it to instead support the main project.
