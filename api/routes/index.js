var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const util = require('util');

let g_jobs = {};

/* GET home page. */
router.get('/api/hello', function(req,res,next) {
	return res.status(200).send('world');
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

router.post('/api/transcode/job', function(req,res,next) {
	console.log(util.inspect(req.body));
	let job = req.body;
	job.uuid = uuidv4();
	g_jobs[job.uuid] = job;
	res.status(200).json(job);
});
module.exports = router;
