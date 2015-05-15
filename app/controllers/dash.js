// controller for Dash

module.exports = function(app){
	return app.dashController = (function() {
		function dashController() {}

		// return list of members
		dashController.mems = function(req, res) {
		  // pass async callback
		  app.models.db.getCollection('members', {
		  	success: function(result){
		    	res.json(result);
		  	},
		  	error: function(err){
		  		console.log('-- GET MEM ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// return list of all requests
		dashController.reqs = function(req, res) {
		  // pass async callback
		  app.models.db.getCollection('requests', {
		  	success: function(result){
		    	res.json(result);
		  	},
		  	error: function(err){
		  		console.log('-- GET REQ ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// return list of all requests
		dashController.getLasts = function(req, res) {
		  // pass async callback
		  app.models.db.getCollection('lasts', {
		  	success: function(result){
		  		console.log(' LASTS RESULT');
		  		console.log(result);
		    	res.json(result);
		  	},
		  	error: function(err){
		  		console.log('-- GET Lasts ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// return list of all requests
		dashController.setLasts = function(req, res) {
			var body = req.body;
			console.log('REQUEST BODY BELOW HERE');
			console.log(body);
			/*var values = {
			  'total': {
			  		'hours': body.total.hours,
			  		'minutes': body.total.minutes
			  },
			  'westConf': {
			  		'hours': body.westConf.hours,
			  		'minutes': body.westConf.minutes
			  },
			  'eastConf': {
			  		'hours': body.eastConf.hours,
			  		'minutes': body.eastConf.minutes
			  },
			  'floridaBlue': {
			  		'hours': body.floridaBlue.hours,
			  		'minutes': body.floridaBlue.minutes
			  },
			  'requests': body.requests,
			  'emails': body.emails
			}*/
		  // pass async callback
		  app.models.db.setLasts(body, {
		  	success: function(result){
		  		resSuccess(res);
		  	},
		  	error: function(err){
		  		console.log('-- SET Lasts ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// merge two members 
		dashController.merge = function(req, res) {
		  app.models.db.mergeMember(req.body['first'], req.body['second'], {
		  	success: function(){
		    	resSuccess(res);
		  	},
		  	error: function(err){
		  		console.log('-- MERGE ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// NOT IMPLEMENTED YET
		// delete a request  
		dashController.delreq = function(req, res) {
		  // receive request obj in body json
		  app.models.db.deleteRequest(req.body, {
		  	success: function(){
		    	resSuccess(res);
		  	},
		  	error: function(err){
		  		console.log('-- DEL REQ ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// reconfigure members
		dashController.reconfig = function(req, res) {
		  //console.log('reconfig!');
		  app.models.db.reconfigureMembers({
		  	success: function(){
		    	resSuccess(res);
		  	},
		  	error: function(err){
		  		console.log('-- Reconfig ERR --');
		  		console.log(err);
		  	}
		  });
		};

		// restart server 
		dashController.restart = function(req, res) {
		  var url = 'https://api.heroku.com/apps/' + app.env.APPNAME + '/dynos';

		  app.requestModule.del(url, function(err, response, body){
		  	if(!err && response.statusCode == 200) {
		  		resSuccess(res);
		  		console.log(response.statusCode);
		  	} else {
		  		console.log('-- Restart ERR --');
		  		console.log(err);
		  		console.log(response);
		  		console.log(body);
		  		res.send(503, false);
              	res.end();
            }
		  });
		};

		function resSuccess(res){
			res.send({success: true});
		    res.end();
		}

		return dashController;

	})();
}