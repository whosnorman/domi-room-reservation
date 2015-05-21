// functions to render elements on the page
app.render = {

	// things to include in member elements:
	// 		company name
	// 		aliases
	// 		total hours for previous and current month
	// 		emails using name@ trend with hovering showing their full name
	// 		chart showing usage per last couple months
	// 		
	//   update search bar to search full name not shortened one
	// returns a printed member in html
	printMember: function(member, dateObj, opt){
		var cont = '';

		cont += '<div class="mem" dashID="' + member._id + '">';

		// company name
		cont += '<div class="comp">' + member.company + '</div>';
		cont += '<div class="aliases">';
		for(var i=0; i < member.aliases.length; i++){
			cont += member.aliases[i] + '<br/>';
		}
		cont += '</div>';


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
		cont += '</div></div>';

		// merge button
		cont += '<div class="mergeBtn">merge</div>';

		cont += '</div>';

		return cont;
	},

	// update top progress bar
	updateProgress: function(){
		app.progress += app.progressInc;
		$('.progress').css('width', app.progress + '%');
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
		app.render.adjustTableHeaders();
	},

	// cycle through request table columns and 
	// set header cells to correct width
	adjustTableHeaders: function() {
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
	},

	// render the requests graph in the header 
	// based on the previous week's results
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
				time += (mins / 60);
				data.series[0][ind] += time;
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
		$('#tidbits .divider').css('background', color);
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
	},

	// calculate and show difference of values
	// since last visit
	showValueDifference: function(values, lasts){
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

		// animation for all plus numbers in header
		$('#emailSparedPlus').addClass('plusshow');
		$('#totReqsPlus').addClass('plusshow');
		$('#eastConfPlus').addClass('plusshow');
		$('#westConfPlus').addClass('plusshow');
		$('#totTimePlus').addClass('plusshow');
	},

	showEmails: function(el) {
		var months = el.getElementsByClassName('emails');
		$(months[0]).css('opacity', '1');
	},

	hideEmails: function(el) {
		var months = el.getElementsByClassName('emails');
		$(months[0]).css('opacity', '0');
	},

	toggleHeight: function(el) { 
		var el = $(el);
		if (el.height() > 50) {
			el.css('height', '40px');
		} else {
			el.css('height', '200px');
		}
	}




}