var express = require('express');
var app = express();

var http = require('http');
var server = http.Server(app);

app.express = express;

// configure app
require('./config')(app);

// set up routes
require('./routes')(app);

var port = Number(process.env.PORT || 8080);
server.listen(port, function() {
   console.log("Listenin\' on " + port);
}); 
