/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
const crypto = require('crypto');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
var router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var cloudant = require('./server/config/js/class-conn');

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.status(403).end();
    }
}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
	//init database
	console.log("[app] init database");
	cloudant.connect('concrete');  
});

process.on('uncaughtException', function(err) {
    console.log(err);
});

app.get("/", function(req, res) {
    res.sendFile("./public/index.html");
});

app.post('/authenticate', function(req, res) {
	var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
	var obj = {
		selector : {
			"_id": {"$gt":0},
			email: req.body.email,
			password: hash
		}};	
	cloudant.find(obj).then(function(data){
		var doc = data.body.docs[0];
		if(typeof doc == "undefined"){
			res.json({
				type: false,
				data: "Incorrect email/password"
			});  			
		}else{
			// Update
			res.json({
				type: true,
				data: doc,
				token: doc.token
			});			
			doc.ultimo_login = new Date();
			cloudant.save(doc).then(function(data1){
				var doc1 = data1.body.docs[0];
			}).catch(function(err){
				res.json({
					type: false,
					data: "Error occured: " + err.error.reason
				});
			});
		}
	}).catch(function(err) {
		res.json({
			type: false,
			data: "Error occured: " + err.error.reason
		});
	});		
});

app.post('/signin', function(req, res) {
	var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
	var obj = {
		selector : {
			"_id": {"$gt":0},
			email: req.body.email,
			password: hash
		}};	
	cloudant.find(obj).then(function(data){
		var doc = data.body.docs[0];
		if(typeof doc == "undefined"){
			var data_criacao = new Date();
			var data_atualizacao = new Date();
			var ultimo_login = new Date();
			var hash = crypto.createHash('md5').update(req.body.password).digest('hex');
  			var newdoc = {
				"nome":req.body.nome,
				"data_criacao":data_criacao,
				"data_atualizacao":data_atualizacao,
				"ultimo_login":ultimo_login,
				"email":req.body.email,
				"password":hash,
				"telefone":[
					{
						"numero":req.body.numero,
						"ddd":req.body.ddd
					}
				]
			}		
			newdoc.token = jwt.sign(newdoc, "concrete");
			res.json({
				type: true,
				data: newdoc,
				token: newdoc.token
			});				
			cloudant.save(newdoc).then(function(data2){
				console.log("doc saved");
				var doc1 = data2.body.docs[0];
			}).catch(function(err){
				res.json({
					type: false,
					data: "Error occured: " + err.error.reason
				});				
			});
		}else{
		   res.json({
				type: false,
				data: "User already exists!"
			}); 		
		}
	}).catch(function(err) {
		res.json({
			type: false,
			data: "Error occured: " + err.error.reason
		});
	});	
});

app.get('/me', ensureAuthorized, function(req, res) {
	var obj = {
		selector : {
			"_id": {"$gt":0},
			token: req.token
		}};	
	cloudant.find(obj).then(function(data){	
		var doc = data.body.docs[0];
		if(typeof doc == "undefined"){
			res.json({
				type: false,
				data: "Error occured: " + data.error
			});	 			
		}else{
		   res.json({
				type: true,
				data: doc,
			}); 		
		}
	}).catch(function(err) {
		res.json({
			type: false,
			data: "Error occured: " + err.error.reason
		});	
	})
});

