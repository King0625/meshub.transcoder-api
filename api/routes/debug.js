var express = require('express');
var router = express.Router();

const Job = require('../models/job');
const SplitJob = require('../models/splitJob');
const Meshub = require('../models/meshub');

/* GET home page. */
router.get('/', async function (req, res, next) {
  const meshubs = await Meshub.find({});
  console.log(meshubs)
  for (meshub of meshubs) {
    meshub.dead = (Date.now() - meshub.timestamp.getTime() > 60000);
    meshub.time = meshub.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    await meshub.save();
  }
  return res.status(200).json(meshubs);
});

router.get('/reset', async function (req, res, next) {
  await Meshub.remove({});
  return res.status(200).json(await Meshub.find({}));
});

router.get('/resetJob', async function (req, res, next) {
  await SplitJob.remove({});
  await Job.remove({});
  return res.status(200).json(await Job.find({}));
});

router.get('/fixMissing', async function (req, res, next) {
  const job = await Job.findOne({ "uuid": "92f1b334-0683-4f4a-b083-87dbfad51a76" })
  job.overall_progress = 0;
  job.status = 'pending';
  delete job.result_mp4;
  await job.save();

  let splitJobs = await SplitJob.find({ "uuid": "92f1b334-0683-4f4a-b083-87dbfad51a76" });
  for (let i = 0; i < splitJobs.length; i++) {
    let splitJob = splitJobs[i];
    splitJob.progress = 0;
    splitJob.in_progress = false;
    await splitJob.save();
  }

  return res.status(200).json(await Job.find({}));
});

router.get('/job_details', async function (req, res, next) {
  const jobs = await Job.find({}).sort({ updatedAt: -1 }).limit(5).populate('splitJobs');
  res.status(200).json(jobs);
})

module.exports = router;
