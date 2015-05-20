// mostly ajax calls 
app.models = {
	// call to server to reconfigure member docs in mongodb
	reconfigureMembers: function(){
		$.ajax({
		  type: "POST",
		  url: '/reconfig',
		  data: '',
		  success: function(){
		  	app.populatePage();
		  }
		});
	},

	// reset lasts collection doc in mongo
	setLasts: function(data){
		$.ajax({
		  type: "POST",
		  url: '/setLasts',
		  dataType: "json",
		  contentType: "application/json",
		  data: JSON.stringify(data),
		  success: function(result){
		  	console.log('Lasts collection reset');
		  },
		  error: function(xhr, textStatus, errThrown){
		  	console.log(xhr);
		  	console.log(errThrown);
		  }
		});
	}

}