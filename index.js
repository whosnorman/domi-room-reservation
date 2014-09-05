var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var request = require('request');
var logfmt = require("logfmt");
var bodyParser = require('body-parser');

var config = require('./config');
var gcal = require('google-calendar');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oatuh').OAuth2Strategy;

var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';

app.use(passpot.initialize());
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

/*
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
}); */

passport.use(new GoogleStrategy({
	clientID: config.consumer_key,
	clientSecret: config.consumer_secret,
	callbackURL: "http://localhost:5000/auth/callback",
	scope: ['openid', 'email', 'https://googleapis.com/auth/calendar']
  },
  function(accessToken, refreshToken, profile, done) {
  	profile.accessToken = accessToken;
  	return done(null, profile);
  }
));

app.get('/auth', 
	passport.authenticate('google', {session: false}));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });

app.post('/room', function(req, res) {
	var body = req.body;

    console.log(body);
    console.log("ROOM POST\n");

    //schedule(body);

    if(!req.session.access_token) return res.redirect('/auth');
  
	var accessToken     = req.session.access_token;
	var text            = body.room + ' ' + body.company;

	gcal(accessToken).events.quickAdd(calID, text, function(err, data) {
		if(err) return res.send(500,err);
		return res.redirect('/');
	});

	res.send(body);
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listenin\' on " + port);
});


function schedule(info){
	var email = info.email;
	var company = info.company;
	var room = info.room;
	var date = info.date;
	var start = info.start;
	var end = info.end;

	console.log(email);
	console.log(company);
	console.log(room);
};

/*
app.all('/add', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = calID;
  var text            = req.query.text || 'Hello World';
  
  gcal(accessToken).events.quickAdd(calendarId, text, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/');
  });
});
*/