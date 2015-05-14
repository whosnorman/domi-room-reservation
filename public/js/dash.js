var requestData = [];
var requestCurrent = 0;
var mergeArr = [];
var memArr = [];
var dateArr = [];
var loadCal = true;

$(document).ready(function() {
	populatePage();

	$('.dontshow').addClass('show');

	var today = new Date();
	toDay = moment.utc(today).format('dddd');
	$('#toDay').text(toDay);
	toDate = moment.utc(today).format('Do');
	$('#toDate').text(toDate);

	// button listeners
	$('#refresh').on('click', function(){
		populatePage();
	});

	$('#reconfig').on('click', function(){
		reconfigureMembers();
	});

	$('#loadCal').on('click', function(){
		if(loadCal){
			$('#loadCal').text('Hide Snag Calendar');
			$('#calendar').html('<iframe src="https://www.google.com/calendar/embed?src=domiventures.co_e1eknta8nrohjg1lhrqmntrla4%40group.calendar.google.com&amp;color=%23333333&amp;showTitle=0&amp;showNav=0&amp;showPrint=0&amp;showCalendars=0&amp;mode=WEEK&amp;height=400&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;ctz=America%2FNew_York" style=" border-width:0 " width="1000" height="600" frameborder="0" scrolling="no"></iframe>');
			loadCal = false;
		} else {
			$('#loadCal').text('Load Snag Calendar');
			$('#calendar').html('');
			loadCal = true;
		}

	});


	$('#approx').hover(
		function(){
			$('#explain').css('opacity', '1');
		}, function(){
			$('#explain').css('opacity', '0');
	});

	$('#minusMem').on('click', function(){
		minimize($('#members'));
	});

	$('.searchBar').on('click', function(){
		$('#search').val('');
		$('#search').focus();

		var counter = 0;
		$('.mem').each(function() {
			$(this).css('display', 'block');
			counter++;
		});

		$('#memTot').text(counter);

	});


	$('#search').on('keyup', function(){
		var text = $('#search').val();
		var counter = 0;
		$('.mem').each(function() {
			var comp = this.getElementsByClassName('comp');
			var str = $(comp).text();
			var inStr = str.toLowerCase().indexOf(text);
			if(inStr > -1){
				$(this).css('display', 'block');
				counter++;
			} else {
				$(this).css('display', 'none');
			}
		});

		$('#memTot').text(counter);

	});

	$('#memSortLeft').on('click', function(){
		memSort('left');
	});

	$('#memSortRight').on('click', function(){
		memSort('right');
	});

	$('#reqPageLeft').on('click', function(){
		if($(this).attr('disabled') != 'disabled')
			renderRequests(--requestCurrent);
	});

	$('#reqPageRight').on('click', function(){
		if($(this).attr('disabled') != 'disabled')
			renderRequests(++requestCurrent);
	});

	$('#reqOptions').change(function(){
		requestCurrent = $(this).val();
		renderRequests(requestCurrent);
	});
});

function reconfigureMembers(){
	$.ajax({
	  type: "POST",
	  url: '/reconfig',
	  data: '',
	  success: function(){
	  	populatePage();
	  }
	});
}

// change sorting month to previous or next
function memSort(dir){
	var dateObj = {};
	var month = $('#sorterMonth').text();
	var year = $('#sorterYear').text();
	dateObj.month = monthToInt(month);
	dateObj.year = parseInt(year);

	if(dir == 'left'){
		var newDate = getPrevMonth(dateObj);
	} else if (dir == 'right') {
		var newDate = getNextMonth(dateObj);
	}

	$('#sorterMonth').text(intToMonth(newDate.month));
	$('#sorterYear').text(newDate.year);

	// re-sort list
	sorter(newDate);
}

// re-sort and display a list of members based on a new date
function sorter(sortDate){
	dateArr = [];
	var sortArr = populatePage.sortByMonth(memArr, sortDate);
	populatePage.cycleMembers(sortArr);	
}

// inits data & page
var populatePage = (function(){
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
	$('#sorterMonth').text(intToMonth(month));

	// get requests
	$.getJSON('/reqs', function(obj){
		var totalTime = 0;
		// west, east, florida blue hours
		var roomHrs = [0, 0, 0];
		var lastMeeting = {};
		lastMeeting.diff = 86400; // seconds in a day
		var today = moment.utc(new Date());
		console.log(today);

		for(var item in obj){
			var MEM = obj[item];
			requestData[item] = MEM;

			// set duration
			var endM = moment.utc(MEM.end);
			var start = moment.utc(MEM.start);
			var diffMin = moment.utc(endM.diff(start)).format('m');
			var diffHr = moment.utc(endM.diff(start)).format('h');
			if (diffHr == 12)
				diffHr = 0;

			var durHr = parseInt(diffHr);
			var durMin = parseInt(diffMin);

			requestData[item].duration = diffHr + ':' + diffMin;
			requestData[item].durHr = durHr;
			requestData[item].durMin = durMin;

			// set total time in minutes
			totalTime += (durHr * 60) + durMin;

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

			// check if end time is less than current date
			// and replace last meeting info if so
			if(){
				var endM = moment.utc(MEM.end);
				var diff = moment.utc(endM.diff(today));
				
				// get moment difference
				if(diff < lastMeeting.diff){
					lastMeeting.diff = diff;
					lastMeeting.comp = MEM.company;
					lastMeeting.room = MEM.room;
				}
			}


		}

		//
		// SET HEADER TOTALS
		// 
		// set Total Time Reserved
		var hrs = Math.floor(totalTime / 60);
		var min = totalTime % 60;
		$('#totTimeHrs').text(hrs);
		$('#totTimeMins').text(min);
		// set each rooms total hours
		// west conf room 
		hrs = Math.floor(roomHrs[0] / 60);
		min = roomHrs[0] % 60;
		$('#westConfHrs').text(hrs);
		$('#westConfMins').text(min);
		// east conf room 
		hrs = Math.floor(roomHrs[1] / 60);
		min = roomHrs[1] % 60;
		$('#eastConfHrs').text(hrs);
		$('#eastConfMins').text(min);
		// west conf room 
		hrs = Math.floor(roomHrs[2] / 60);
		min = roomHrs[2] % 60;
		$('#educationHrs').text(hrs);
		$('#educationMins').text(min);

		// set last request
		var last = requestData[requestData.length - 1];
		$('#lastRequestComp').text(last.company);
		var date = moment.utc(last.start).format('MMM Do');
		$('#lastRequestDate').text(date);

		// set last meeting
		$('#lastMeetingComp').text(lastMeeting.comp);
		$('#lastMeetingRoom').text(lastMeeting.room);
		

		// render the header graph and table at the bottom
		renderRequestsGraph();
		renderRequests(requestCurrent);	

		// set up page number for request table
		reqOptions = $('#reqOptions');
		reqOptions.empty();
		var length = (requestData.length - 1) / 10;
		//console.log('length: ' + length);
		for(var i = 0; i < length; i++){
			var $option = $('<option></option>')
				.attr('value', i)
				.text(i);
			reqOptions.append($option);
		}

		var i = 0;
		var time = 5;
		// approximation of saved emails
		var counter = (requestData.length - 1) * 2.125;
		function countEmails(){
			if(counter > 0){
				i++;
				counter--;
				$('#emailSpared').text(i);
				time += (i * 0.002);
				setTimeout(countEmails, time);
			}
		}

		countEmails();

		$('#totReqsTop').text(requestData.length - 1);
		$('#totReqsBottom').text(requestData.length - 1);
	});


	// get members
	$.getJSON('/mems', function(data){	
		memArr = sortByMonth(data, tDate);
		cycleMembers();
	});

	/// END OF CALLS ///

	/// START OF HELPER FUNCTIONS ///

	// uses global arrarys memArr & dateArr
	// use to refresh or resort full list of members
	function cycleMembers(optArr){
		// html content to fill members div
		var content = '';
		var dateCounter = 0;
		// set to true if the rest of the members don't match up with the date
		var nodata = false;
		var arr = optArr || memArr;

		$.each(arr, function(){
			// seperates the sorted months
			if (this.company == 'nextdate') {

				dateCounter++;
				content += '<div class="line">';
				content += intToMonth(dateArr[dateCounter].month);
				content += '</div>';
			} else if (this.company == 'nodata'){
				nodata = true;
			} else {
				content += printMember(this, dateArr[dateCounter], nodata);
			}
		});		

		countMembers(arr);
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
			});

			var count = cnt;
			var merge = this.getElementsByClassName('mergeBtn');
			merge[0].addEventListener('click', function(e){
				e.stopPropagation();
				mergeToggle(compStr);
			});

			cnt++;
		});
	}

	// returns a printed member in html
	function printMember(member, dateObj, opt){
		var cont = '';

		cont += '<div class="mem">';

		// company name
		cont += '<div class="comp">' + member.company + '</div>';


		// months div
		cont += '<div class="months">';
		// true opt means the date doesn't match up
		if(opt){
			cont += 'no data for ' + (intToMonth(dateObj.month)).toLowerCase();
		} else {
			cont += '<div class="monthAmt">';
			cont += member.years[dateObj.year][dateObj.month];
			cont += '</div>';
			cont += '<div class="month">';
			cont += (intToMonth(dateObj.month)).toLowerCase();
			cont += '</div>';
		}
		cont += '</div>';

		// emails div
		cont += '<div class="emails">';
		for(var i = 0; i < member.users.length; i++) {
			cont+= member.users[i] + ' ';
		}
		cont += '</div>';

		// merge button
		cont += '<div class="mergeBtn">merge</div>';

		cont += '</div>';

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
				// ignore blanks when the memArr is run through
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
			dateArr.push(testDate);
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
				
				var nextArr = sortByMonth(old, getPrevMonth(testDate), array);
				// to be able to test for breaks when printing
				newArr.push({
					company: 'nextdate'
				});
				newArr = newArr.concat(nextArr);

			} else {
				var nextArr = sortByMonth(old, getPrevMonth(testDate), 'exit');
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

	// physically count the members up
	function countMembers(arr){
		var i = 0;
		var time = 75;
		var counter = arr.length - 1;

		countEm();

		// recursive counter
		function countEm(){
			if(counter != 0){
				i++;
				counter--;
				$('#memTot').text(i);
				time += (i * 1.1);
				setTimeout(countEm, time);
			}
		}

	}


	/// public functions ///
	populatePage.cycleMembers = cycleMembers;
	populatePage.sortByMonth = sortByMonth;


});

// render the requests graph in the header based on the previous week's results
function renderRequestsGraph(){
	var stopCounter = requestData.length * 0.5;
	var weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);
	var withinWeek = [];

	// filter out requests for current week
	// starting at most recent, or last
	var start = requestData.length - 1;

	for(var i = start; i > 0; i--){ 
		var curr = new Date(requestData[i].start);

		if(curr > weekAgo)
			withinWeek.push(requestData[i]);
		else
			stopCounter--;

		// don't want the loop to keep going for no reason
		if(stopCounter == 0)
			break;
	}

	// sort graph data 
	withinWeek.sort(function(a, b){
		var aa = new Date(a.start);
		var bb = new Date(b.start);

		if(aa < bb) return -1;
		if(aa > bb) return 1;
		return 0;
	});

	// create graph data
	var data = {}
	data.labels = [];
	// eventually needs to be [[]]
	data.series = [];

	// fill with all 0s
	var arr = Array.apply(null, new Array(7)).map(Number.prototype.valueOf,0);
	data.series = [arr];
	// fill labels with past week
	for(var i = 0; i < 7; i++){
		var inc = new Date();
		inc.setDate(weekAgo.getDate() + (i + 1));
		var dateString = (inc.getMonth() + 1) + '/' + inc.getDate();
		data.labels.push(dateString);
	}
	// increment series counts
	for(var i = 0; i < withinWeek.length - 1; i++){
		var date = new Date(withinWeek[i].start);
		var dateString = (date.getMonth() + 1) + '/' + date.getDate();

		var ind = $.inArray(dateString, data.labels);
		if(ind != -1){
			var time = withinWeek[i].durHr;
			var mins = withinWeek[i].durMin;
			//console.log(mins /60);
			time += (mins / 60);
			data.series[0][ind] += time;
			//console.log(data.series[0][ind]);
		}
	}

	// create graph
	var options = {
		lineSmooth: Chartist.Interpolation.simple({
			divisor: 20
		}),
		axisY: {
			labelInterpolationFnc: function(value) {
				return value + ' h';
			}
		},
		fullWidth: true,
		height: 160,
		showPoint: true,
		chartPadding: {
			right: 30,
			left: 20
		}
	}
	// init a line chart 
	new Chartist.Line('#ctReqs', data, options);

	// add tooltips
	var $chart = $('#ctReqs');
	var $tooltip = $chart
		.append('<div class="tooltip"></div>')
		.find('.tooltip')
		.hide();

	$chart.on('mouseenter', '.ct-point', function(event) {
			var $point = $(this),
		    	day = $point.attr('ct:day'),
		    	value = $point.attr('ct:value');

		  	$tooltip.html(day + ' <span>' + value + '</span>').show();

		  	$tooltip.css({
				left: $(this).attr('x1') - $tooltip.width() / 2 - 3,
				top: $(this).attr('y1') - $tooltip.height() + 10
			});
	});

	$chart.on('mouseleave', '.ct-point', function() {
	  $tooltip.hide();
	});

	$('#ctReqs').addClass('show');
// change to callback on addClass
	setTimeout(function(){
		// set day for tooltips
		$('#ctReqs .ct-point').each(function(i, pnt){
			var inc = new Date();
			inc.setDate(weekAgo.getDate() + (i + 1));
			var day = intToDay(inc.getDay());
			$(pnt).attr('ct:day', day);
		});
	}, 1000);
}

function renderRequests(num){
	var stop;
	var disableRight = false;
	var content = '';
	// grab global requestData array
	var data = requestData;
	var begin = data.length - 1 - (num * 10);
	var remain = (data.length - 1) % 10;
	// incase there aren't ten requests left to show
	if((((data.length - 1) / 10) - (remain / 10)) <= num){
		stop = begin - remain;
		disableRight = true;
	} else
		stop = begin - 10;

	// print requests into a table
	for(var i = begin; i > stop; i--){
		var end = moment.utc(data[i].end);
		var endTime = moment(end).format('h:mm');
		var endA = moment(end).format('a');

		var start = moment.utc(data[i].start);
		var startTime = moment(start).format('h:mm');
		var startA = moment(start).format('a');
		var date = new Date(data[i].start);
		var dateString = (date.getMonth() + 1) + '/' + date.getDate();

		content += '<tr>';
		content += '<td>';
		if(data[i].event_id){
			content += '<div class="delBtn">X</div>';
		}
		content += data[i].company + '</td>';
		content += '<td>' + data[i].email + '</td>';
		content += '<td>' + data[i].room + '</td>';

		content += '<td>' + dateString + '</td>';
		content += '<td>' + startTime;
		if(startA == 'am')
			content += '<span id="meridiem">' + startA + '</span>';
		content += '</td>';
		content += '<td>' + endTime;
		if(endA == 'am')
			content += '<span id="meridiem">' + endA + '</span>';
		content += '</td>';

		content += '<td>' + data[i].duration + ' <span id="meridiem">h</span></td>';
		content += '</tr>';
	}

	$('#main tbody').html(content);

	// disable left button
	if(num == 0)
		$('#reqPageLeft').attr('disabled', true);
	else
		$('#reqPageLeft').attr('disabled', false);

	// disable right button
	if(disableRight)
		$('#reqPageRight').attr('disabled', true);
	else
		$('#reqPageRight').attr('disabled', false);

	var showString = begin;
	showString += ' <span style="font-weight: 400">to</span> ';
	showString += stop;

	$('#showReqs').html(showString);
	$('#reqOptions').val(num);
	adjustHeaderWidth();
}


// returns previous month based on given month and year
function getPrevMonth(dateObj){
	var newDate = {};
	var prevYear = dateObj.year;
	var prevMonth = dateObj.month - 1;
	// adjust for edge case jan -> dec
	if(prevMonth == 0){
		prevMonth = 12;
		prevYear -= 1;
	}

	newDate.year = prevYear;
	newDate.month = prevMonth;
	return newDate;
}

// returns next month based on given month and year
function getNextMonth(dateObj){
	var newDate = {};
	var nextYear = dateObj.year;
	var nextMonth = dateObj.month + 1;
	// adjust for edge case dec -> jan
	if(nextMonth == 13){
		nextMonth = 1;
		nextYear += 1;
	}

	newDate.year = nextYear;
	newDate.month = nextMonth;
	return newDate;
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
	mergeArr.push(str);

	if(mergeArr.length == 2) {
		// deselect if misclick
		if (mergeArr[0] == mergeArr[1]){
			var mem = mems[mergeArr[0]];
			$(mem).removeAttr('style');
			mergeArr = [];
		} else {
			var first = memArr[mergeArr[0]];
			var second = memArr[mergeArr[1]];
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
				  	populatePage();
				  },
				  dataType: 'application/json'
				});
			}

			for(var i = 0; i < mergeArr.length; i++){
				var mem = mems[mergeArr[i]];
				$(mem).removeAttr('style');
			}

			mergeArr = [];
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

function minToHrs(mins){
	var hrs = Math.floor(mins / 60);
	var min = mins % 60;
	var dur = hrs + (min / 100);
	return dur;
}

function intToMonth(month){
	switch(month){
		case 1: return 'Jan';
			break;
		case 2: return 'Feb';
			break;
		case 3: return 'Mar';
			break;
		case 4: return 'Apr';
			break;
		case 5: return 'May';
			break;
		case 6: return 'Jun';
			break;
		case 7: return 'July';
			break;
		case 8: return 'Aug';
			break;
		case 9: return 'Sept';
			break;
		case 10: return 'Oct';
			break;
		case 11: return 'Nov';
			break;
		case 12: return 'Dec';
			break;
		default: return '???';
			break;
	}
}

function intToDay(day){
	switch(day){
		case 1: return 'Monday';
			break;
		case 2: return 'Tuesday';
			break;
		case 3: return 'Wednesday';
			break;
		case 4: return 'Thursday';
			break;
		case 5: return 'Friday';
			break;
		case 6: return 'Saturday';
			break;
		case 0: return 'Sunday';
			break;
		default: return '???';
			break;
	}
}

function monthToInt(mon){
	var month = mon.toString();
	var mon = month.toLowerCase();
	switch(mon){
		case 'jan': return 1;
			break;
		case 'feb': return 2;
			break;
		case 'mar': return 3;
			break;
		case 'apr': return 4;
			break;
		case 'may': return 5;
			break;
		case 'jun': return 6;
			break;
		case 'july': return 7;
			break;
		case 'aug': return 8;
			break;
		case 'sept': return 9;
			break;
		case 'oct': return 10;
			break;
		case 'nov': return 11;
			break;
		case 'dec': return 12;
			break;
		default: return 0;
			break;
	}
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
		
