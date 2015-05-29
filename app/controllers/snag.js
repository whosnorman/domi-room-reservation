// controller for Snag @ domistation.com/reservations

module.exports = function(app){
	return app.snagController = (function() {
		function snagController() {}

		// receive request to reserve a room
		snagController.room = function(req, res) {
		  var body = req.body;
		  
		  // pass callback as an object
		  app.models.calendar.add(body,{
		  	success: function(event){
		  	  // for tracking id in mongodb
		  	  body.id = event.id;

		  	  // insert into database
		  	  app.models.db.insertMember(body, {
			  	success: function(){
			  		res.send({success: true});
              		res.end();
			  	},
			  	error: function(err){
			  		console.log('-- INSERT REQ ERR --');
			  		console.log(err);
			  	}			  	
			  });

		  	  // insert request into mongo
		  	  app.models.db.insertRequest(body, {
			  	error: function(err){
			  		console.log('-- INSERT REQ ERR --');
			  		console.log(err);
			  	}
			  });

		  	  // send user success email
		  	  snagController.successEmail(body, event);	
              
		  	},
		  	exists: function(msg){
		  	  // event already exists
	          res.send(500, {error: msg});
	          res.end();
		  	},
		  	error: function(err){
			  console.log(err);
		  	  // send user and admin error emails
              snagController.errorEmail(err, body);

              res.send(503, false);
              res.end();
		  	}
		  });
		  
		};

		snagController.successEmail = function(user, ev){
			// build email body message
			// then call email model to send
		
			// link to google calendar event
			var link = ev.htmlLink;
			var titleString;
			var signOff;

			var titleRand = Math.floor((Math.random() * 10) + 1);
			var signOffRand = Math.floor((Math.random() * 6) + 1);

			switch(titleRand){
			case 1:
			  titleString = "Congrats!";
			  break;
			case 2:
			  titleString = "Eureka!";
			  break;
			case 3:
			  titleString = "Voila!";
			  break;
			case 4:
			  titleString = "Yippee!";
			  break;
			case 5:
			  titleString = "Huzzah!";
			  break;
			case 6:
			  titleString = "Bravo!";
			  break;
			case 7:
			  titleString = "Jeepers!";
			  break;
			case 8:
			  titleString = "Hurrah!";
			  break;
			case 9:
			  titleString = "Egad!";
			  break;
			default:
			  titleString = "Hooray!";
			  break;
			}

			switch(signOffRand){
			case 1:
			  signOff = "If you\'re on time you\'re late!";
			  break;
			case 2:
			  signOff = "The early bird catches the worm!";
			  break;
			case 3:
			  signOff = "Done is better than perfect.";
			  break;
			case 4:
			  signOff = "Fear is the disease. Hustle is the antidote."
			  break;
			case 5:
			  signOff = "It\'s not about ideas. It\'s about making ideas happen."
			  break;
			default:
			  signOff = "Rise and shine it\'s meeting time!";
			  break;
			}

			var ev = {};
			//var options = {hour: "numeric", minute: "numeric"};
			var evDate = new Date(user.start);
			ev.month = evDate.getMonth() + 1;
			ev.day = evDate.getDay();
			ev.date = evDate.getUTCDate();
			ev.year = evDate.getUTCFullYear();
			//var startString = evDate.toLocaleTimeString("en-US", options);
			var startString = app.moment(evDate).zone("-04:00").format('h:mma');
			//var start = evDate.getUTCHours();
			evDate = new Date(user.end);
			//var end = evDate.getUTCHours();
			//var endString = evDate.toLocaleTimeString("en-US", options);
			var endString = app.moment(evDate).zone("-04:00").format('h:mma');

			var startToEnd = startString + " - " + endString;

			var subjectLine = "Room Snagged: " + startString + "-" + endString + " " + ev.month + "/" + ev.date;

			var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

			var monthString = app.helpers.intToMonth(ev.month);
			var dayString = app.helpers.intToDay(ev.day);

			var msg = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1>" + titleString + "</h1><br/><h2>" + user.room + "</h2> has been reserved for<br/><h2>" + startToEnd + "</h2> on <br/><h2>" + dayString + ", " + monthString + " " + ev.date + ", " + ev.year + "</h2><br/><br/><div style='color: #303030 !important'>" + link + "<br /><br />Checkout the calendar to make sure all your ducks are in a row! You can email my pal " + app.adminEmail + " for any problems.<br/><br/>" + signOff + "</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";


			// send email
			app.models.email.snagSuccess(msg, user, subjectLine);
		};

		snagController.errorEmail = function(err, user){
			var domLogo = "https:\/\/www.dropbox.com\/s\/wweksdd33iruxyp\/Dom_Eyes.png?raw=1";

			var messageToUser = "<body style='color: #303030 !important;'><div><img style='max-width: 30em; max-height: 200px;' src='" + domLogo + "' /></div><h1 style='color: #303030 !important'>Oops! I knocked over a server rack!</h1><br/><div style='color: #303030 !important'> Unfortunately your room was not reserved. Wait a couple minutes and try again, but if you stil get this email forward it to my buddy " + app.adminEmail + "<br /><br /><br/><br/>Have a great day!</div><br/><div style='color: #303030 !important'>-- Dom</div></body>";

			app.models.email.snagError(err, user, messageToUser);
		};

		return snagController;

	})();
}