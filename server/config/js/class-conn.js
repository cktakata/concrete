/**************************************************************************************************
 *
 * IBM Bluemix app with Cloudant service using Node.js
 * Date: 09 May 2016
 *
 */

var Cloudant = require('cloudant');
var q  = require("q");

var cloudant, dbCredentials = {};
var DB = {
	db: {},
	database: "",
	//BULK - INSERT/UPDATE/DELETE
	bulk: function(object) {
		var deferred = q.defer();
		this.db.bulk({docs: object}, '', function(err) {
			if(err) {
				deferred.reject({"status": 500, "body": {}, "error": err});
			} else{
				deferred.resolve({"status": 200, "body": object});
			}
		});
		return deferred.promise;
	},
	//SAVE
	save: function(object) {
		//console.log("[db] save");
		var deferred = q.defer();
		this.db.insert(object, '', function(err, doc) {
			if(err) {
				deferred.reject({"status": 500, "body": {}, "error": err});
			} else{
				deferred.resolve({"status": 200, "body": doc});
			}
		});
		return deferred.promise;
	},
	//FIND
	find: function(object){
		//console.log("[db] find");
		var deferred = q.defer();
		this.db.find(object, function(error, result) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": result});
		});
		return deferred.promise;
	},
	//VIEW
	view: function(designname, viewname, params){
		//console.log("[db] view: ");
		var deferred = q.defer();
		this.db.view(designname, viewname, params, function(error, result) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": result});
		});
		return deferred.promise;
	},
	//SEARCH
	search: function(designname, viewname, params){
		//console.log("[db] search: ");
		var deferred = q.defer();
		this.db.search(designname, viewname, params, function(error, result) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": result});
		});
		return deferred.promise;
	},
	//LIST
	list: function(){
		//console.log("[db] list: ");
		var deferred = q.defer();
		this.db.list({include_docs: true}, function(error, result) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": result});
		});
		return deferred.promise;
	},
	//GET
	get: function(id, params){
		//console.log("[db] get: " + id + " " + params);
		var deferred = q.defer();
		this.db.get(id, params, function(error, result) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": result});
		});
		return deferred.promise;
	},
	//DELETE
	del: function(id, rev){
		//console.log("[db] delete" + id);
		var deferred = q.defer();
		var doc = {"_id":id, "_rev":rev, "_deleted": true};
		this.db.insert(doc, '', function(error, body) {
			if (error) {
				deferred.reject({"status": 500, "body": {}, "error": error});
			}
			deferred.resolve({"status": 200, "body": body});
		});
		return deferred.promise;
	},
	//CONNECT TO DB
	connect: function(database){
		console.log("[db] connecting to cloudant: "+database);
		this.database = database;
		var isValidDatabase = false;
		// read connection parameters from json file
		fs = require('fs');
		var obj = JSON.parse(fs.readFileSync('./connProfile.json', 'utf8'));

		if(obj){
			dbCredentials.host = obj.host;
			dbCredentials.port = obj.port;
			dbCredentials.user = obj.user;
			dbCredentials.password = obj.pass;
			dbCredentials.url = obj.url;
			isValidDatabase = true;
		}else{
			console.log('Connection error');
		}

		if(isValidDatabase){
			cloudant = require('cloudant')(dbCredentials.url);
			cloudant.db.get(database, function (err, res) {
				if (err) {
					console.log('[db] creating new database ', database);
					cloudant.db.create(database, function (err, res) {
						if (err) {
							console.error('[db] could not create db ', err);
						}
					});
				}
			}),
			this.db = cloudant.use(database);
			status = "connected";
		}
	}
};

module.exports = DB;
