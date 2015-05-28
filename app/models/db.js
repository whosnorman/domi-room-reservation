// model to connect to mongodb through mongohq

var MongoClient;
var ObjectID;


module.exports = function(app) {
	var options =  {
        replset: { 
            socketOptions: { 
                connectTimeoutMS: 30000 
            } 
        },
        server: {
            socketOptions: {
                connectTimeoutMS: 10000
            }
        }
    };

	return app.models.db = (function() {
		
		function db() {}

		MongoClient = app.mongodb.MongoClient;
		ObjectID = app.mongodb.ObjectID;


		// REQUESTS
		// insert request into a mongodb collection
		db.insertRequest = function(request, callback) {
			var r = request;

			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
				if(err){
				  callback.error(err);
				}

				var collection = mdb.collection('requests');

				//console.log('about to add new doc');

				var doc = {
				  'email': r.email,
				  'start': r.start,
				  'end': r.end,
				  'room': r.room,
				  'company': r.company,
				  'event_id': r.id
				}

				collection.insert([doc], function(err, docs) {
				  if (err) {
				    callback.error(err);
				  }
				  
				  //console.log('added new req');
				});
			});
		};

		db.deleteRequest = function(request, callback) {
			// delete event from gcal
			// subtract hours from correct month
			// delete request from request collection
		};


		// MEMBERS
		// merge two member documents
		db.mergeMember = function(one, two, callback) {
			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
				if(err){
				  callback.error(err);
				} else {
					var collection = mdb.collection('members');

					findMember(one, function(first){
					  findMember(two, function(second){

					    // combine email arrays
					    collection.update(
					      {_id: ObjectID(second._id)}, 
					      {$addToSet: {users: {$each: first.users}}},
					      function(err, count, status){
					        if(err)
					          callback.error(err);
					      }
					    );

					    // add company name to aliases
					    collection.update(
					      {_id: ObjectID(second._id)}, 
					      {$addToSet: {aliases: first.company}},
					      function(err, count, status){
					        if(err)
					          callback.error(err);
					      }
					    );

					    // add aliases to aliases
					    collection.update(
					      {_id: ObjectID(second._id)}, 
					      {$addToSet: {aliases: {$each: first.aliases}}},
					      function(err, count, status){
					        if(err)
					          callback.error(err);
					      }
					    );

					    // update hours in json format
					    // loop through years in first
					    for (var year in first.years){
					      // if that year is already in second
					      if(second.years.hasOwnProperty(year)){
					        // loop through months in the year in first
					        for (var month in first.years[year]){
					          // if that month and year are already in second
					          if(second.years[year].hasOwnProperty(month)){
					            second.years[year][month] += first.years[year][month];
					          } else {
					            // month not already in second
					            second.years[year][month] = first.years[year][month];
					          }
					        }
					      } else {
					        // year not already in second
					        second.years[year] = {};
					        for (var month in first.years[year]){
					          if(first.years[year].hasOwnProperty(month)){
					            second.years[year][month] = first.years[year][month];
					          }
					        }
					      }
					    }

					    // remove first member doc
					    collection.remove({_id: ObjectID(first._id)});

					    collection.update(
					      {_id: ObjectID(second._id)}, 
					      {$set: {years: second.years}},
					      function(err, count, status){
					        if(err)
					          callback.error(err);

					        // callback to original post request
					        callback.success();
					      }
					    );
					  });
					});
				}

				function findMember(id, returnMem){
				  collection.find({_id: ObjectID(id)}).toArray(function(err, members){
				    if(err)
				      callback.error(err);

				    returnMem(members[0]);
				  });
				}

			});
		};

		// insert or update relevant member document
		db.insertMember = function(mem, callback) {
			// connect to database
			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
				if(err){
				  return callback.error(err);
				}

				var collection = mdb.collection('members');
				// uses mem in getDetails
				var ev = getDetails();

				// search to see if there is an existing member doc to update
				// look through all companies
				collection.find({company: mem.company}).toArray(function (err, members){
				  if (err)
				    return callback.error(err);

				  // no company matches
				  if(members[0] == null){
				    //console.log("no member found for " + mem.company);
				    //console.log(members);
				    // look through all aliases
				    collection.find({aliases: mem.company}).toArray(function(err, members){
				      if (err) 
				        return callback.error(err);

				      // no alias matches
				      if (members[0] == null){
				        // look through all users
				        collection.find({users: mem.email}).toArray(function(err, members){
				          if(err)
				            return callback.error(err);

				          // no user matches
				          if (members[0] == null){
				            // no part of member found, create new doc
				            insertNewMember();
				          } else {
				            // email found in a doc
				            updateAliases(members[0]);
				            updateHours(members[0]);
				          }
				        });
				      } else {
				        // alias found in a doc
				        updateUsers(members[0]);
				        updateHours(members[0]);
				      }
				    });
				  } else {
				    // company found in a doc
				    //console.log(members);
				    updateUsers(members[0]);
				    updateHours(members[0]);
				  }
				});
				// above function will either insertNewMember or 
				// updateHours, callback has been placed in those


				/// update functions ///
				function updateUsers(member){
				  collection.update(
				    {company: member.company}, 
				    {$addToSet: {users: mem.email}},
				    function(err, count, status){
				      if(err)
				        callback.error(err);
				    }
				  );
				}

				function updateAliases(member){
				  collection.update(
				    {company: member.company}, 
				    {$addToSet: {aliases: mem.company}},
				    function(err, count, status){
				      if(err)
				        callback.error(err);
				    }
				  );
				}

				function updateHours(member){
				  //console.log(member.years);

				  /*if(ev.year == 2015){
				      console.log('//--//');
				      console.log(ev.month);
				      console.log(member.company);
				      console.log(member.years);
				      console.log('//--//');
				    }*/

				  // check if the event year is already a key
				  if(member.years.hasOwnProperty(ev.year)){
				    if(ev.year == 2015){

				    }
				    // check if the event month is already a key
				    if(member.years[ev.year].hasOwnProperty(ev.month)){
				      var hours = member['years'][ev.year][ev.month];
				                                                                                                                                                                                                                                                                                                                                                        
				      var increment = member['years'];
				      increment[ev.year][ev.month] = (ev.duration + hours);

				      /*if(ev.year == 2015){
				        console.log('----2015 month----------');
				        console.log(ev.month + ' | ' + ev.duration + ' | ' + hours);
				        console.log(increment);
				        console.log(member.years);
				        console.log('------------------------');
				      }*/

				      // year and month already exist, update hours
				      collection.update(
				        {company: member.company}, 
				        {$set: {years: increment}},
				        function(err, count, status){
				          if(err)
				            callback.error(err);

				          if(callback){
				            callback.success();
				          }
				        }
				      );
				    } else {
				      // create new month object
				      var newMonth = member['years'];

				      newMonth[ev.year][ev.month] = ev.duration;
				      //console.log(newMonth);
				      collection.update(
				        {company: member.company}, 
				        {$set: {years: newMonth}},
				        function(err, count, status){
				          if(err)
				            callback.error(err);

				          if(callback){
				            callback.success();
				          }
				        }
				      );
				    }
				  } else {
				    // create new year object
				    var newYears = member['years'];

				    /*if(ev.year == 2015){
				      console.log('//// new 2015 ////');
				      console.log(ev.month + ' | ' + ev.duration);
				      console.log(newYears);
				      console.log(member.years);
				    } */

				    console.log('creating new year for '+member.company);
				    console.log(newYears);
				    newYears[ev.year] = {};
				    newYears[ev.year][ev.month] = ev.duration;
				    console.log('after addition of year and month');
				    console.log(newYears);
				    /*if(ev.year == 2015){
				      console.log('---');
				      console.log(newYears);
				      console.log(member.years);
				      console.log('////////////');
				    } */

				    collection.update(
				      {company: member.compay},
				      {$set: {years: newYears}},
				      function(err, count, status){
				        if(err)
				          callback.error(err);

				        console.log('created for '+member.company);

				        if(callback){
				          callback.success();
				        }
				      }
				    );
				  }
				}

				// create new member doc
				function insertNewMember(){

				  // create doc
				  var newMem = {
				    'company': mem.company,
				    'years': {},
				    'users': [mem.email],
				    'aliases': []
				  }

				  newMem['years'][ev.year] = {};
				  newMem['years'][ev.year][ev.month] = ev.duration;

				  // insert new member 
				  collection.insert(newMem, function(err, docs) {
				    if (err) {
				      return callback.error(err);
				    }

				    // for reconfigureMembers
				    if(callback){
				      // this callback is different than other callback.success()
				      callback.success();
				      mdb.close();
				    }
				    //console.log('added new member ' + mem.company);
				  });
				}

				// calculate and return event details
				function getDetails(){
				  var ev = {};

				  var evDate = new Date(mem.start);
				  ev.year = evDate.getFullYear();
				  ev.month = evDate.getMonth() + 1;
				  var start = evDate.getUTCHours();
				  evDate = new Date(mem.end);
				  var end = evDate.getUTCHours();

				  // calculate duration
				  if(start > end)
				    end += 24;
				  ev.duration = end - start;

				  return ev;
				}

			});
		};

		// clear current members collection and 
		// rerun sorting logic on existing requests
		db.reconfigureMembers = function(callback) {
			console.log('reconfiguring members...');
			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
			    if(err){
			      callback.error(err);
			    }

			    var coll = mdb.collection('members');

			    coll.remove(function(err, numRemoved){
			      var collection = mdb.collection('requests');

			      collection.find({}).toArray(function (err, items){
			        if (err) {
			          callback.error(err);
			        }
			        
			        var i = 0;

			        function config(){
			          app.models.db.insertMember(items[i], {
			          	success: function(){
				            if(i < items.length - 1){
				              i++;
				              config();
				            } else {
				              console.log('-- DONE WITH LOOP --');
				              callback.success();
				            }
				        }
			          });
			        }

			        // init loop call
			        config();

			      });
			    });
			});
		};


		// COLLECTIONS
		// look up all docs in the requests collection
		db.getCollection = function(coll, callback) {
			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
			    if(err){
			    	callback.error(err);
			    } else {
					var collection = mdb.collection(coll);

					collection.find({}).toArray(function (err, items){
					  if (err)
					    callback.error(err);
					  else
						callback.success(items);					 
					});
				}
			});
		};


		// change last values collection
		db.setLasts = function(values, callback) {
			var r = values;

			MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, mdb){
				if(err){
				  callback.error(err);
				}

				var coll = mdb.collection('lasts');

				coll.remove(function(err, numRemoved){
					MongoClient.connect(app.env.MONGOHQ_URL, options, function(err, newDb){
						if(err){
						  callback.error(err);
						}
						var collection = newDb.collection('lasts');

						var doc = {
						  'total': {
						  		'hours': r.total.hours,
						  		'minutes': r.total.minutes
						  },
						  'westConf': {
						  		'hours': r.westConf.hours,
						  		'minutes': r.westConf.minutes
						  },
						  'eastConf': {
						  		'hours': r.eastConf.hours,
						  		'minutes': r.eastConf.minutes
						  },
						  'floridaBlue': {
						  		'hours': r.floridaBlue.hours,
						  		'minutes': r.floridaBlue.minutes
						  },
						  'requests': r.requests,
						  'emails': r.emails
						}

						collection.insert([doc], function(err, docs) {
						  if (err) {
						    callback.error(err);
						  }

						  callback.success();
						});
					});
				});
				
			});
		};


		return db;
	})();
}