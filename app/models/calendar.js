// model for gcal interactions

var token;
var OAuth2;
var gcal;
var app;

module.exports = function(ap) {
  app = ap;
  OAuth2 = app.googleapis.auth.OAuth2;
  gcal = app.googleapis.calendar('v3');

	return app.models.calendar = (function() {
		function calendar() {}

    // initial authentication
    auth();

		calendar.add = function(body, callback) {
      checkEvents(body, callback, function(isFree){
        if(isFree){
          addEvent(body, callback);
        }
      });
		};

		return calendar;
	})();
}

// check google calendar for existing 
// reservation in the same room
// used as a middleware of sorts when an event is attempted to be added
function checkEvents(body, callback, whenDone){
	var resp = true;
	var start = new Date(body.start).toISOString();
	var end = new Date(body.end).toISOString();
	
  // authenticate before trying to make api call
  auth(function(){
    // check for existing events
    gcal.events.list({
        auth: app.googleOauthClient,
        calendarId: app.env.CALID,
        'timeMin': start,
        'timeMax': end
    }, function(err, response){
        if(err){
          console.log('- EVENTS LIST ERR - ');
          console.log(err);
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

                resp = false;

                callback.exists(message);
                
                break;
              }         
            }
          }
        }

        whenDone(resp);
    });
  });
	
}

// add event to google calendar
function addEvent(body, callback){
	// create correct times
  var now = app.moment(body.start);
	var later = app.moment(body.end);

	var title = body.room + ' - ' + body.company;
	var attendee = body.email;

  try{
    // insert new event
    gcal.events.insert({
        auth: app.googleOauthClient,
        calendarId: app.env.CALID,
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
        console.log('-- GCAL ERR --');
        throw err;
      } else {  
        callback.success(event);
      }
    }); 
  } catch(err) {
    console.log('--- ADD EVENT ERROR THROWN -');
    console.log(err);
    callback.error(err);
  }

	
}
  

// authenticate with gcal services
// optional callback
function auth(done) {
  token = new app.GoogleToken({
      iss: app.env.SERVICEACC,
      scope: 'https://www.googleapis.com/auth/calendar',
      keyFile: 'key.pem'
  }, function (err) {
      if (err) {
          console.log('--TOKEN ERR--');
          console.log(err);
          
          app.snagController.errorEmail(err);
          return console.log(err);
      }

      token.getToken(function (err, toke) {
          if (err) {
              console.log('-- GET TOKEN ERR --:');
              console.log(err);
              app.snagController.errorEmail(err);
          } else {
            // create and set authorization client and necessary credentials
            app.googleOauthClient = new OAuth2('', '', '', {}, {});
            app.googleOauthClient.setCredentials({token_type: 'Bearer', access_token: toke});

            if(done){
              done();
            }
            console.log('Credentials Loaded');
          }
      });
  });
}

