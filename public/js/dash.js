var requestData = [];

$(document).ready(function() {
	populateTable();

	$('#refresh').on('click', function(){
		populateTable();
	});
});

function populateTable() {
	var content = '';
	var arr = [];

	console.log('hello');

	$.getJSON('/list', function(data){
		$.each(data, function() {
			var date, dateString, start, end, duration;
			var exists = false;

			date = new Date(this.end);
			end = date.getUTCHours();
			date = new Date(this.start);
			start = date.getUTCHours();
			dateString = (date.getMonth() + 1) + '/' + date.getDate();
			this.duration = end - start;

			content += '<tr>';
			content += '<td>' + this.company + '</td>';
			content += '<td>' + this.email + '</td>';
			content += '<td>' + this.room + '</td>';

			content += '<td>' + dateString + '</td>';
			content += '<td>' + start + '</td>';
			content += '<td>' + end + '</td>';

			content += '<td>' + this.duration + ' hrs </td>';
			content += '</tr>';

			for(var i = 0; i < arr.length; i++){
				if(arr[i].company == this.company){
					exists = true;
					arr[i].duration += this.duration;
				}
			}

			if (!exists)
				arr.push(this);
		});

		$('#main tbody').html(content);

		// refresh content var
		content = '';
		
		for(var i = 0; i < arr.length; i++){
			console.log(arr[i]);
			content += '<tr>';
			content += '<td>' + arr[i].company + '</td>';
			content += '<td>' + arr[i].duration + '</td>';
			content += '</tr>';
		}

		$('#duration tbody').html(content);

		// schema for db
		// 
		// 
		// two docs
		// one for all requests, will be displayed as most recent
		// 
		// and one for storing the users and their hours reserved for each month
		//     - each doc is a member in all lowercase
		// 
		// cuttlesoft
		//   months
		//   	nov: 3
		//   	dec: 1
		//   users: [user@comp.io, other@email.here]
		// domi
		//   months
		//   	nov: 4
		//   	dec: 0
		//   users: [lucas@domi.com, matt@domi.com, amanda@domi.com]
		//   
		// server does logic on requests to figure everything out
		// table just displays everything and makes it moveable 
		// 
		// first check the name in all lowercase
		// if (name is same)
		// 		add hours to month
		// 		if user is not found
		// 			add user
		// 			


	});
}