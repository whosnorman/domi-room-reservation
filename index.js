
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

var express = require('express');
var app = express();

app.use(allowCrossDomain);

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

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

//app.use(passport.initialize());
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use("/public", express.static(__dirname + '/public'));
app.use("/js", express.static(__dirname + '/public/js'));
app.use("/css", express.static(__dirname + '/public/css'));
app.use("/img", express.static(__dirname + '/public/img'));
app.use("/font", express.static(__dirname + '/public/font'));

app.get('/robots.txt', function(req, res) {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /");
}); 

app.get('/dash', function(req, res) {
  res.sendfile(__dirname + '/public/dashboard.html');
});

app.get('/mems', function(req, res) {
  // pass async callback
  getCollection('members', function(result){
    res.json(result);
  });
});

app.get('/reqs', function(req, res) {
  // pass async callback
  getCollection('requests', function(result){
    res.json(result);
  });
});

app.post('/merge', function(req, res) {
  mergeMember(req.body['first'], req.body['second'], function(){
    res.send({success: true});
    res.end();
  });
});

app.post('/delreq', function(req, res) {
  // receive request obj in body json
  deleteRequest(req.body, function(){
    res.send({success:true});
    res.end();
  });
});

app.post('/reconfig', function(req, res) {
  reconfigureMembers(function(){
    res.send({success: true});
    res.end();
  });
});

// TODO: change keys

// public calendar ID
var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';
// google API service account, calendar has been shared with this email
var serviceAcc = '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7@developer.gserviceaccount.com';
var oauthClient;
var MONGOHQ_URL = process.env.MONGOHQ_URL;


// insert request into a mongodb collection
function insertReq(request) {
  var r = request;

  MongoClient.connect(MONGOHQ_URL, function(err, db){
    if(err){
      return console.error(err);
    }

    var collection = db.collection('requests');

    console.log('about to add new doc');

    var doc = {
      'email': r.email,
      'start': r.start,
      'end': r.end,
      'room': r.room,
      'company': r.company,
      'event_id': r.id
    }

    collection.insert([doc], function(err, docs) {
      if (err) {
        return console.error(err);
      }
      
      console.log('added new req');
    });
  });
} 

function deleteRequest(request, callback){
  // delete event from gcal
  // subtract hours from correct month
  // delete request from request collection
}

// merge two member documents
function mergeMember(one, two, callback){
  MongoClient.connect(MONGOHQ_URL, function(err, db){
    if(err){
      return console.error(err);
    }

    var collection = db.collection('members');

    findMember(one, function(first){
      findMember(two, function(second){

        // combine email arrays
        collection.update(
          {_id: ObjectID(second._id)}, 
          {$addToSet: {users: {$each: first.users}}},
          function(err, count, status){
            if(err)
              console.error(err);
          }
        );

        // add company name to aliases
        collection.update(
          {_id: ObjectID(second._id)}, 
          {$addToSet: {aliases: first.company}},
          function(err, count, status){
            if(err)
              console.error(err);
          }
        );

        // add aliases to aliases
        collection.update(
          {_id: ObjectID(second._id)}, 
          {$addToSet: {aliases: {$each: first.aliases}}},
          function(err, count, status){
            if(err)
              console.error(err);
          }
        );

        // update hours in json format
        // loop through years in first
        for (var year in first.years){
          // if that year is already in second
          if(second.years.hasOwnProperty(year)){
            // loop through months in the year in first
            for (var month in first.years[year]){
              // if that month and year are already in second
              if(second.years[year].hasOwnProperty(month)){
                second.years[year][month] += first.years[year][month];
              } else {
                // month not already in second
                second.years[year][month] = first.years[year][month];
              }
            }
          } else {
            // year not already in second
            second.years[year] = {};
            for (var month in first.years[year]){
              if(first.years[year].hasOwnProperty(month)){
                second.years[year][month] = first.years[year][month];
              }
            }
          }
        }

        // remove first member doc
        collection.remove({_id: ObjectID(first._id)});

        collection.update(
          {_id: ObjectID(second._id)}, 
          {$set: {years: second.years}},
          function(err, count, status){
            if(err)
              console.error(err);

            // callback to original post request
            callback();
          }
        );
      });
    });

    function findMember(id, returnMem){
      collection.find({_id: ObjectID(id)}).toArray(function(err, members){
        if(err)
          console.error(err);

        returnMem(members[0]);
      });
    }

  });
}

// insert or update relevant member document
function insertMember(mem, callback){
  // connect to database
  MongoClient.connect(MONGOHQ_URL, function(err, db){
    if(err){
      return console.error(err);
    }

    var collection = db.collection('members');
    // uses mem in getDetails
    var ev = getDetails();

    // search to see if there is an existing member doc to update
    // look through all companies
    collection.find({company: mem.company}).toArray(function (err, members){
      if (err)
        console.error(err);

      // no company matches
      if(members[0] == null){
        console.log("no member found for " + mem.company);
        //console.log(members);
        // look through all aliases
        collection.find({aliases: mem.company}).toArray(function(err, members){
          if (err) 
            console.error(err);

          // no alias matches
          if (members[0] == null){
            // look through all users
            collection.find({users: mem.email}).toArray(function(err, members){
              if(err)
                console.error(err);

              // no user matches
              if (members[0] == null){
                // no part of member found, create new doc
                insertNewMember();
              } else {
                // email found in a doc
                updateAliases(members[0]);
                updateHours(members[0]);
              }
            });
          } else {
            // alias found in a doc
            updateUsers(members[0]);
            updateHours(members[0]);
          }
        });
      } else {
        // company found in a doc
        //console.log(members);
        updateUsers(members[0]);
        updateHours(members[0]);
      }
    });
    // above function will either insertNewMember or 
    // updateHours, callback has been placed in those


    /// update functions ///
    function updateUsers(member){
      collection.update(
        {company: member.company}, 
        {$addToSet: {users: mem.email}},
        function(err, count, status){
          if(err)
            console.error(err);
        }
      );
    }

    function updateAliases(member){
      collection.update(
        {company: member.company}, 
        {$addToSet: {aliases: mem.company}},
        function(err, count, status){
          if(err)
            console.error(err);
        }
      );
    }

    function updateHours(member){
      //console.log(member.years);

      if(ev.year == 2015){
          console.log('//--//');
          console.log(ev.month);
          console.log(member.company);
          console.log(member.years);
          console.log('//--//');
        }

      // check if the event year is already a key
      if(member.years.hasOwnProperty(ev.year)){
        if(ev.year == 2015){
            
        }
        // check if the event month is already a key
        if(member.years[ev.year].hasOwnProperty(ev.month)){
          var hours = member['years'][ev.year][ev.month];

          var increment = member['years'];
          increment[ev.year][ev.month] = (ev.duration + hours);

          /*if(ev.year == 2015){
            console.log('----2015 month----------');
            console.log(ev.month + ' | ' + ev.duration + ' | ' + hours);
            console.log(increment);
            console.log(member.years);
            console.log('------------------------');
          }*/

          // year and month already exist, update hours
          collection.update(
            {company: member.company}, 
            {$set: {years: increment}},
            function(err, count, status){
              if(err)
                console.error(err);

              if(callback){
                callback();
              }
            }
          );
        } else {
          // create new month object
          var newYears = member['years'];

          newYears[ev.year][ev.month] = ev.duration;

          collection.update(
            {company: member.company}, 
            {$set: {years: newYears}},
            function(err, count, status){
              if(err)
                console.error(err);

              if(callback){
                callback();
              }
            }
          );
        }
      } else {
        // create new year object
        var newYears = member['years'];

        if(ev.year == 2015){
          console.log('//// new 2015 ////');
          console.log(ev.month + ' | ' + ev.duration);
          console.log(newYears);
          console.log(member.years);
        }

        newYears[ev.year] = {};
        newYears[ev.year][ev.month] = ev.duration;

        if(ev.year == 2015){
          console.log('---');
          console.log(newYears);
          console.log(member.years);
          console.log('////////////');
        }

        collection.update(
          {company: member.compay},
          {$set: {years: newYears}},
          function(err, count, status){
            if(err)
              console.error(err);

            if(callback){
              callback();
            }
          }
        );
      }
    }

    // create new member doc
    function insertNewMember(){

      // create doc
      var newMem = {
        'company': mem.company,
        'years': {},
        'users': [mem.email],
        'aliases': []
      }

      newMem['years'][ev.year] = {};
      newMem['years'][ev.year][ev.month] = ev.duration;

      // insert new member 
      collection.insert(newMem, function(err, docs) {
        if (err) {
          return console.error(err);
        }
        // for reconfigureMembers
        if(callback){
          callback();
        }
        console.log('added new member ' + mem.company);
      });
    }

    // calculate and return event details
    function getDetails(){
      var ev = {};

      var evDate = new Date(mem.start);
      ev.year = evDate.getFullYear();
      ev.month = evDate.getMonth() + 1;
      var start = evDate.getUTCHours();
      evDate = new Date(mem.end);
      var end = evDate.getUTCHours();

      // calculate duration
      if(start > end)
        end += 24;
      ev.duration = end - start;

      return ev;
    }

  });
}

// clear current members collection and 
// rerun sorting logic on existing requests
function reconfigureMembers(callback){
  MongoClient.connect(MONGOHQ_URL, function(err, db){
    if(err){
      return console.error(err);
    }
    var coll = db.collection('members');

    coll.remove(function(err, numRemoved){
      var collection = db.collection('requests');

      collection.find({}).toArray(function (err, items){
        if (err) {
          return console.error(err);
        }
        
        var i = 0;

        function config(){
          insertMember(items[i], function(){
            if(i < items.length - 1){
              i++;
              config();
            }
            else{
              console.log('-- DONE WITH LOOP --');
              callback();
            }
          });
        }

        // init call
        config();

      });
    });
  });
}




// look up all docs in the requests collection
function getCollection(coll, callback){
  MongoClient.connect(MONGOHQ_URL, function(err, db){
    if(err){
      return console.error(err);
    }

    var collection = db.collection(coll);

    collection.find({}).toArray(function (err, items){
      if (err) {
        return console.error(err);
      }
     
      callback(items);
    });
  });
}

/* for testing purposes
insertReq({
      'email': 'test email',
      'start': 'start time',
      'end': 'end time',
      'room': 'west conference',
      'company': 'company name'
    });
*/


// create initial token & authentication 
var token = new GoogleToken({
    iss: serviceAcc,
    scope: 'https://www.googleapis.com/auth/calendar',
    keyFile: './key.pem'
}, function (err) {
    if (err) {
        console.log('--TOKEN ERR--:\n' + err);
        sendErrMail(err);
        return console.log(err);
    }

    token.getToken(function (err, tokenn) {
      if (err) {
          console.log('-- TOKEN ERR --: \n' + err);
          sendErrMail(err);
          return console.log(err);
      }
      else {
        // create and set authorization client and necessary credentials
        oauthClient = new OAuth2('', '', '', {}, {});
        oauthClient.setCredentials({token_type: 'Bearer', access_token: tokenn});

        console.log('credentials loaded');
      }
    });
});

// for more auth attempts, sends an email in case of errors
function reAuthAttempt() {
  var token = new GoogleToken({
      iss: serviceAcc,
      scope: 'https://www.googleapis.com/auth/calendar',
      keyFile: './key.pem'
  }, function (err) {
      if (err) {
          console.log('--TOKEN ERR--:\n' + err);
          sendErrMail(err);
          return console.log(err);
      }

      token.getToken(function (err, tokenn) {
          if (err) {
              console.log('-- TOKEN ERR --: \n' + err);
              sendErrMail(err);
              return console.log(err);
          }
          else {
            // create and set authorization client and necessary credentials
            oauthClient = new OAuth2('', '', '', {}, {});
            oauthClient.setCredentials({token_type: 'Bearer', access_token: tokenn});

            console.log('credentials reloaded');
          }
      });
  });
}


app.post('/room', function(req, res) {
	var body = req.body;

  console.log(body);
  console.log("--ROOM POST--\n");

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
      description: 'Reservation made by ' + attendee,
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
      console.log('-- GCAL ERR-- : ' + err);
      reAuthAttempt();
      sendErrMail(err, body);
      res.send(false);
      return console.log(err);
    } else {  
      console.log(event);
      console.log('attempting to send email');
      res.send({success: true});
      res.end();
      // insert into mongodb collections
      insertMember(body);
      body.id = event.id;
      insertReq(body);
      // send confirmation email
      sendEmail(body, event);
    }
  }); 
});

var port = Number(process.env.PORT || 5000);
server.listen(port, function() {
   console.log("Listenin\' on " + port);
}); 

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
      console.log('--EMAIL RESULT--:');
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
      sendErrMail({name: e.name, message: e.message});
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });

};




function sendErrMail(err, user){
  var myEamil = "matt@domiventures.co";
  console.log('--ERROR BELOW--');
  console.log(err);

  var now = moment().format();

  var msg = "<body style='color: #303030 !important;'><h1>There was an error!</h1><br /><p>" + err + "</p><br /><p>" + now + "</p></body>";

  var message = {
      "html": msg,
      "text": null,
      "subject": "Snag A Room",
      "from_email": myEmail,
      "from_name": "Domi Station",
      "to": [{
              "email": myEmail,
              "name": 'Server Errors',
              "type": "to"
          }],
      "headers": {
          "Reply-To": myEamil
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
      console.log('-- EMAIL RESULT--:');
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
      sendErrMail({name: e.name, message: e.message});
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });




  /*  NOW SEND USER AN ERROR EMAIL */
  if(user) {

      var fromEmail = "matt@domiventures.co";

  // <div style='width: 100%; background-image: url('" + domLogo + "'); background-repeat: no-repeat; background-position: fixed; -webkit-background-size: cover; -moz-background-size: cover; -o-background-size: cover; background-size: cover;'>

    var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

    var msg = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1 style='color: #303030 !important'>Oops! I knocked over a server rack!</h1><br/><div style='color: #303030 !important'> Unfortunately your room was not reserved. Wait a couple minutes and try again, but if you stil get this email forward it to my buddy matt@domiventures.co<br /><br /><br/><br/>Have a great day!</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";

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
        console.log('--EMAIL RESULT--:');
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
        sendErrMail({name: e.name, message: e.message}, user);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
  }

};
