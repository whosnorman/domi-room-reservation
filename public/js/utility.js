//
//// config and global variables
app.requestData = [];
app.requestCurrent = 0;
app.mergeArr = [];
app.memArr = [];
app.dateArr = [];
app.loadCal = true;
app.progress = 0;
app.accentColor;
// updateProgress in 
// 		document ready, after requests, after members, get last values
app.progressInc = 91.6 / 4;




//
//// utility and helper functions
app.helpers = {
	// return int pertaining to month 
	monthToInt: function(mon){
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
	},

	intToMonth: function(month){
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
	},

	intToDay: function(day){
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
	},

	dayToInt: function(day){
		switch(day){
			case 'Monday': return 1;
				break;
			case 'Tuesday': return 2;
				break;
			case 'Wednesday': return 3;
				break;
			case 'Thursday': return 4;
				break;
			case 'Friday': return 5;
				break;
			case 'Saturday': return 6;
				break;
			case 'Sunday': return 0;
				break;
			default: return '???';
				break;
		}
	},

	minToHrs: function(mins){
		var hrs = Math.floor(mins / 60);
		var min = mins % 60;
		var dur = hrs + (min / 100);
		return dur;
	},

	// visibly count up a number using easeOutExpo
	countUp: function(id, count, opt){
		var fallbackDur = Math.floor(Math.random()*(7000-5000+1)+5000);
		var duration = opt || fallbackDur;
		var element = $(id);
		element.velocity({
			opacity: 1,
			tween: 1
		},{
			duration: duration,
			easing: 'easeOutExpo',
			progress: function(elements, complete, remaining, start, tweenValue){
				element.text(Math.floor(tweenValue * count));
			}
		});
	},

	// returns previous month based on given month and year
	getPrevMonth: function(dateObj){
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
	},

	// returns next month based on given month and year
	getNextMonth: function(dateObj){
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
	},

};




//
////
// events that fire when a user interacts with the page
// automatically runs when called, used for base events
app.handlers = (function(){
	// refresh in header
	$('#refresh').on('click', function(){
		app.populatePage();
	});

	// reconfig in footer
	$('#reconfig').on('click', function(){
		app.models.reconfigureMembers();
	});

	// load calendar in footer
	$('#loadCal').on('click', function(){
		if(app.loadCal){
			$('#loadCal').text('Hide Snag Calendar');
			$('#calendar').html('<iframe src="https://www.google.com/calendar/embed?src=domiventures.co_e1eknta8nrohjg1lhrqmntrla4%40group.calendar.google.com&amp;color=%23333333&amp;showTitle=0&amp;showNav=0&amp;showPrint=0&amp;showCalendars=0&amp;mode=WEEK&amp;height=400&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;ctz=America%2FNew_York" style=" border-width:0 " width="1000" height="600" frameborder="0" scrolling="no"></iframe>');
			app.loadCal = false;
		} else {
			$('#loadCal').text('Load Snag Calendar');
			$('#calendar').html('');
			app.loadCal = true;
		}
	});

	// restart server button in footer
	$('#restart').on('click', function(){
		if(confirm('Are you sure you want to restart the server?')){
			$('#restart').css('border-color', '#F5A924');
			$.ajax({
				type: "POST",
				url: '/restart',
				data: '',
				success: function(){
					console.log('restarted');
					$('#restart').css('border-color', '#24EF45');
				},
				error: function(){
					console.log('restart failed');
					$('#restart').css('border-color', '#EE3333');
				}
			});
		}
	});

	// search bar eye glass
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

	// search bar input 
	$('#search').on('keyup', function(){
		var text = $('#search').val();
		var counter = 0;
		$('.mem').each(function() {
			var id = $(this).attr('dashID');
			var member = app.members.lookup(id);
			var str = member.company;
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

	// member sort minus a month
	$('#memSortLeft').on('click', function(){
		app.members.sortByDir('left');
	});

	// member sort plus a month
	$('#memSortRight').on('click', function(){
		app.members.sortByDir('right');
	});

	// request table page left
	$('#reqPageLeft').on('click', function(){
		if($(this).attr('disabled') != 'disabled')
			app.render.requestsTable(--app.requestCurrent);
	});

	// request table page right
	$('#reqPageRight').on('click', function(){
		if($(this).attr('disabled') != 'disabled')
			app.render.requestsTable(++app.requestCurrent);
	});

	// dropdown to change request table page
	$('#reqOptions').change(function(){
		app.requestCurrent = $(this).val();
		app.render.requestsTable(app.requestCurrent);
	});

	$('.dom').on('click', function(){
		app.render.setAccentColor();
	});
});