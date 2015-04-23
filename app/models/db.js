// model to connect to mongodb through mongohq

var MongoClient;
var ObjectID;

module.exports = function(app) {

	return app.models.db = (function() {
		// constructor
		function db() {
			MongoClient = app.mongodb.MongoClient;
			ObjectID = app.mongodb.ObjectID;
		}


		// REQUESTS
		// insert request into a mongodb collection
		db.insertRequest = function(request, callback) {
			var r = request;

			MongoClient.connect(app.env.MONGOHQ_URL, function(err, mdb){
				if(err){
				  return console.error(err);
				}

				var collection = mdb.collection('requests');

				console.log('about to add new doc');

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
				    return console.error(err);
				  }
				  
				  console.log('added new req');
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
			MongoClient.connect(app.env.MONGOHQ_URL, function(err, mdb){
				if(err){
				  return console.error(err);
				}

				var collection = mdb.collection('members');

				findMember(one, function(first){
				  findMember(two, function(second){

				    // combine email arrays
				    collection.update(
				      {_id: ObjectID(second._id)}, 
				      {$addToSet: {users: {$each: first.users}}},
				      function(err, count, status){
				        if(err)
				          console.error(err);
				      }
				    );

				    // add company name to aliases
				    collection.update(
				      {_id: ObjectID(second._id)}, 
				      {$addToSet: {aliases: first.company}},
				      function(err, count, status){
				        if(err)
				          console.error(err);
				      }
				    );

				    // add aliases to aliases
				    collection.update(
				      {_id: ObjectID(second._id)}, 
				      {$addToSet: {aliases: {$each: first.aliases}}},
				      function(err, count, status){
				        if(err)
				          console.error(err);
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
				          console.error(err);

				        // callback to original post request
				        callback();
				      }
				    );
				  });
				});

				function findMember(id, returnMem){
				  collection.find({_id: ObjectID(id)}).toArray(function(err, members){
				    if(err)
				      console.error(err);

				    returnMem(members[0]);
				  });
				}

			});
		};

		// insert or update relevant member document
		db.insertMember = function(mem, callback) {
			// connect to database
			MongoClient.connect(app.env.MONGOHQ_URL, function(err, mdb){
				if(err){
				  return console.error(err);
				}

				var collection = mdb.collection('members');
				// uses mem in getDetails
				var ev = getDetails();

				// search to see if there is an existing member doc to update
				// look through all companies
				collection.find({company: mem.company}).toArray(function (err, members){
				  if (err)
				    console.error(err);

				  // no company matches
				  if(members[0] == null){
				    console.log("no member found for " + mem.company);
				    //console.log(members);
				    // look through all aliases
				    collection.find({aliases: mem.company}).toArray(function(err, members){
				      if (err) 
				        console.error(err);

				      // no alias matches
				      if (members[0] == null){
				        // look through all users
				        collection.find({users: mem.email}).toArray(function(err, members){
				          if(err)
				            console.error(err);

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
				        console.error(err);
				    }
				  );
				}

				function updateAliases(member){
				  collection.update(
				    {company: member.company}, 
				    {$addToSet: {aliases: mem.company}},
				    function(err, count, status){
				      if(err)
				        console.error(err);
				    }
				  );
				}

				function updateHours(member){
				  //console.log(member.years);

				  if(ev.year == 2015){
				      console.log('//--//');
				      console.log(ev.month);
				      console.log(member.company);
				      console.log(member.years);
				      console.log('//--//');
				    }

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
				            console.error(err);

				          if(callback){
				            callback();
				          }
				        }
				      );
				    } else {
				      // create new month object
				      var newYears = member['years'];

				      newYears[ev.year][ev.month] = ev.duration;

				      collection.update(
				        {company: member.company}, 
				        {$set: {years: newYears}},
				        function(err, count, status){
				          if(err)
				            console.error(err);

				          if(callback){
				            callback();
				          }
				        }
				      );
				    }
				  } else {
				    // create new year object
				    var newYears = member['years'];

				    if(ev.year == 2015){
				      console.log('//// new 2015 ////');
				      console.log(ev.month + ' | ' + ev.duration);
				      console.log(newYears);
				      console.log(member.years);
				    }

				    newYears[ev.year] = {};
				    newYears[ev.year][ev.month] = ev.duration;

				    if(ev.year == 2015){
				      console.log('---');
				      console.log(newYears);
				      console.log(member.years);
				      console.log('////////////');
				    }

				    collection.update(
				      {company: member.compay},
				      {$set: {years: newYears}},
				      function(err, count, status){
				        if(err)
				          console.error(err);

				        if(callback){
				          callback();
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
				      return console.error(err);
				    }
				    // for reconfigureMembers
				    if(callback){
				      callback();
				    }
				    console.log('added new member ' + mem.company);
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
			MongoClient.connect(app.env.MONGOHQ_URL, function(err, mdb){
			    if(err){
			      return console.error(err);
			    }
			    var coll = mdb.collection('members');

			    coll.remove(function(err, numRemoved){
			      var collection = mdb.collection('requests');

			      collection.find({}).toArray(function (err, items){
			        if (err) {
			          return console.error(err);
			        }
			        
			        var i = 0;

			        function config(){
			          insertMember(items[i], function(){
			            if(i < items.length - 1){
			              i++;
			              config();
			            }
			            else{
			              console.log('-- DONE WITH LOOP --');
			              callback();
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
		db.getCollection = function(request, callback) {
			MongoClient.connect(app.env.MONGOHQ_URL, function(err, mdb){
			    if(err){
			      return console.error(err);
			    }

			    var collection = mdb.collection(coll);

			    collection.find({}).toArray(function (err, items){
			      if (err) {
			        return console.error(err);
			      }
			     
			      callback(items);
			    });
			});
		};


		return db;
	})();
}