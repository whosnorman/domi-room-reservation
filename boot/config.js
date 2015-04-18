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

module.exports = function(app){
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

	app.use(allowCrossDomain);

	app.helpers = require(__dirname + '/../app/helpers');

	// run through controllers and require all
	autoload('app/controllers', app);
 
	// create mandrill client THIS WAS mandrillClient
	app.mandrill = new mandrill.Mandrill('x6BKz6My1EWINC6ppAeIMg');
	app.mongodb = mongodb;

	app.GoogleToken = GoogleToken;
	app.googleapis = googleapis;

	app.moment = moment;


	// logger
	app.use(logfmt.requestLogger());

	// for routing and rendering
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));

	app.use("/public", express.static(__dirname + '/public'));
	app.use("/js", express.static(__dirname + '/public/js'));
	app.use("/css", express.static(__dirname + '/public/css'));
	app.use("/img", express.static(__dirname + '/public/img'));
	app.use("/font", express.static(__dirname + '/public/font'));




}