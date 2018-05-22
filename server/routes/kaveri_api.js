var express = require('express');
var router = express.Router();
var vcapServices = require("vcap_services");
var Cloudant = require('@cloudant/cloudant');
var credentials = {};
if(process.env.VCAP_SERVICES){ //for bluemix env
	credentials = vcapServices.getCredentials('cloudantNoSQLDB', null, 'cloudant_land_records'); //get the cloudant_land_records service instance credentials
	console.log("credentials",credentials);
}
var cloudant_url = process.env.CLOUDANT_DB_URL || credentials.url;
var cloudant = Cloudant(cloudant_url);
//create the document in the db if not available
var kaveriDBName = process.env.KAVERI_DB || "mojani";

cloudant.db.create(kaveriDBName, function(err) {
        if (err) {
            console.log('Could not create new db: ' + kaveriDBName+ ', it might already exist.');
        }
		
});
//connect to Kaveri DB
var kaveri = cloudant.use(kaveriDBName);
  
  //create index in db on ward no if not existing
  var ward = {name:'ward', type:'json', index:{fields:['wardNo']}};
	kaveri.index(ward, function(er, response) {
	  if (er) {
		console.log("Error creating index on ward no:"+ er);
	  }else{
		console.log('Index creation result on ward:'+ response.result);
	  }
	});
	
  //create index in db on PID if not existing
  var pid = {name:'pid', type:'json', index:{fields:['pid']}};
	kaveri.index(pid, function(er, response) {
	  if (er) {
		console.log("Error creating index on pid:"+ er);
	  }else{
		console.log('Index creation result on pid:'+ response.result);
	  }
	});

 //Create index in db on txn ID if not existing
 var txnID= {name:'txnID', type:'json', index:{fields:['txnID']}};
 kaveri.index(txnID, function(er, response){
    if (er) {
		console.log("Error creating index on txnid:"+ er);
    }else{
        console.log('Index creation result on txnid:'+ response.result);
    }
 });

 //Create index in db on timestamp if not existing
 var timeStamp= {name:'TimeStamp', type:'json', index:{fields:['TimeStamp']}};
 kaveri.index(timeStamp, function(er, response){
    if (er) {
		console.log("Error creating index on TimeStamp:"+ er);
    }else{
        console.log('Index creation result on TimeStamp:'+ response.result);
    }
 });

/* POST API to create a new land record in Kaveri*/
router.post('/api/addLandRecordKaveri', (req, res) => {
  console.log('Inside Express api to add new land record kaveri');
  console.log("Received txnid: " + req.body.txnid);
  var record = req.body;
  var id = req.body.txnID;
    kaveri.insert(record, id, function(err, doc) {
        if (err) {
            console.log("Error saving record to kaveri" +err);
            res.json({success:false, message: err.toString()});
        }else{
            console.log("success inserting record to kaveri");
            res.json({success : true, message : "Land record added successfully to kaveri"});
            }
										
    });	
});

/* POST API to update approved records in kaveri*/
router.post('/api/updateKaveriApprovedRecords', (req, res) => {
  console.log('Inside Express api to update new land record');
  var records = req.body; //Array of land records
  console.log("list of documents" + JSON.stringify(records));
  var documentIdsAdded = [];
  kaveri.find({selector:{txnID:records[0].txnID}}, function(er, result) {
	  if (er) {
		console.log("Error finding documents");
	  }
	  console.log('Found documents with Txn ID '+ records[0].txnID +":"+ result.docs.length);
	  for (var i = 0; i < result.docs.length; i++) {
		console.log('Doc id:'+ result.docs[i].id);
		records[i]["_id"] = result.docs[i]["_id"];
		records[i]["_rev"] = result.docs[i]["_rev"];
        documentIdsAdded.push(result.docs[i].pid);
		}
		  kaveri.bulk({docs : records}, function(err, doc) {
					if (err) {
						console.log("Error updating records to Kaveri" +err);
						res.json({success : false, message : err+""});
					} else{
						console.log("success saving records to Kaveri");
				       res.json({success : true, documentIdsAdded : documentIdsAdded});
					}				
				});	

	}); 
});

/* GET API to get land records from MOJANI using ward No*/
router.get('/api/getLandRecordsKaveriByWard/:id', (req, res) => {
  console.log('Inside Express api to get land records');
	kaveri.find({selector:{wardNo:req.params.id}}, function(er, result) {
	  if (er) {
		console.log("Error finding documents");
		res.json({success : false,message:"Error finding documents",landRecords:null});
	  }
	  console.log('Found documents with wardNo count: '+ req.params.id +":"+ result.docs.length);
/* 	  for (var i = 0; i < result.docs.length; i++) {
		console.log('Doc:'+ JSON.stringify(result.docs[i]));
	  } */
	  res.json({success : true, message:"Found "+result.docs.length+" documents", landRecords:result.docs});
	});
});

/* GET API to get land records from Kaveri using PID*/
router.get('/api/getLandRecordsKaveriByPid/:id', (req, res) => {
  console.log('Inside Express api to get land records by Pid');
  kaveri.find({selector:{pid:Number(req.params.id)}}, function(er, result) {
	  if (er) {
		console.log("Error finding documents");
		res.json({success : false,message:"Error finding documents",landRecords:null});
	  }
	  console.log('Found documents with PID count:'+ req.params.id +":"+ result.docs.length);
	  res.json({success : true, message:"Found "+result.docs.length+" documents", landRecords:result.docs});
	});
});

/* GET API to get land records from Kaveri using PID*/
router.get('/api/getLandRecordsKaveriBytxnId/:id', (req, res) => {
  console.log('Inside Express api to get land records by Txn id');
  kaveri.find({selector:{txnID:Number(req.params.id)}}, function(er, result) {
	  if (er) {
		console.log("Error finding documents");
		res.json({success : false,message:"Error finding documents",landRecords:null});
	  }
	  console.log('Found documents with Txn ID count:'+ req.params.id +":"+ result.docs.length);
	  res.json({success : true, message:"Found "+result.docs.length+" documents", landRecords:result.docs});
	});
});

module.exports = router;