# Snag

Automated room reservation for Domi Station's members. Built and maintained during Fall '14 and Spring '15. Node/Express server running on Heroku.


#### User Facing
   - Clean natural language request form
   - Form validation and error notifications
   - Local storage for company and email fields
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
- .env - gitignored
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


### Setup

##### Prerequisites
1. node.js installed
2. npm installed
3. `.env` file is needed to connect to various services (Mandrill, GCal, etc.)

After forking this repo run the following
`$ npm install`
`$ npm update`
Then use any of the following to start the server
`$ node server.js`
`$ foreman start`
Heroku uses Foreman which uses the Procfile, [info here](https://devcenter.heroku.com/articles/procfile#developing-locally-with-foreman)

Head over to `http://localhost:5000/dash` for the dashboard to make sure everything checks out. 

#### When Testing
If you are making changes to room reservations you can test it by opening up `./siteForm/index.html` and changing the ajax url to 'localhost:5000/room'.


