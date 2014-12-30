var requestData = [];

$(document).ready(function() {
	populateTable();

	$('#refresh').on('click', function(){
		populateTable();
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
});

function expand(el) {
	el.addClass('expand');
	el.removeClass('mem');
}

function populateTable() {
	var content = '';
	var arr = [];

	$.getJSON('/reqs', function(obj){
		var date, dateString, start, end, duration;
		var data = [];

		for(var item in obj){
			data[item] = obj[item];
		}

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
			content += '<td>' + data[i].company + '</td>';
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
		console.log(counter);
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


	$.getJSON('/mems', function(data){
		var content = '';
		var date = new Date();
		var year = date.getFullYear();
		var month = date.getMonth() + 1;
		var counter = 0;

		$.each(data, function() {

			content += '<div class="mem">';
			content += '<div class="comp">' + this.company + '</div>';
			content += '<div class="months">';

			var years = this.years;
			if(years.hasOwnProperty(year)){
				if(years[year].hasOwnProperty(month)){
					if(years[year].hasOwnProperty(month - 1)){
						content += '<div>';
						content += intToMonth(month - 1) + ': ' + this.years[year][month - 1];
						content += '</div>';
					}

				content += '<div>';
				content += intToMonth(month) + ': ' + this.years[year][month];
				content += '</div>';
				} else {
					content += '<div> no data </div>';
				}
			} else {
				content += '<div> no data </div>';
			}
			content += '</div>';

			content += '<div class="emails">';
			for(var i = 0; i < this.users.length; i++) {
				content+= this.users[i] + ' ';
			}
			content += '</div>';

			content += '</div>';

			counter++;


		});

		var i = 0;
		var time = 75;
		function countMembers(){
			if(counter != 0){
				i++;
				counter--;
				$('#memTot').text(i);
				time += (i * 1.1);
				setTimeout(countMembers, time);
			}
		}

		countMembers();
		$('#members').html(content);
		$('.mem').each(function() {
			this.addEventListener('mouseover', function(){
				showMonths(this);
			});
			this.addEventListener('mouseout', function(){
				hideMonths(this);
			});
			this.addEventListener('click', function(){
				toggleHeight(this);
			});
		});

	});
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
		case 11: return 'Nov';
			break;
		case 12: return 'Dec';
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
		
