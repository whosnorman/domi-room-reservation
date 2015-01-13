var requestData = [];
var mergeArr = [];
var memArr = [];
var dateArr = [];

$(document).ready(function() {
	populatePage();

	// button listeners
	$('#refresh').on('click', function(){
		populatePage();
	});

	$('#reconfig').on('click', function(){
		reconfigureMembers();
	});

	$('#approx').hover(
		function(){
			$('#explain').css('display', 'block');
		}, function(){
			$('#explain').css('display', 'none');
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

	$('.icon-left-dir').on('click', function(){
		sorterBtn('left');
	});

	$('.icon-right-dir').on('click', function(){
		sorterBtn('right');
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
function sorterBtn(dir){
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
	var content = '';
	var arr = [];

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
		var date, dateString, start, end, duration;
		var data = [];

		for(var item in obj){
			data[item] = obj[item];
		}

		// print requests into a table
		for(var i = data.length - 1; i > 0; i--){
			date = new Date(data[i].end);
			end = date.getUTCHours();
			date = new Date(data[i].start);
			start = date.getUTCHours();
			dateString = (date.getMonth() + 1) + '/' + date.getDate();

			if(start > end)
				data[i].duration = (end + 24) - start;
			else
				data[i].duration = end - start;

			content += '<tr>';
			content += '<td>';
			if(data[i].event_id){
				content += '<div class="delBtn">X</div>';
			}
			content += data[i].company + '</td>';
			content += '<td>' + data[i].email + '</td>';
			content += '<td>' + data[i].room + '</td>';

			content += '<td>' + dateString + '</td>';
			content += '<td>' + start + '</td>';
			content += '<td>' + end + '</td>';

			content += '<td>' + data[i].duration + ' hrs </td>';
			content += '</tr>';
		}

		$('#main tbody').html(content);

		var totString = 'Total Requests: ' + data.length;


		var i = 0;
		var time = 25;
		// approximation of saved emails
		var counter = data.length * 2.125;
		function countEmails(){
			if(counter > 0){
				i++;
				counter--;
				$('#emailSpared').text(i);
				time += (i * 0.02);
				setTimeout(countEmails, time);
			}
		}

		countEmails();
		$('#totReqs').html(totString);

		adjustHeaderWidth();
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
				content += '<div class="line"></div>';
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
			var str = $(comp).text();
			if(str.length - 1 > 16) {
				var newStr = str.substring(0, 16) + '...';
				$(comp).text(newStr);
				$(comp).attr('title', str);
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
				mergeToggle(count);
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

function mergeToggle(num) {
	var mems = document.getElementsByClassName('mem');
	$(mems[num]).css('border-color', 'rgba(255, 153, 51, 1');
	mergeArr.push(num);

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
		
