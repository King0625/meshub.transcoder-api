var express = require('express');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const util = require('util');
const fs = require('fs');
const os = require('os');

const Job = require('../models/job');
const Meshub = require('../models/meshub');
const SplitJob = require('../models/splitJob');

async function refresh_meshub_status() {
	const meshubs = await Meshub.find({});
	for (meshub of meshubs) {
		if (Date.now() - meshub.timestamp.getTime() > 60000) {
			meshub.dead = true;
		}
		meshub.time = meshub.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
		await meshub.save();
	}
	return meshubs;
}

/* GET home page. */
router.get('/api/hello', async function (req, res, next) {
	const meshubs = await refresh_meshub_status();
	return res.status(200).json(meshubs);
});

router.get('/api/hello/reset', async function (req, res, next) {
	await Meshub.remove({});
	return res.status(200).json(await Meshub.find({}));
});

// meshub_id_map = [
// 	'119.247.119.29',	//d65d
// 	'42.200.236.220',	//77f8
// 	'42.200.242.86',	//6923
// 	'42.200.255.169'	//137a
// ];

// meshub_id_map.push('59.148.144.180'); //845e
// meshub_id_map.push('183.179.232.171'); //e59e
// meshub_id_map.push('61.93.58.34'); //eac3
// //meshub_id_map.push('58.177.109.141'); //ee23  NG, version=1.0s
// meshub_id_map.push('112.120.198.25'); //44ca

async function job_dispatch(job) {
	job.meshubNumbers = parseInt(job.meshubNumbers);
	let meshubNumbers = job.meshubNumbers;
	let segmentLength = 80 / meshubNumbers;
	let paramSeekBeginSec = 0;
	let paramSeekEndSec = segmentLength;

	job.splitJobs = [];
	job.overall_progress = 0;
	const alive_meshubs = await Meshub.find({ dead: false });
	if (Date.now() - meshub.timestamp.getTime() > 60000) {
		meshub.dead = true;
	}
	for (let i = 0; i < meshubNumbers; i++) {
		// To prevent if meshubNumber is greater than the number of alive meshubs
		let assigned = i % alive_meshubs.length;

		let job_slice = {};
		Object.assign(job_slice, job);
		delete job_slice.meshubNumbers;
		delete job_slice.overall_progress;
		delete job_slice.splitJobs;
		job_slice.paramSeekBeginSec = paramSeekBeginSec;
		job_slice.paramSeekEndSec = paramSeekEndSec;
		job_slice.meshubId = alive_meshubs[assigned].ip_address;
		job_slice.progress = 0;
		job_slice.uploadFileName = `${job.uuid}-${i}.mp4`;
		job.splitJobs.push(job_slice);
		paramSeekBeginSec += segmentLength;
		paramSeekEndSec += segmentLength;
		console.log(`pushed job_slice ${i}/${meshubNumbers}: seekBegin=${paramSeekBeginSec},seekEnd=${paramSeekEndSec}`);
	}

	(async function () {
		const insertMany = await SplitJob.insertMany(job.splitJobs);
		console.log(`Bulk insert split jobs...`);
		console.log(JSON.stringify(insertMany, '', '\t'));
	})();
}

async function job_find(job_uuid) {
	const g_job_test = await Job.findOne({ uuid: job_uuid }).populate("splitJobs");
	return g_job_test;
}


function delete_old_mp4_files() {
	const child_process = require('child_process');
	let cmd = 'rm -f routes/*.mp4';
	let stdout = child_process.execSync(cmd);
	console.log(`delete_mp4:${stdout.toString()}`);
}
function find_meshub_id_from_request(req) {
	let meshubId = req.clientIp;
	return meshubId;
}

//job_dispatch(g_job_test);
//console.log(`test job:\n ${util.inspect(g_job_test)}`);

router.post('/api/transcode/job', function (req, res, next) {
	console.log(util.inspect(req.body));
	const g_job_tests = req.body.data;

	(async function () {
		await refresh_meshub_status();

		for (g_job_test of g_job_tests) {
			g_job_test.uuid = uuidv4();
			await job_dispatch(g_job_test);
			delete_old_mp4_files();
		}
		const insertMany = await Job.insertMany(g_job_tests);

		console.log(`Bulk insert jobs...`);
		console.log(JSON.stringify(insertMany, '', '\t'));

		res.status(200).json({
			jobs: g_job_tests
		});
	})();
});

router.get('/api/transcode/job', async function (req, res, next) {
	let job_uuid = req.query.uuid;
	if (job_uuid == null) {
		return res.status(400).json({ error: `job uuid not found in request body` });
	}
	else {
		(async function () {
			let job = await job_find(job_uuid);
			if (job == null) return res.status(404).end();
			else return res.status(200).json(job);
		})();
	}
});

router.get('/api/transcode/job_meshub', function (req, res, next) {

	let meshub_ip = req.clientIp;
	console.log(`GET job_meshub from ${meshub_ip}`);

	const meshub_data = {
		ip_address: meshub_ip,
		timestamp: new Date()
	};
	// g_meshubs_healthcheck[meshub_ip] = {timestamp: new Date()};
	let job_json = {};

	let meshubId = find_meshub_id_from_request(req);

	(async function () {
		await Meshub.updateOne({ ip_address: meshub_data.ip_address }, meshub_data, {
			upsert: true,
			setDefaultsOnInsert: true
		});

		const g_job_test = await Job.findOne({ "overall_progress": { "$ne": 100 } }).populate("splitJobs");
		// Get split jobs
		if (g_job_test && g_job_test.splitJobs && g_job_test.splitJobs.length > 0) {
			for (let i = 0; i < g_job_test.splitJobs.length; i++) {
				let splitJob = g_job_test.splitJobs[i];
				// 可能有兩個 sub_job 在同一個 meshub 
				if (splitJob.meshubId == meshubId && splitJob.progress == 0) {
					job_json = splitJob;
				}
			}
		}
		//console.log(`dispatched splitJob: ${util.inspect(job_json)}`);	
		return res.status(200).json(job_json);

	})();

});

/* How to handle hanging sub_jobs? */
router.post('/api/transcode/job_meshub_progress', function (req, res, next) {
	let meshub_ip = req.clientIp;

	let job_uuid = req.body.uuid;
	if (job_uuid == null) {
		return res.status(400).json({ error: `job uuid not found in request body` });
	}

	(async function () {
		let job = await job_find(job_uuid);
		if (job == null) {
			return res.status(404).json({ error: `job with uuid not found: ${job_uuid}` });
		}

		let meshubId = find_meshub_id_from_request(req);
		let splitJobs = await SplitJob.find({ uuid: job_uuid });
		let overall_progress = 0;
		for (let i = 0; i < splitJobs.length; i++) {
			let splitJob = splitJobs[i];
			if (splitJob.meshubId == meshubId) {
				splitJob.progress = req.body.progress;
			}
			overall_progress += splitJob.progress;
			await splitJob.save();
		}

		job.overall_progress = overall_progress / job.meshubNumbers;
		if (job.overall_progress == 100) {
			job.overall_progress = 99;
		}

		await job.save();

		console.log(`POST job_meshub_progress from ${meshub_ip}, query.test=${req.query.test}, progress=${req.body.progress},overall_progress=${job.overall_progress}`);
		return res.status(200).end();
	})();
});

router.post('/api/transcode/upload', function (req, res, next) {
	console.log(`UPLOAD from ${req.clientIp},name=${req.files.sampleFile.name}`);
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.sampleFile;

	// Use the mv() method to place the file somewhere on your server
	let path = `${__dirname}/${sampleFile.name}`;
	sampleFile.mv(path, function (err) {
		if (err)
			return res.status(500).send(err);

		let job_uuid = find_job_uuid_from_slice_filename(sampleFile.name);
		if (job_uuid == null) {
			return res.status(200).json({ result: `failed to parse job uuid:${sampleFile.name}` });
		}

		console.log(`upload: checking transcode job: ${job_uuid}`);

		(async function () {
			let job = await job_find(job_uuid);
			if (job == null) {
				return res.status(200).json({ result: `failed to find job with uuid:${job_uuid}` });
			}

			res.status(200).json({ result: 'upload success', path: path });

			//might trigger concat job
			let all_split_jobs_uploaded = true;
			let splitJobs = await SplitJob.find({ uuid: job_uuid });

			for (let i = 0; i < splitJobs.length; i++) {
				let job_slice = splitJobs[i];
				let transcode_segment_exist = fs.existsSync(`${__dirname}/${job_slice.uploadFileName}`);
				if (transcode_segment_exist == false) {
					all_split_jobs_uploaded = false;
				}
				console.log(`job_slice for meshub ${job_slice.meshubId} : progress=${job_slice.progress}, segment_file=${job_slice.uploadFileName},segment_file_exists=${transcode_segment_exist}, dir=${__dirname}`);
			}

			if (all_split_jobs_uploaded) {
				let result_mp4 = execute_concat();
				job.overall_progress = 100;
				job.result_mp4 = `https://torii-demo.meshub.io/${result_mp4}`;
				await job.save();
				console.log(`upload: result_mp4=${job.result_mp4}`);
			}
		})();
	});
});

module.exports = router;

function execute_concat() {
	const execFileSync = require('child_process').execFileSync;
	let cmd = `${__dirname}/test_concat.sh`;
	if (os.platform() == 'darwin') cmd = `${__dirname}/test_concat_mac.sh`;
	let output_file_name = `${Math.random().toString(36).substring(7)}.mp4`;
	const stdout = execFileSync(cmd, [output_file_name]);
	console.log(`concat finished: ${stdout}`);
	return output_file_name;
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

