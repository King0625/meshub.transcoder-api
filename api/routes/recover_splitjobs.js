var express = require('express');
var router = express.Router();

const Job = require('../models/job');
const SplitJob = require('../models/splitJob');
const Meshub = require('../models/meshub');

async function job_dispatch(job, duration, hasPreviewData) {
	let segmentLength = hasPreviewData ? Math.min(Math.ceil(job.previewToSec - job.previewFromSec),60) : Math.min(Math.ceil(duration),300);
	job.splitJobCount = hasPreviewData ? Math.ceil((job.previewToSec - job.previewFromSec) / segmentLength) : Math.ceil(duration / segmentLength);

	let splitJobCount = job.splitJobCount;

	let paramSeekBeginSec = hasPreviewData ? job.previewFromSec : 0;
	let paramSeekEndSec = hasPreviewData ? paramSeekBeginSec + segmentLength : segmentLength;

	const splitJobs = [];
	for (let i = 0; i < splitJobCount; i++) {
		let job_slice = {};
		job_slice.sourceUrl = job.sourceUrl;
		job_slice.job_type = job.job_type;
		job_slice.imageSourceUrl = job.imageSourceUrl;
		job_slice.meshubNumbers = job.meshubNumbers;
		job_slice.paramBitrate = job.paramBitrate;
		job_slice.paramCrf = job.paramCrf;
		job_slice.paramPreset = job.paramPreset;
		job_slice.paramResolutionWidth = job.paramResolutionWidth;
		job_slice.paramResolutionHeight = job.paramResolutionHeight;
		job_slice.account = job.account;
		job_slice.uuid = job.uuid;
		job_slice.createdAt = job.createdAt;
		job_slice.paramSeekBeginSec = paramSeekBeginSec;
		job_slice.paramSeekEndSec = paramSeekEndSec;
		job_slice.meshubId = "--";
		job_slice.progress = 100;
		job_slice.in_progress = false;
		let prepend = "00" + i;
		let suffix = prepend.substr(prepend.length-2);
		job_slice.uploadFileName = `${job.uuid}-${suffix}.mp4`;
		splitJobs.push(job_slice);
		console.log(`[recover] pushed job_slice ${i}/${splitJobCount}: seekBegin=${paramSeekBeginSec},seekEnd=${paramSeekEndSec}`);
		paramSeekBeginSec += segmentLength;

		paramSeekEndSec = (i == splitJobCount - 2) ? (hasPreviewData ? Math.ceil(job.previewToSec) : Math.ceil(duration)) : paramSeekEndSec + segmentLength;
	}

	(async function () {
		const insertMany = await SplitJob.insertMany(splitJobs);
		console.log(`[recover] Bulk insert split jobs...`);
		console.log(JSON.stringify(insertMany, '', '\t'));
	})();
}

function execute_probe_duration(url) {
	const execFileSync = require('child_process').execFileSync;
	let cmd = `${__dirname}/probe_duration.sh`;
	duration = execFileSync(cmd, [url]);
	return duration;
}

/* GET home page. */
router.get('/', async function (req, res, next) {
	const finishedJobs = await Job.find({status:'finished'}).sort("createdAt");;
	console.log(`[recover] finishedJobs.length: ${finishedJobs.length}`);
	for (let i = 0; i < finishedJobs.length; i++) {
		let finishedJob = finishedJobs[i];
		console.log(`[recover] finishedJob.uuid: ${finishedJob.uuid}`);
		let splitJobs = await SplitJob.find({uuid:finishedJob.uuid});
		console.log(`[recover] splitJobs.length: ${splitJobs.length}`);
		if (splitJobs.length == 0) {
			let transcodedUrl = finishedJob.sourceUrl;
			if (transcodedUrl.indexOf('_PV.mp4')!=-1) {
				transcodedUrl = transcodedUrl.replace('ottas:ottaspwd@','').replace('/private/44/','/files/44/demo/').replace('_PV.mp4','_PV_360p_256k.mp4');
			}
			else {
				transcodedUrl = transcodedUrl.replace('ottas:ottaspwd@','').replace('/private/','/files/').replace('.mp4','_360p_256k.mp4');
			}
			console.log(`[recover] transcodedUrl: ${transcodedUrl}`);
			try {
				duration = execute_probe_duration(transcodedUrl);
				console.log(`[recover] probe duration: ${duration}`);
				let hasPreviewData = finishedJob.previewFromSec != undefined && finishedJob.previewToSec != undefined;
				await job_dispatch(finishedJob, duration, hasPreviewData);
			} catch (error) {
				console.error(error);
			}
		}
	}
	console.log("[recover] finished");
	return res.status(200).end();
});

module.exports = router;

