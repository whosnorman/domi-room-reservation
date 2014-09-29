var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var request = require('request');
var logfmt = require("logfmt");
var bodyParser = require('body-parser');

var moment = require('moment');
var googleapis = require('googleapis');
var GoogleToken = require('gapitoken');
var OAuth2 = googleapis.auth.OAuth2;
var gcal = googleapis.calendar('v3');

//app.use(passport.initialize());
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// public calendar ID
var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';

// google API service account, calendar has been shared with this email
var serviceAcc = '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7@developer.gserviceaccount.com';

var oauthClient;

// create token
var token = new GoogleToken({
    iss: serviceAcc,
    scope: 'https://www.googleapis.com/auth/calendar',
    keyFile: './key.pem'
}, function (err) {
    if (err) {
        return console.log(err);
    }

    console.log('about to get token');

    token.getToken(function (err, tokenn) {
        if (err) {
            console.log('tokenErr: ' + err);
            return console.log(err);
        }
        else {

          //console.log(tokenn);


          // create correct times
          var now = moment().format();
          var later = moment().format();

          // create and set authorization client and necessary credentials
          oauthClient = new OAuth2('', '', '', {}, {});
          oauthClient.setCredentials({token_type: 'Bearer', access_token: tokenn});

          console.log('credentials loaded');

          /*gcal.events.insert({
            auth: oauthClient,
            calendarId: calID,
            resource: {
              summary: 'Lecture Hall - Loris Ipsum',
              description: 'Reservation made by sample@gmail.com',
              start: {
                dateTime: now
              },
              end: {
                dateTime: later
              },
              attendees: [{
                email: 'lucas@domiventures.co'
              }]
            }
          }, function(err, event){
            if (err) {
              console.log('gcalErr: ' + err);
              return console.log(err);
            } else {
              console.log(event);
              console.log(err);
              console.log('success?');
            }
          }); 

          /* look into freebusy api call for checking availability

          gcal.events.list({
            calendarId: 'primary',
            auth: oauthClient,
            maxResults: 5,
            fields: "items(end,start,status,summary)"
          }, function(err, cal){
            if (err) {
              console.log('gcalErr: ' + err);
              return console.log(err);
            } else {
              console.log(err);
              console.log(cal);
              console.log('success?');
            }
          });
          */
      }
      
    });
});


/*
app.get('/', function(req, res) {
	res.sendfile(__dirname + '/public/index.html');
}); */


app.post('/room', function(req, res) {
	var body = req.body;

  console.log(body);
  console.log("ROOM POST\n");

  // create correct times
  var now = moment(body.start);
  var later = moment(body.end);

  var title = body.room + ' - ' + body.company;
  var attendee = body.email;

  gcal.events.insert({
    auth: oauthClient,
    calendarId: calID,
    resource: {
      summary: title || 'No information recieved',
      description: 'Reservation made by sample@gmail.com',
      start: {
        dateTime: now
      },
      end: {
        dateTime: later
      },
      attendees: [{
        email: attendee
      }]
    }
  }, function(err, event){
    if (err) {
      console.log('gcalErr: ' + err);
      return console.log(err);
    } else {
      console.log(event);
      console.log(err);
      console.log('success?');
    }
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