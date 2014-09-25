var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var request = require('request');
var logfmt = require("logfmt");
var bodyParser = require('body-parser');

/*
var config = require('./config');
var gcal = require('google-calendar');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oatuh').OAuth2Strategy;
*/

var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';

//app.use(passport.initialize());
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


var clientID = '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7.apps.googleusercontent.com';

var moment = require('moment');
var googleapis = require('googleapis');
var GoogleToken = require('gapitoken');
var OAuth2 = googleapis.auth.OAuth2;
var gcal = googleapis.calendar('v3');



var token = new GoogleToken({
    iss: '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7@developer.gserviceaccount.com',
    scope: 'https://www.googleapis.com/auth/calendar',
    keyFile: './key.pem'
}, function (err) {
    if (err) {
        return console.log(err);
    }

    console.log('about to get token');

    token.getToken(function (err, token) {
        if (err) {
            console.log('tokenErr: ' + err);
            return console.log(err);
        }
        else {

          console.log(token);

          var now = moment().format();
          var later = moment().format();

          var oauthClient = new OAuth2('', '', '', {}, {
                  token_type: 'Bearer',
                  access_token: token
              });

          console.log(oauthClient);

          gcal.events.insert({
            auth: oauthClient,
            calendarId: calID,
            resource: {
              summarty: 'test event',
              description: 'hangout',
              start: {
                dateTime: now
              },
              end: {
                dateTime: later
              },
              attendees: [{
                email: 'matt@domiventures.co'
              }]
            }
          }, function(err){
            if (err) {
              console.log('gcalErr: ' + err);
              return console.log(err);
            } else {
              console.log('success?');
            }
          });
      }


        /*
        gcal.get({auth: oauthClient }, function(err, client) {
            if (err) {
            console.log('theres a gcal error');
            return console.log(err);
            }     
            

            console.log('calendar API loaded');

            var now = moment().format();
            var later = moment().format();
            later.hour(3);

            client
                .calendar
                .events
                .insert({
                    calendarId: calID, // 'primary'
                    resource: {
                        summary: 'test event',
                        description: 'hangout',
                        reminders: {
                            overrides: {
                                method: 'popup',
                                minutes: 0
                            }
                        },
                        start: {
                            dateTime: now
                        },
                        end: {
                            dateTime: later
                        },
                        attendees: [{
                            email: 'matt@domiventures.co'
                        }]
                    }
                })
                .withAuthClient(oauthClient)
                .execute(function (err, event) {

                    console.log(event);
                });
        }); */
    });
});

console.log('here');





/*
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
}); */

/*

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
	passport.authenticate('google', {session: false})
  );

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });

function auth() {

} */

app.post('/room', function(req, res) {
	var body = req.body;

    console.log(body);
    console.log("ROOM POST\n");

    schedule(body);

    //if(!req.session.access_token) return res.redirect('/auth');
  
	//var accessToken     = req.session.access_token;
	var text            = body.room + ' ' + body.company;

	/*gcal(accessToken).events.quickAdd(calID, text, function(err, data) {
		if(err) return res.send(500,err);
		return res.redirect('/');
	}); */

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