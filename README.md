# Snag

Automated room reservation for Domi Station's members.

Built and maintained during Fall '14 and Spring '15.

Node/Express server running on Heroku.


#### User Facing
   - Clean natural language request form
   - Form validation and error notifications
   - Local storage for company and email
   - Auto fill the current date for faster requests
   - Check if room is available before proceeding
   - Confirmation emails with Mandrill
   - Full width loading bar that doesn't glitch

#### Backend
   - Google calendar server to server (no user) authentication
   - Utilization of `gcal.events.list` and `gcal.events.insert`
   - Confirmation and error emails with Mandrill
   - MongoDB storage for members and requests
   - Dashboard showcasing database and light analytics
   - Slight MVC framework


#### File Structure

- server.js
- package.json
- boot/
	- index.js
	- config.js
	- routes.js
- app/
	- controllers/
		- dash.js
		- snag.js
	- models/
		- db.js
		- email.js
		- calendar.js
	- helpers/
		- index.js
	- views/
		- dash.jade
		- member.jade
		- requests.jade
		- footer.jade
- public/
	- css/
	- js/
	- img/
	- font/
- siteForm/
	- form for squarespace site
