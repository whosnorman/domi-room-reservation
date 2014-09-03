var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var request = require('request');
var logfmt = require("logfmt");

app.use(logfmt.requestLogger());
app.use(express.bodyParser());

/*
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
}); */

app.post('/room', function(req, res) {
	var body = req.body;
    console.log(body);
    console.log("ROOM\n");
    res.send(body);
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listening on " + port);
});