module.exports.intToMonth = function(month){
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
	    default: return 'NA';
	      break;
	}
};

module.exports.intToDay = function(day){
	switch(day){
	    case 0: return 'Sunday';
	      break;
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
	    default: return 'NA';
	      break;
	}
};