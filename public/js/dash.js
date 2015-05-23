// client side app global namespace
var app = {};

$(document).ready(function() {
	// randomized and daily elements
	app.render.showWelcomeMessage();
	app.render.showTodaysDate();
	app.render.setAccentColor();

	// everything else
	app.populatePage();
	app.handlers();

	// slide in animation
	$('.dontshow').addClass('show');

	// keep at bottom
	app.render.updateProgress();
});


// inits data & page
app.populatePage = (function(){
	$('.progress').css('width', '0%');
	// calculate and render header stats,
	// also resets last values collection in mongo
	// defined below
	loadRequests();

	// create date object
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var tDate = {};
	tDate.month = month;
	tDate.year = year;

	// set sorter text
	$('#sorterYear').text(year);
	$('#sorterMonth').text(app.helpers.intToMonth(month));

	// get members, sort them, and then cycle 
	// through and render them
	$.getJSON('/mems', function(data){	
		app.memArr = app.members.sortByMonth(data, tDate);
		app.members.cycle();
	});

});


// run through requests calculating and
// rendering the header stats
var loadRequests = (function(){
	$.getJSON('/reqs', function(obj){
		var totalTime = 0;
		// west, east, florida blue hours
		var roomHrs = [0, 0, 0];
		var lastMeeting = {};
		lastMeeting.diff = 14704897000;
		var today = moment.utc().utcOffset(-4);
		var popDayArr = [0, 0, 0, 0, 0, 0, 0];
		// create array with all 0s
		var popTimeArr = Array.apply(null, new Array(24)).map(Number.prototype.valueOf,0);
		var avgCounter = 0;
		var avgTime = 0;

		// loop through requests
		for(var item in obj){
			var MEM = obj[item];
			app.requestData[item] = MEM;

			// get duration
			var end = moment.utc(MEM.end).utcOffset(-4);
			var start = moment.utc(MEM.start).utcOffset(-4);
			var diff = moment.duration(end.diff(start));
			
			var durMin = diff.get('minutes');
			var durHr = diff.get('hours');

			// store individual duration vars to use later
			app.requestData[item].duration = durHr + ':' + durMin;
			app.requestData[item].durHr = durHr;
			app.requestData[item].durMin = durMin;

			// add up total time in minutes
			totalTime += (durHr * 60) + durMin;

			// add counter to day for most popular day
			var currDay = moment(start).format('dddd');
			popDayArr[app.helpers.dayToInt(currDay)] += 1;

			// add counter to hour for most popular time
			var startHr = moment(start).hour();
			popTimeArr[startHr] += 1;

			// add up room hours
			switch(MEM.room){
				case 'West Conference Room':
					roomHrs[0] += (durHr * 60) + durMin;
					break;
				case 'East Conference Room':
					roomHrs[1] += (durHr * 60) + durMin;
					break;
				case 'Florida Blue Education Room':
					roomHrs[2] += (durHr * 60) + durMin;
					break;
				case 'Education Lecture Hall':     	// replaced with Florida Blue
					roomHrs[2] += (durHr * 60) + durMin;
					break;
				default:
					console.log(MEM.room);
					break;
			}

			// check requests that are before today
			// the one with the smallest difference
			// is the last meeting
			if(moment(end).isBefore(today)){
				var diff = today.diff(end);
				if(diff < lastMeeting.diff){
					lastMeeting.diff = diff;
					lastMeeting.comp = MEM.company;
					lastMeeting.room = MEM.room;
				}
			}
		}

		// values to compare to lasts collection
		var values = {
		  'total': {
		  		'hours': 0,
		  		'minutes': 0
		  },
		  'westConf': {
		  		'hours': 0,
		  		'minutes': 0
		  },
		  'eastConf': {
		  		'hours': 0,
		  		'minutes': 0
		  },
		  'floridaBlue': {
		  		'hours': 0,
		  		'minutes': 0
		  },
		  'requests': 0,
		  'emails': 0
		}

		//
		// RENDER HEADER TOTALS
		// 
		// set Total Time Reserved
		var hrs = Math.floor(totalTime / 60);
		var min = totalTime % 60;
		app.helpers.countUp('#totTimeHrs', hrs);
		app.helpers.countUp('#totTimeMins', min);
		values.total.hours = hrs;
		values.total.minutes = min;
		// set each rooms total hours
		// west conf room 
		hrs = Math.floor(roomHrs[0] / 60);
		min = roomHrs[0] % 60;
		app.helpers.countUp('#westConfHrs', hrs);
		app.helpers.countUp('#westConfMins', min);
		values.westConf.hours = hrs;
		values.westConf.minutes = min;
		// east conf room 
		hrs = Math.floor(roomHrs[1] / 60);
		min = roomHrs[1] % 60;
		app.helpers.countUp('#eastConfHrs', hrs);
		app.helpers.countUp('#eastConfMins', min);
		values.eastConf.hours = hrs;
		values.eastConf.minutes = min;
		// florida blue room 
		hrs = Math.floor(roomHrs[2] / 60);
		min = roomHrs[2] % 60;
		app.helpers.countUp('#educationHrs', hrs);
		app.helpers.countUp('#educationMins', min);
		values.floridaBlue.hours = hrs;
		values.floridaBlue.minutes = min;


		// set last request
		var last = app.requestData[app.requestData.length - 1];
		$('#lastRequestComp').text(last.company);
		var date = moment.utc(last.start).utcOffset(-4).format('MMM Do');
		$('#lastRequestDate').text(date);

		// set last meeting
		$('#lastMeetingComp').text(lastMeeting.comp);
		$('#lastMeetingRoom').text(lastMeeting.room);

		// set most popular day
		var popDay = {
			day: 0,
			count: 0
		}
		// run through arr for highest number
		for(var i = 0; i < popDayArr.length - 1; i++){
			if(popDayArr[i] > popDay.count){
				popDay.count = popDayArr[i];
				popDay.day = i;
			}
		}
		$('#mostPopDay').text(app.helpers.intToDay(popDay.day));


		// set most popular time
		var popTime = {
			hour: 0,
			count: 0
		}
		// run through arr for highest number
		for(var i = 0; i < popTimeArr.length - 1; i++){
			if(popTimeArr[i] > popTime.count){
				popTime.count = popTimeArr[i];
				popTime.hour = i;
			}
		}
		var popHour = moment().hour(popTime.hour).format('h a');
		$('#mostPopTime').text(popHour);

		// set average time 
		var avg = totalTime / (app.requestData.length - 1);
		var hrs = Math.floor(avg / 60);
		var min = Math.floor(avg % 60);
		app.helpers.countUp('#avgHours', hrs, 1000);
		app.helpers.countUp('#avgMins', min, 1500);
		

		// render the header graph and table at the bottom
		app.render.requestsGraph();
		app.render.requestsTable(app.requestCurrent);	

		// set up page number for request table
		reqOptions = $('#reqOptions');
		reqOptions.empty();
		var length = (app.requestData.length - 1) / 10;
		//console.log('length: ' + length);
		for(var i = 0; i < length; i++){
			var $option = $('<option></option>')
				.attr('value', i)
				.text(i);
			reqOptions.append($option);
		}

		// approximation of spared emails
		var emailCount = (app.requestData.length - 1) * 2.125;
		app.helpers.countUp('#emailSpared', emailCount, 10000);

		// total requests 
		var requestCount = app.requestData.length - 1;
		app.helpers.countUp('#totReqsTop', requestCount);
		app.helpers.countUp('#totReqsBottom', requestCount);

		values.emails = emailCount;
		values.requests = requestCount;


		// get collection of last values checked
		$.getJSON('/getLasts', function(obj){	
			lasts = obj[0];

			// if its not empty then render plus values
			if(lasts)
				app.render.showValueDifference(values, lasts);

			// keep at bottom
			app.models.setLasts(values);
			app.render.updateProgress();
		});


		// keep at bottom
		app.render.updateProgress();
	});
});



// set app.models which are
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
	},

	// call to server to merge the two members specified by id's
	mergeMembers: function(first, second){
		var data = {
			'first': first,
			'second': second
		};

		$.ajax({
		  type: "POST",
		  url: '/merge',
		  data: data,
		  success: function(){
		  	app.populatePage();
		  },
		  dataType: 'application/json'
		});
	},

}


		// Dash Functionality
		// - switch out member name with an alias
		// - add one member to another
		// - showcase monthly total times for members
		// 
		// 'Cuttlesoft'
		//   months
		//   	nov: 3
		//   	dec: 1
		//   users: [user@comp.io, other@email.here]
		//   aliases: ['cuttlesoft', 'cuttle soft', 'frank']
		// 'Domi'
		//   months
		//   	nov: 4
		//   	dec: 0
		//   users: [lucas@domi.com, matt@domi.com, amanda@domi.com]
		//   
		//   
		//   
		//   
		//   
		//   
		//   
		// Tips
		// - click search eye glass to clear seach bar
		// - list out domi/used colors with a circle and hex codes
		// - hover over anything with a '...' at the end for the full text
		// - what the progress bar is broken down into
		// - database requests time out after 30 seconds
		// 
		// could put how stuff works
		// - how the member sorting by month works
		// - what reconfigure does
		// - what restart does and it's use
		// - 
		
