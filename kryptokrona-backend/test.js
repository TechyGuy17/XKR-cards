var http = require('http');

//create a server object:
http.createServer(function (req, res) {
  res.write('{"ID":"M5$p]Fg]x_9axJ$/==c9iU[RUdD/_RRUpxkZt2}%+SeMD=(vxnk%{MZ2%[gUzLhX"}'); //write a response to the client
  res.end(); //end the response
}).listen(8080); //the server object listens on port 8080
