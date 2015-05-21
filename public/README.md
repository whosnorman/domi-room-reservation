
# Public File Structure
Renders with `.jade` files in `../app/views`


`js/`

- `dash.js` - main js file, consists of:
	- populatePage to kick off retrieving data and rendering
	- get requests and calculate header stats
	- `app.models` to abstract away various ajax calls

- `utility.js` - consists of:
	- app config and global variables 
	- `app.helpers` for utility and helper functions
	- `app.handlers` for event handlers when users interact with the page

- `renders.js` - functions to render aspects of the page

- `members.js` - functions pertaining to manipulating and dealing with the list of members

`lib/` - third party libraries such as [moment.js](http://momentjs.com/) and [velocity.js](http://julian.com/research/velocity/)

`font/` - fontello files for some icons

`css/` - main style sheet, fontello sheets

`img/` - favicon, various images
