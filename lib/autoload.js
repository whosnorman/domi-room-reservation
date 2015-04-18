var fs = require('fs');
var path = require('path');

module.exports = function autoload(dir, app){
	if(!fs.existsSync(dir))
		return;

	// loop through all files
	for file in fs.readdirSync(dir){
		// create correct path
		var pathname = path.join(dir, file);

		// if directory, recursively call else require script
		if(fs.lstatSync(pathname).isDirectory())
			autoload(pathname, app);
		else{
			var base = require(__dirname + '/../' + pathname);
			if(typeof (base) === "function")
				base(app);
		}
	}
}