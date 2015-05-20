// functions to render elements on the page
app.render = {

	// update top progress bar
	updateProgress: function(){
		app.progress += app.progressInc;
		$('.progress').css('width', app.progress + '%');
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

	// render requests table 
	requestsTable: function(num){
		var stop;
		var disableRight = false;
		var content = '';
		// grab global app.requestData array
		var data = app.requestData;
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
			var end = moment.utc(data[i].end).utcOffset(-4);
			var endTime = moment(end).format('h:mm');
			var endA = moment(end).format('a');

			var start = moment.utc(data[i].start).utcOffset(-4);
			var startTime = moment(start).format('h:mm');
			var startA = moment(start).format('a');
			var date = new Date(data[i].start);
			var dateString = (date.getMonth() + 1) + '/' + date.getDate();

			content += '<tr>';
			content += '<td>';
			//if(data[i].event_id){
			//	content += '<div class="delBtn">X</div>';
			//}
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

			content += '<td>' + data[i].duration + '</td>';// + ' <span id="meridiem">h</span></td>';
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
	},

	// render the requests graph in the header based on the previous week's results
	requestsGraph: function(){
		var stopCounter = app.requestData.length * 0.5;
		var weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		var withinWeek = [];

		// filter out requests for current week
		// starting at most recent, or last
		var start = app.requestData.length - 1;

		for(var i = start; i > 0; i--){ 
			var curr = new Date(app.requestData[i].start);

			if(curr > weekAgo)
				withinWeek.push(app.requestData[i]);
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
		var chart = new Chartist.Line('#ctReqs', data, options);
		// set accent color
		$('#ctReqs path').css('stroke', app.accentColor);
		$('#ctReqs .ct-point').css('stroke', app.accentColor);

		// Let's put a sequence number aside so we can use it in the event callbacks
		var seq = 0;

		// Once the chart is fully created we reset the sequence
		chart.on('created', function() {
			seq = 0;

			// create tooltips for each point
			$('#ctReqs .ct-point').each(function(i, pnt){
				var inc = new Date();
				inc.setDate(weekAgo.getDate() + (i + 1));
				var day = app.helpers.intToDay(inc.getDay());

				$(pnt).attr('ct:day', day);
			});

			// animate path
			var path = $('#ctReqs path').get(0);
			var pathLen = path.getTotalLength();

			$('#ctReqs path').velocity({
				tween: 1
			},{
				duration: 4500,
				easing: 'eastInOut',
				progress: function(elements, complete, remaining, start, tweenValue){
					var adjustedLen = tweenValue * pathLen;
					$('path').attr('opacity', 1);
					path.setAttribute('stroke-dasharray', adjustedLen+' '+pathLen);
			}
			});

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
						top: $(this).attr('y1') - $tooltip.height() - 20
					});
			});

			$chart.on('mouseleave', '.ct-point', function() {
			  $tooltip.hide();
			});
		});

		// On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
		chart.on('draw', function(data) {
			// set accent color
			$('#ctReqs path').css('stroke', app.accentColor);
			$('#ctReqs .ct-point').css('stroke', app.accentColor);
		  if(data.type === 'point') {
		    // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
		    data.element.animate({
		      opacity: {
		        // The delay when we like to start the animation
		        begin: seq++ * 80,
		        // Duration of the animation
		        dur: 1000,
		        // The value where the animation should start
		        from: 0,
		        // The value where it should end
		        to: 1
		      }
		    });
		  } 
		});

		$('#ctReqs').addClass('show');
	// change to callback on addClass
		setTimeout(function(){
			// set day for tooltips
			
		}, 1000);

	},


	// sets accent color for header
	setAccentColor: function(){
		var rand = Math.floor((Math.random() * 3) + 1);
		var color;

		switch(rand){
		case 1:
		  color = "#f93";
		  break;
		case 2:
		  color = "#339999";
		  break;
		default:
		  color = "#cc4233";
		  break;
		}

		app.accentColor = color;
		$('.header .progress').css('background', color);
		$('.plusRel').css('color', color);
		$('.plusAbs').css('color', color);

		// these two only work for when dom is clicked, not the first time around
		$('#ctReqs path').css('stroke', color);
		$('#ctReqs .ct-point').css('stroke', color);
	},

	// show current date in header
	showTodaysDate: function(){
		var today = moment.utc().utcOffset(-4);
		toDay = moment(today).format('dddd');
		$('#toDay').text(toDay);
		toDate = moment(today).format('Do');
		$('#toDate').text(toDate);
	},

	// randomize welcome message below title
	showWelcomeMessage: function(){
		var rand = Math.floor((Math.random() * 8) + 1);
		var titleString;

		switch(rand){
		case 1:
		  titleString = "Welcome!";
		  break;
		case 2:
		  titleString = "Aloha!";
		  break;
		case 3:
		  titleString = "Cheers!";
		  break;
		case 4:
		  titleString = "Salutations!";
		  break;
		case 5:
		  titleString = "Hello!";
		  break;
		case 6:
		  titleString = "Greetings!";
		  break;
		case 7:
		  titleString = "Bonjour!";
		  break;
		default:
		  titleString = "Good Day!";
		  break;
		}

		$('#welcomeMsg').text(titleString);
	}




}