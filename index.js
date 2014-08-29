var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var request = require('request');
var logfmt = require("logfmt");

app.use(logfmt.requestLogger());

/*
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
}); */

app.post('/room', function(req, res) {
    console.log(req.body);
    res.send('test\n');
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listening on " + port);
});