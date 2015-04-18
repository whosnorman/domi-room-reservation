// controller for Dash

module.exports = function(app){
	return app.dashController = (function() {
		function dashController() {}

		// return list of members
		dashController.mems = function(req, res) {
		  // pass async callback
		  getCollection('members', function(result){
		    res.json(result);
		  });
		};

		// return list of all requests
		dashController.reqs = function(req, res) {
		  // pass async callback
		  getCollection('requests', function(result){
		    res.json(result);
		  });
		};

		// merge two members 
		dashController.merge = function(req, res) {
		  mergeMember(req.body['first'], req.body['second'], function(){
		    res.send({success: true});
		    res.end();
		  });
		};

		// NOT IMPLEMENTED YET
		// delete a request  
		dashController.delreq = function(req, res) {
		  // receive request obj in body json
		  deleteRequest(req.body, function(){
		    res.send({success:true});
		    res.end();
		  });
		};

		// reconfigure members
		dashController.reconfig = function(req, res) {
		  //console.log('reconfig!');
		  reconfigureMembers(function(){
		    // callback function
		    res.send({success: true});
		    res.end();
		  });
		};

		return dashController;

	})();
}