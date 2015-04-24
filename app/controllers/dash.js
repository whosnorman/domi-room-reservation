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

		// merge two members 
		dashController.merge = function(req, res) {
		  mergeMember(req.body['first'], req.body['second'], {
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
		  deleteRequest(req.body, {
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
		  reconfigureMembers({
		  	success: function(){
		    	resSuccess(res);
		  	},
		  	error: function(err){
		  		console.log('-- DEL REQ ERR --');
		  		console.log(err);
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