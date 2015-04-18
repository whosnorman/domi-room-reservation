var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

// configure app
require('./config')(app);

// set up routes
require('./routes')(app);

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listenin\' on " + port);
}); 