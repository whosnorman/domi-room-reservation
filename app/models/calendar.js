// model for gcal interactions

// public calendar ID
var calID = 'domiventures.co_e1eknta8nrohjg1lhrqmntrla4@group.calendar.google.com';
// google API service account, calendar has been shared with this email
var serviceAcc = '129929270786-v8e3h1rkota9bskfk0a3e4gidobc2pn7@developer.gserviceaccount.com';
var oauthClient;
var token;

var OAuth2 = app.googleapis.auth.OAuth2;
var gcal = app.googleapis.calendar('v3');

module.exports = function(app) {
	return app.models.calendar = (function() {
		// constructor
		function calendar() {
			auth();
		}

		calendar.add = function(body, callback) {
			if(checkEvents(body, callback))
				addEvent(body, callback);
		};

		return calendar;
	})();
}

// check google calendar for existing 
// reservation in the same room
function checkEvents(body, callback){
	var resp = true;
	var start = new Date(body.start).toISOString();
		var end = new Date(body.end).toISOString();
	
	// check for existing events
  	app.gcal.events.list({
	    auth: oauthClient,
	    calendarId: calID,
	    'timeMin': start,
	    'timeMax': end
	}, function(err, response){
      if(err){
        callback.error(err);
        resp = false;
      } else {
      	// no event exists if length == 0
      	if(response.items.length != 0){
      	  // go through events to check rooms
          for(var i = 0; i < response.items.length; i++){
            var evnt = response.items[i];

            // check if event is the same room as request
            if(evnt.summary.search(body.room) != -1){
              var hostName = evnt.description.substring(19);
              var lng = body.room.length;
              var hostName = evnt.summary.substring(lng + 3);
              //console.log('HOST: ' + hostName);

              var message = 'Unfortunately, the ' + body.room + ' has already been snagged by ' + hostName + ' at that time. Check the calendar above for available rooms!';

              callback.exists(message);
              resp = false;

              break;
            }         
          }
        }
      }
    });
	
	return(resp);
}

// add event to google calendar
function addEvent(body, callback){
	// create correct times
    var now = app.moment(body.start);
	var later = app.moment(body.end);

	var title = body.room + ' - ' + body.company;
	var attendee = body.email;

	// insert new event
    app.gcal.events.insert({
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
          
          // try to re-authenticate
          auth();  

          callback.error(err)
        } else {  
          callback.success(event);
        }
    }); 
}
  

// authenticate with gcal services
function auth() {
  token = new app.GoogleToken({
      iss: serviceAcc,
      scope: 'https://www.googleapis.com/auth/calendar',
      keyFile: '../../key.pem'
  }, function (err) {
      if (err) {
          console.log('--TOKEN ERR--:\n' + err);
          app.snagController.errorEmail(err);
          return console.log(err);
      }

      token.getToken(function (err, tokenn) {
          if (err) {
              console.log('-- TOKEN ERR --: \n' + err);
              app.snagController.errorEmail(err);
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
}

