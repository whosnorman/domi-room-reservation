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

		// each month over time 
		// could store emails that are associated with each company
		// check for either a similar name or an email that is on the list 


	});
}