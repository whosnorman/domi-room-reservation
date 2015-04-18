// controller for Snag @ domistation.com/reservations

module.exports = function(app){
	return app.snagController = (function() {
		function snagController() {}

		// receive request to reserve a room
		snagController.room = function(req, res) {

		  var body = req.body;
		  
		  // console.log(body);
		  // console.log("--ROOM POST--\n");

		  // create correct times
		  var now = moment(body.start);
		  var later = moment(body.end);

		  var title = body.room + ' - ' + body.company;
		  var attendee = body.email;

		  var start = new Date(body.start).toISOString();
		  var end = new Date(body.end).toISOString();
		  // console.log('start: ' + start + '   end: ' + end);
		  
		  // check for existing events
		  gcal.events.list({
		    auth: oauthClient,
		    calendarId: calID,
		    'timeMin': start,
		    'timeMax': end
		    }, function(err, response){
		      if(err){
		        console.log('err:' + err);
		        res.send(503, false);
		        res.end();
		      } else {
		        var exists = 'nope';

		        if(response.items.length == 0){
		          console.log('NO EVENTS!');
		        } else {
		          console.log(body.room);

		          for(var i = 0; i < response.items.length; i++){
		            var evnt = response.items[i];

		            if(evnt.summary.search(body.room) != -1){
		              var hostName = evnt.description.substring(19);
		              var lng = body.room.length;
		              var hostName = evnt.summary.substring(lng + 3);
		              console.log('HOST: ' + hostName);

		              exists = 'Unfortunately, the ' + body.room + ' has already been snagged by ' + hostName + ' at that time. Check the calendar above for available rooms!';

		              break;
		            }         
		          }
		        }

		        if(exists != 'nope'){
		          // event already exists
		          res.send(500, {error: exists});
		          res.end();
		        } else {
		          // insert new event
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
		              res.send(503, false);
		              res.end();
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
		        }
		      }
		  });
		};

		return snagController;

	})();
}