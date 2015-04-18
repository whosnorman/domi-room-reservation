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
		  	  insertMember(body);
		  	  insertReq(body);

		  	  // send user success email
		  	  sendEmail(body, event);

              res.send({success: true});
              res.end();
		  	},
		  	exists: function(msg){
		  	  // event already exists
	          res.send(500, {error: msg});
	          res.end();
		  	},
		  	error: function(err){
			  console.log(err);
		  	  // send user and admin error emails
              sendErrMail(err, body);

              res.send(503, false);
              res.end();
		  	}
		  });
		  
		};

		return snagController;

	})();
}