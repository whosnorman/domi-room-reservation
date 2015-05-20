// client side app global namespace
var app = {};

$(document).ready(function() {

	app.render.showWelcomeMessage();
	app.render.showTodaysDate();
	app.render.setAccentColor();

	app.populatePage();

	$('.dontshow').addClass('show');

	// keep at bottom
	app.render.updateProgress();
});


// change sorting month to previous or next
function memSort(dir){
	var dateObj = {};
	var month = $('#sorterMonth').text();
	var year = $('#sorterYear').text();
	dateObj.month = app.helpers.monthToInt(month);
	dateObj.year = parseInt(year);

	if(dir == 'left'){
		var newDate = app.render.getPrevMonth(dateObj);
	} else if (dir == 'right') {
		var newDate = app.render.getNextMonth(dateObj);
	}

	$('#sorterMonth').text(app.helpers.intToMonth(newDate.month));
	$('#sorterYear').text(newDate.year);

	// re-sort list
	sorter(newDate);
}

// re-sort and display a list of members based on a new date
function sorter(sortDate){
	app.dateArr = [];
	var sortArr = app.populatePage.sortByMonth(app.memArr, sortDate);
	app.populatePage.cycleMembers(sortArr);	
}

// inits data & page
app.populatePage = (function(){
	// variables
	var arr = [];

	var dataJSON = [{
		"1": {
			"hours": 4,
			"month": 1,
		},
		"2": {
			"hours": 6,
			"month": 2,
		},
		"3": {
			"hours": 3,
			"month": 3,
		}
	}];

	var dataJSON = [ { label: "Data Set 1", 
       hours: [0, 1, 2], 
       month: [4, 6, 3] } ] ;



	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var tDate = {};
	tDate.month = month;
	tDate.year = year;

	$('#sorterYear').text(year);
	$('#sorterMonth').text(app.helpers.intToMonth(month));

	// get requests
	$.getJSON('/reqs', function(obj){
		var totalTime = 0;
		// west, east, florida blue hours
		var roomHrs = [0, 0, 0];
		var lastMeeting = {};
		lastMeeting.diff = 14704897000;
		var today = moment.utc().utcOffset(-4);
		var popDayArr = [0, 0, 0, 0, 0, 0, 0];
		var popTimeArr = Array.apply(null, new Array(24)).map(Number.prototype.valueOf,0);
		var avgCounter = 0;
		var avgTime = 0;

		for(var item in obj){
			var MEM = obj[item];
			app.requestData[item] = MEM;

			// set duration
			var end = moment.utc(MEM.end).utcOffset(-4);
			var start = moment.utc(MEM.start).utcOffset(-4);
			var diff = moment.duration(end.diff(start));
			var diffMin = diff.get('minutes');
			var diffHr = diff.get('hours');
			if (diffHr == 12)
				diffHr = 0;

			var durHr = parseInt(diffHr);
			var durMin = parseInt(diffMin);

			app.requestData[item].duration = diffHr + ':' + diffMin;
			app.requestData[item].durHr = durHr;
			app.requestData[item].durMin = durMin;

			// set total time in minutes
			totalTime += (durHr * 60) + durMin;

			// add counter to day for most popular day
			var currDay = moment(start).format('dddd');
			popDayArr[app.helpers.dayToInt(currDay)] += 1;

			// add counter to hour for most popular time
			var startHr = moment(start).hour();
			popTimeArr[startHr] += 1;

			// set room hours
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

		// reset lasts collection
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
		// SET HEADER TOTALS
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

		// west conf room 
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

			if(lasts){
				var plusHrs = 0;
				var plusMins = 0;


				// total
				plusHrs = values.total.hours - lasts.total.hours;
				plusMins = values.total.minutes - lasts.total.minutes;
		
				if(plusHrs > 0 && plusMins < 0)
					plusMins *= -1;
				if(plusHrs != 0 || plusMins != 0)
					$('#totTimePlus').text('+'+plusHrs+':'+plusMins);

				// west conf
				plusHrs = values.westConf.hours - lasts.westConf.hours;
				plusMins = values.westConf.minutes - lasts.westConf.minutes;
				if(plusHrs > 0 && plusMins < 0)
					plusMins *= -1;
				if(plusHrs != 0 || plusMins != 0)
					$('#westConfPlus').text('+'+plusHrs+':'+plusMins);

				// east conf
				plusHrs = values.eastConf.hours - lasts.eastConf.hours;
				plusMins = values.eastConf.minutes - lasts.eastConf.minutes;
				if(plusHrs > 0 && plusMins < 0)
					plusMins *= -1;
				if(plusHrs != 0 || plusMins != 0)
					$('#eastConfPlus').text('+'+plusHrs+':'+plusMins);

				// requests 
				plusHrs = values.requests - lasts.requests;
				if(plusHrs != 0)
					$('#totReqsPlus').text('+'+plusHrs);

				// emails
				plusHrs = values.emails - lasts.emails;
				if(plusHrs != 0)
					$('#emailSparedPlus').text('+'+plusHrs);


				/* // For show purposes
				$('#totReqsPlus').text('+1');
				$('#emailSparedPlus').text('+2');
				$('#totTimePlus').text('+2:30'); 
				*/

				// animation for all plus numbers
				$('#emailSparedPlus').addClass('plusshow');
				$('#totReqsPlus').addClass('plusshow');
				$('#eastConfPlus').addClass('plusshow');
				$('#westConfPlus').addClass('plusshow');
				$('#totTimePlus').addClass('plusshow');
			}

			// keep at bottom
			setLasts(values);
			app.render.updateProgress();
		});

		// keep at bottom
		app.render.updateProgress();
	});


	// get members
	$.getJSON('/mems', function(data){	
		app.memArr = sortByMonth(data, tDate);
		cycleMembers();
	});

	/// END OF CALLS ///

	/// START OF HELPER FUNCTIONS ///

	// uses global arrarys app.memArr & app.dateArr
	// use to refresh or resort full list of members
	function cycleMembers(optArr){
		// html content to fill members div
		var content = '';
		var dateCounter = 0;
		// set to true if the rest of the members don't match up with the date
		var nodata = false;
		var arr = optArr || app.memArr;

		$.each(arr, function(){
			//console.log(this);
			// seperates the sorted months
			if (this.company == 'nextdate') {
				dateCounter++;
				content += '<div class="line">';
				content += app.helpers.intToMonth(app.dateArr[dateCounter].month);
				content += '</div>';
			} else if (this.company == 'nodata'){
				nodata = true;
			} else {
				content += printMember(this, app.dateArr[dateCounter], nodata);
			}
		});		

		//countMembers(arr);
		var count = arr.length - 1;
		app.helpers.countUp('#memTot', count);
		// fill members div with printed content
		$('#members').html(content);

		// add event listeners
		var cnt = 0;
		$('.mem').each(function() {
			var comp = this.getElementsByClassName('comp');
			var compStr = $(comp).text();
			if(compStr.length - 1 > 16) {
				$(comp).attr('title', compStr);
				var compStr = compStr.substring(0, 16) + '...';
				$(comp).text(compStr);
			}

			this.addEventListener('mouseover', function(){
				showMonths(this);
			});
			this.addEventListener('mouseout', function(){
				hideMonths(this);
			});

			$(this).click(function(){
				toggleHeight(this);
				var id = $(this).attr('dashID');
				var result = lookUpMember(id);
				console.log(result.company);
			});

			var count = cnt;
			var merge = this.getElementsByClassName('mergeBtn');
			merge[0].addEventListener('click', function(e){
				e.stopPropagation();
				mergeToggle(compStr);
			});

			cnt++;
		});

		// keep at bottom
		app.render.updateProgress();
	}


	// things to include in member elements:
	// 		company name
	// 		aliases
	// 		total hours for previous and current month
	// 		emails using name@ trend with hovering showing their full name
	// 		chart showing usage per last couple months
	// 		
	//   update search bar to search full name not shortened one
	// returns a printed member in html
	function printMember(member, dateObj, opt){
		var cont = '';

		cont += '<div class="mem" dashID="' + member._id + '">';

		// company name
		cont += '<div class="comp">' + member.company + '</div>';


		// months div
		cont += '<div class="months">';
		// true opt means the date doesn't match up
		if(opt){
			cont += 'no data for ' + (app.helpers.intToMonth(dateObj.month)).toLowerCase();
		} else {
			cont += '<div class="monthAmt">';
			cont += member.years[dateObj.year][dateObj.month];
			cont += '</div>';
			cont += '<div class="month">';
			cont += (app.helpers.intToMonth(dateObj.month)).toLowerCase();
			cont += '</div>';
		}
		cont += '</div>';

		// emails div
		cont += '<div class="emailCont"><div class="emails">';
		for(var i = 0; i < member.users.length; i++) {
			cont+= member.users[i] + ' ';
		}
		cont += '</div>';

		// merge button
		cont += '<div class="mergeBtn">merge</div>';

		cont += '</div></div>';

		return cont;
	}




	// recursive function to sort the members
	var COUNTER = 0;
	function sortByMonth(array, testDate, opt){
		//var recent = opt || [];
		var recent = [];
		var old = [];
		var newArr = [];

		if(opt === 'exit'){
			$.each(array, function(){
				newArr.push(this);
			});
		} else {
			$.each(array, function(){
				var hasMonth = false;
				// ignore blanks when the app.memArr is run through
				if(this.company != 'nodata' && this.company != 'nextdate'){
					if(this.years.hasOwnProperty(testDate.year)) {
						if(this.years[testDate.year].hasOwnProperty(testDate.month)){
							hasMonth = true;
							recent.push(this);
						} 
					} 

					if(!hasMonth) {
						old.push(this);
					}
				}
			});

			newArr = quickSort(recent, 0, recent.length - 1, testDate);
			app.dateArr.push(testDate);
		}
		

		if(old.length){
			var equal = false;

			// to stop recursiveness when nothing else is being
			// sorted out of the leftover array
			if(opt && old.length == opt.length){
				equal = true;
				for(var i = 0; i < old.length; i++){
					if(old[i].company != opt[i].company){
						equal = false;
					}
				}
			}

			// make sure old is not being passed around without finding any matches
			if(!equal){
				COUNTER++;
				
				var nextArr = sortByMonth(old, app.render.getPrevMonth(testDate), array);
				// to be able to test for breaks when printing
				newArr.push({
					company: 'nextdate'
				});
				newArr = newArr.concat(nextArr);

			} else {
				var nextArr = sortByMonth(old, app.render.getPrevMonth(testDate), 'exit');
				// push flag
				newArr.push({
					company: 'nodata'
				});
				newArr = newArr.concat(nextArr);
			}
		}
		

		return newArr;
	}

	// called by sortByMonth
	// modified quicksort to sort based on given date
	function quickSort(members, l, r, dateObj) {
		var index;
		if(members.length > 1) {

			index = partition(members, l, r, dateObj);

			if(l < index - 1) {
				quickSort(members, l, index - 1, dateObj)
			}

			if(index < r){
				quickSort(members, index, r, dateObj);
			}
		}

		return members;
	}

	// called by quickSort
	// tests values around pivot point and swaps them
	function partition(members, l, r, dateObj) {
		var dte = dateObj;

		var pivot = members[Math.floor((l + r) / 2)];

		while (l <= r){
			while (members[l].years[dte.year][dte.month] > pivot.years[dte.year][dte.month]) {
				l++;
			}

			while (members[r].years[dte.year][dte.month] < pivot.years[dte.year][dte.month]) {
				r--;
			}

			if (l <= r) {
				swap(members, l, r);
				l++;
				r--;
			}
		}

		return l; 
	}

	// called by partition
	function swap(members, l, r) {
		var temp = members[l];
		members[l] = members[r];
		members[r] = temp;
	}


	/// public functions ///
	app.populatePage.cycleMembers = cycleMembers;
	app.populatePage.sortByMonth = sortByMonth;


});

function lookUpMember(id){
	var result = $.grep(app.memArr, function(e){ 
		return e._id === id;
	});

	if(result.length > 1)
		console.log('more than one during look up');

	return result[0];
}


function showMonths(el) {
	var months = el.getElementsByClassName('emails');
	$(months[0]).css('opacity', '1');
}

function hideMonths(el) {
	var months = el.getElementsByClassName('emails');
	$(months[0]).css('opacity', '0');
}

function toggleHeight(el) { 
	var el = $(el);
	if (el.height() > 50) {
		el.css('height', '40px');
	} else {
		el.css('height', '200px');
	}
}

function mergeToggle(str) {
	var mems = document.getElementsByClassName('mem');
	$(mems[num]).css('border-color', 'rgba(255, 153, 51, 1');
	// find element with correct company string 
	app.mergeArr.push(str);

	if(app.mergeArr.length == 2) {
		// deselect if misclick
		if (app.mergeArr[0] == app.mergeArr[1]){
			var mem = mems[app.mergeArr[0]];
			$(mem).removeAttr('style');
			app.mergeArr = [];
		} else {
			var first = app.memArr[app.mergeArr[0]];
			var second = app.memArr[app.mergeArr[1]];
			// prompt to confrim merge
			if(confirm('Merge ' + first.company + ' into ' + second.company +'?')){
				var data = {
					'first': first._id,
					'second': second._id
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
			}

			for(var i = 0; i < app.mergeArr.length; i++){
				var mem = mems[app.mergeArr[i]];
				$(mem).removeAttr('style');
			}

			app.mergeArr = [];
		}
	}
}

		

// cycle through request table columns and set header cells to correct width
function adjustHeaderWidth() {
	var reqs = $('#main').find('td');
	var headers = $('#reqHead').find('th');
	var arr = [];

	for(var i = 0; i < 7; i++) {
		arr.push($(reqs.eq(i)).width());
	}

	var i = 0;
	headers.each(function(){
		$(this).css('width', arr[i]);
		i++;
	});
}











		// 
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
		
