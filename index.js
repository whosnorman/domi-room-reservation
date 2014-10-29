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

var mandrill = require('mandrill-api/mandrill');
var mandrillClient = new mandrill.Mandrill('x6BKz6My1EWINC6ppAeIMg');


//app.use(passport.initialize());
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//app.use('/public', express.static(__dirname + '/public'));

app.get('/robots.txt', function(req, res) {
  res.type('text/plain')
  res.send("User-agent: *\nDisallow: /");
}); 


// public calendar ID
var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';

// google API service account, calendar has been shared with this email
var serviceAcc = '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7@developer.gserviceaccount.com';

var oauthClient;

// create token & authentication
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
      summary: title,
      description: 'Reservation made by ' + body.email,
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
      console.log('attempting to send email');
      sendEmail(body, event);
    }
  }); 

	res.send(body);
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listenin\' on " + port);
}); 

// example info that is recieved from POST request
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

function sendEmail(user, ev){
  var fromEmail = "matt@domiventures.co";
  var link = ev.htmlLink;
  console.log("html link upcoming");
  console.log(link);
  var titleString;
  var signOff;

  var rand = Math.floor((Math.random() * 3) + 1);
  var rand2 = Math.floor((Math.random() * 3) + 1);

  switch(rand){
    case 1:
      titleString = "Congrats!";
      break;
    case 2:
      titleString = "Eureka!";
      break;
    default:
      titleString = "Hooray!";
      break;
  }

  switch(rand2){
    case 1:
      signOff = "If you\'re on time you\'re late!";
      break;
    case 2:
      signOff = "The early bird catches the worm!";
      break;
    default:
      signOff = "Rise and shine it\'s meeting time!";
      break;
  }
// <div style='width: 100%; background-image: url('" + domLogo + "'); background-repeat: no-repeat; background-position: fixed; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover;'>

  var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

  var msg = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1 style='color: #303030 !important'>" + titleString + " " + user.room + " has been reserved!</h1><br/><div style='color: #303030 !important'>" + link + "<br /><br />Checkout the calendar to make sure all your ducks are in a row! You can email my pal matt@domiventures.co for any problems.<br/><br/>" + signOff + "</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";

  var message = {
      "html": msg,
      "text": null,
      "subject": "Snag A Room",
      "from_email": fromEmail,
      "from_name": "Domi Station",
      "to": [{
              "email": user.email,
              "name": user.company,
              "type": "to"
          }],
      "headers": {
          "Reply-To": fromEmail
      },
      "important": false,
      "track_opens": true,
      "track_clicks": null,
      "auto_text": null,
      "auto_html": null,
      "inline_css": null,
      "url_strip_qs": null,
      "preserve_recipients": null,
      "view_content_link": null,
      "bcc_address": null,            // possibly add one?
      "tracking_domain": null,
      "signing_domain": null,
      "return_path_domain": null,
      "merge": false
      /*
      "global_merge_vars": [{
              "name": "merge1",
              "content": "merge1 content"
          }],
      "merge_vars": [{
              "rcpt": "recipient.email@example.com",
              "vars": [{
                      "name": "merge2",
                      "content": "merge2 content"
                  }]
          }],
      "tags": [
          "password-resets"
      ],
      "subaccount": "customer-123",
      "google_analytics_domains": [
          "example.com"
      ],
      "google_analytics_campaign": "message.from_email@example.com",
      "metadata": {
          "website": "www.example.com"
      },
      "recipient_metadata": [{
              "rcpt": "recipient.email@example.com",
              "values": {
                  "user_id": 123456
              }
          }],
      "attachments": [{
              "type": "text/plain",
              "name": "myfile.txt",
              "content": "ZXhhbXBsZSBmaWxl"
          }],
      "images": [{
              "type": "image/png",
              "name": "IMAGECID",
              "content": "ZXhhbXBsZSBmaWxl"
          }]
          */
  };

  var async = false;
  var ip_pool = "Main Pool";        // resets to default ip pool
  var send_at = null;               // have to pay to get this feature

  mandrillClient.messages.send({"message": message, "async": async, "ip_pool": ip_pool, "send_at": send_at}, function(result) {
      console.log('EMAIL RESULT:');
      console.log(result);
      /*      example log
      [{
              "email": "recipient.email@example.com",
              "status": "sent",
              "reject_reason": "hard-bounce",
              "_id": "abc123abc123abc123abc123abc123"
          }]
      */
  }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });

};
