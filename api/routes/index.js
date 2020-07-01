var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const fs = require('fs');
const os = require('os');

//let g_jobs = {};
let g_job_test = {};

/* GET home page. */
router.get('/api/hello', function(req,res,next) {
	return res.status(200).send('world');
});

meshub_id_map = [
	'42.200.176.59',	//6a15
	'42.200.236.220',	//77f8
	'42.200.242.86',	//6923
	'42.200.255.169'	//137a
];

function job_dispatch(job) {
	job.meshubNumbers = parseInt(job.meshubNumbers);
	let meshubNumbers = job.meshubNumbers;
	let segmentLength = 240 / meshubNumbers;
	let paramSeekBeginSec = 0;
	let paramSeekEndSec = segmentLength;
	
	job.splitJobs = [];
	job.overall_progress = 0;
	for (let i=0;i<meshubNumbers;i++) {
		let job_slice = {};
		Object.assign(job_slice,job);
		delete job_slice.meshubNumbers;
		delete job_slice.overall_progress;
		delete job_slice.splitJobs;
		job_slice.paramSeekBeginSec = paramSeekBeginSec;
		job_slice.paramSeekEndSec = paramSeekEndSec;
		job_slice.meshubId = meshub_id_map[i];
		job_slice.progress = 0;
		job_slice.uploadFileName = `${job.uuid}-${i}.mp4`;
		job.splitJobs.push(job_slice);
		paramSeekBeginSec += segmentLength;
		paramSeekEndSec += segmentLength;
	}
}

function job_find(job_uuid) {
	if (job_uuid == g_job_test.uuid) return g_job_test;
	else return null;
}

function job_create_test() {
	g_job_test = {
		"sourceUrl": "https://torii-demo.meshub.io/test.mp4",
		"paramCrf": "23",
		"paramProfile": "ultrafast",
		"paramResolutionWidth": "1280",
		"paramResolutionHeight": "720",
		"meshubNumbers": "2",
		"uuid": "16b53dd0-788d-4e29-b4fc-bca2094b1047",
		"splitJobs" : []
	}
}

function delete_old_mp4_files() {
	const child_process = require('child_process');
	let cmd = 'rm -f routes/*.mp4';
	let stdout = child_process.execSync(cmd);
	console.log(`delete_mp4:${stdout.toString()}`);
}
function find_meshub_id_from_request(req) {
	let meshubId = req.clientIp;
	if (req.query.test == 'meshub0') meshubId = meshub_id_map[0];
	if (req.query.test == 'meshub1') meshubId = meshub_id_map[1];
	if (req.query.test == 'meshub2') meshubId = meshub_id_map[2];
	if (req.query.test == 'meshub3') meshubId = meshub_id_map[3];
	return meshubId;
}

//job_dispatch(g_job_test);
//console.log(`test job:\n ${util.inspect(g_job_test)}`);

router.post('/api/transcode/job', function(req,res,next) {
	console.log(util.inspect(req.body));
	g_job_test = req.body;
	g_job_test.uuid = uuidv4();
	job_dispatch(g_job_test);
	delete_old_mp4_files();
	res.status(200).json(g_job_test);
});

router.get('/api/transcode/job', function(req, res, next) {
	let job_uuid = req.query.uuid;
	if (job_uuid == null) {
		return res.status(200).json(g_jobs);
	}
	else {
		let job = job_find(job_uuid);
		if (job == null) return res.status(404).end();
		else return res.status(200).json(job);
	}
});

router.get('/api/transcode/job_meshub', function(req, res, next) {

	let meshub_ip = req.clientIp;
	console.log(`GET job_meshub from ${meshub_ip},query.test=${req.query.test}`);
	let job_json = {};

	let meshubId = find_meshub_id_from_request(req);

	if (g_job_test && g_job_test.splitJobs && g_job_test.splitJobs.length > 0 ) {
		for (let i=0;i<g_job_test.splitJobs.length;i++) {
			let splitJob = g_job_test.splitJobs[i];
			if (splitJob.meshubId == meshubId && splitJob.progress == 0) {
				job_json = splitJob;
			}
		}
	}
	console.log(`dispatched splitJob: ${util.inspect(job_json)}`);	
	return res.status(200).json(job_json);
});

router.post('/api/transcode/job_meshub_progress', function (req,res,next) {
	let meshub_ip = req.clientIp;
	console.log(`POST job_meshub_progress from ${meshub_ip}, query.test=${req.query.test}, progress=${req.body.progress}`);

	let job_uuid = req.body.uuid;
	if (job_uuid == null) {
		return res.status(400).json({error:`job uuid not found in request body`});
	}

	let job = job_find(job_uuid);
	if (job == null) {
		return res.status(404).json({error:`job with uuid not found: ${job_uuid}`});
	}

	let meshubId = find_meshub_id_from_request(req);

	let overall_progress = 0;
	for (let i=0;i<job.splitJobs.length;i++) {
		let splitJob = job.splitJobs[i];
		if (splitJob.meshubId == meshubId) {
			splitJob.progress = req.body.progress;
		}
		overall_progress += splitJob.progress;
	}
	job.overall_progress = overall_progress / job.meshubNumbers;
	if (job.overall_progress == 100) {
		job.result_mp4 = 'https://torii-demo.meshub.io/result_pseudo.mp4';
	}
	return res.status(200).end();
});

router.post('/api/transcode/upload', function(req, res,next) {
	console.log(`UPLOAD from ${req.clientIp},name=${req.files.sampleFile.name}`);
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
  
	  let job_uuid = find_job_uuid_from_slice_filename(sampleFile.name);
	  if (job_uuid == null) {
		  return res.status(200).json({result: `failed to parse job uuid:${sampleFile.name}`});
	  }

	  console.log(`upload: checking transcode job: ${job_uuid}`);
	  let job = job_find(job_uuid);
	  if (job == null) {
		  return res.status(200).json({result: `failed to find job with uuid:${job_uuid}`});
	  }

	  res.status(200).json({result: 'upload success', path: path});

	  //might trigger concat job
	  let all_split_jobs_uploaded = true;
	  for (let i=0;i<job.splitJobs.length;i++) {
		  let job_slice = job.splitJobs[i];
		  let transcode_segment_exist = fs.existsSync(`${__dirname}/${job_slice.uploadFileName}`);
		  if (transcode_segment_exist == false) {
			  all_split_jobs_uploaded = false;
		  }
		  console.log(`job_slice for meshub ${job_slice.meshubId} : progress=${job_slice.progress}, segment_file=${job_slice.uploadFileName},segment_file_exists=${transcode_segment_exist}, dir=${__dirname}`);
	  }
	  
	  if (all_split_jobs_uploaded) {
		execute_concat();
		job.overall_progress = 100;
		job.result_mp4 = `https://torii-demo.meshub.io/result.mp4`;
	  }
	});
  });
module.exports = router;

function execute_concat() {
	const execFileSync = require('child_process').execFileSync;
	let cmd = `${__dirname}/test_concat.sh`;
	if (os.platform() == 'darwin') cmd = `${__dirname}/test_concat_mac.sh`;
	const stdout = execFileSync(cmd);
	console.log(`concat finished: ${stdout}`);
}

function find_job_uuid_from_slice_filename(str) {
	const regex = /(.*)\-[0-9]+\.mp4/gm;
	//const str = `204ba217-fe5c-4a8a-91c7-258b434d6593-11.mp4`;
	let m;
	while ((m = regex.exec(str)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		
		// The result can be accessed through the `m`-variable.
		if (m.length > 1) return m[1];
		else return null;
	}
}
