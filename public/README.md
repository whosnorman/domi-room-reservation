### Public File Structure
Renders with `.jade` files in ../app/views


`js`

	- `dash.js` - main js file, waits for $(document).ready to make calls and render everything

	- `models.js` - mostly ajax calls 

	- `helpers.js` - consists of: 
		- app config and global variables 
		- `app.helpers` for utility and helper functions
		- `app.handlers` for event handlers when users interact with the page

	- `lib` - third party libraries such as moment.js and velocity.js 

`dashboard.html` - irrelevant, dashboard.jade is used in `app/views`

`font` - fontello files for some icons

`css` - main style sheet, fontello sheets

`img` - favicon, various images