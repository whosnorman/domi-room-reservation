
module.exports = function(app){

	// SNAG 

	// receive request to reserve a room
	app.post('/room',
		app.snagController.room
	);


	// DASH

	// render Dash
	app.get('/dash', function(req, res) {
	  res.sendfile(__dirname + '/public/dashboard.html');
	});

	// return list of all members
	app.get('/mems', 
		app.dashController.mems
	);

	// return list of all requests
	app.get('/reqs', 
		app.dashController.reqs
	);

	// merge two members 
	app.post('/merge', 
		app.dashController.merge
	);

	// NOT IMPLEMENTED YET
	// delete request  
	app.post('/delreq', 
		app.dashController.delreq
	);

	// reconfigure members
	app.post('/reconfig', 
		app.dashController.reconfig
	);


	// OTHER 

	// render robots.txt
	app.get('/robots.txt', function(req, res) {
	  res.type('text/plain');
	  res.send("User-agent: *\nDisallow: /");
	}); 


	// 404
	// always have this route last
	app.get('*', function(req, res){
		res.type('text/plain');
	  	res.send("404 Not Found, Ask Dom.");
	  //res.sendfile(__dirname + '/public/404.html');
	});


}