var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const util = require('util');

let g_jobs = {};
let g_job_test = {
    "sourceUrl": "https://torii-demo.hkmesh.net/test.mp4",
    "paramCrf": "23",
    "paramProfile": "ultrafast",
    "paramResolutionWidth": "1280",
    "paramResolutionHeight": "720",
    "meshubNumbers": "2",
    "uuid": "16b53dd0-788d-4e29-b4fc-bca2094b1047"
}

g_jobs[g_job_test.uuid] = g_job_test;

let g_job_test_meshub0 = {};
g_job_test_meshub0 = Object.assign(g_job_test_meshub0,g_job_test);
g_job_test_meshub0.paramSeekBeginSec = 0;
g_job_test_meshub0.paramSeekEndSec = 60;
delete g_job_test_meshub0.meshubNumbers;

let g_job_test_meshub1 = {};
g_job_test_meshub1 = Object.assign(g_job_test_meshub1,g_job_test_meshub0);
g_job_test_meshub1.paramSeekBeginSec = 60;
g_job_test_meshub1.paramSeekEndSec = 120;



/* GET home page. */
router.get('/api/hello', function(req,res,next) {
	return res.status(200).send('world');
});

router.post('/api/transcode/job', function(req,res,next) {
	console.log(util.inspect(req.body));
	let job = req.body;
	job.uuid = uuidv4();
	g_jobs[job.uuid] = job;
	res.status(200).json(job);
});

router.get('/api/transcode/job', function(req, res, next) {
	let job_uuid = req.query.uuid;
	if (job_uuid == null) {
		return res.status(200).json(g_jobs);
	}
	else {
		let job = g_jobs[job_uuid];
		if (job == null) return res.status(404).end();
		else return res.status(200).json(g_jobs[job_uuid]);
	}
});

router.get('/api/transcode/job_meshub', function(req, res, next) {
	let meshub_ip = req.clientIp;
	console.log(`GET job_meshub from ${meshub_ip}`);
	let job_json = {};
	if (req.query.test == 'meshub0') {
		job_json = g_job_test_meshub0;
	}
	if (req.query.test == 'meshub1') {
		job_json = g_job_test_meshub1;
	}
	return res.status(200).json(job_json);
});

router.post('/api/transcode/job_meshub_progress', function (req,res,next) {
	let meshub_ip = req.clientIp;
	console.log(`POST job_meshub_profress from ${meshub_ip},job_uuid=${req.query.uuid}`);

	let job_uuid = req.query.uuid;
	if (job_uuid == null) {
		return res.status(404).end();
	}

	if (req.query.test == 'meshub0') {
		g_job_test_meshub0.progress = req.body.progress;
	}
	if (req.query.test == 'meshub1') {
		g_job_test_meshub1.progress = req.body.progress;
	}
	g_jobs[job_uuid]
	return res.status(200).end();
});

router.post('/api/transcode/upload', function(req, res,next) {
	if (!req.files || Object.keys(req.files).length === 0) {
	  return res.status(400).send('No files were uploaded.');
	}
  
	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.sampleFile;
  
	// Use the mv() method to place the file somewhere on your server
	let path = `${__dirname}/${sampleFile.name}`;
	sampleFile.mv(path, function(err) {
	  if (err)
		return res.status(500).send(err);
  
	  res.status(200).json({result: 'upload success', path: path});
	});
  });
module.exports = router;
