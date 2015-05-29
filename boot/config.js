var request = require('request');
var logfmt = require("logfmt");
var bodyParser = require('body-parser');

var moment = require('moment');
var googleapis = require('googleapis');
var GoogleToken = require('gapitoken');

var mandrill = require('mandrill-api/mandrill');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var autoload = require('../lib/autoload');
var dotenv = require('dotenv');

module.exports = function(app){

	// used for FROM field and to send errors to
	app.adminEmail = "lucas@domiventures.co";


	// set headers
	var allowCrossDomain = function(req, res, next) {
	    res.header('Access-Control-Allow-Origin', '*');
	    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	    // intercept OPTIONS method
	    if ('OPTIONS' == req.method) {
	      res.send(200);
	    }
	    else {
	      next();
	    }
	};

	app.set('views', __dirname + '/../app/views');
	app.set('view engine', 'jade');
	app.use(allowCrossDomain);
	// logger
	app.use(logfmt.requestLogger());
	// for routing and rendering
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));

	app.use("/public", app.express.static(__dirname + '/../public'));
	app.use("/js", app.express.static(__dirname + '/../public/js'));
	app.use("/css", app.express.static(__dirname + '/../public/css'));
	app.use("/img", app.express.static(__dirname + '/../public/img'));
	app.use("/font", app.express.static(__dirname + '/../public/font'));
	


	app.helpers = require(__dirname + '/../app/helpers');


	// loads .env into process.env
	dotenv.load();
	app.env = process.env;
 
	// create mandrill client 
	// USED TO BE mandrillClient
	app.mandrill = new mandrill.Mandrill(app.env.MANDRILL);
	app.mongodb = mongodb;
	app.GoogleToken = GoogleToken;
	app.googleapis = googleapis;
	app.moment = moment;
	app.requestModule = request;

	// run through controllers and require all
	autoload('app/controllers', app);

	app.models = {};
	autoload('app/models', app);


}