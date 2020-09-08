var express = require('express');
var router = express.Router();

const Job = require('../models/job');
const Meshub = require('../models/meshub');

/* GET home page. */
router.get('/', async function (req, res, next) {
  const meshubs = await Meshub.find({});
  console.log(meshubs)
  for (meshub of meshubs) {
    if (Date.now() - meshub.timestamp.getTime() > 60000) {
      meshub.dead = true;
    }
    meshub.time = meshub.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    await meshub.save();
  }
  return res.status(200).json(meshubs);
});

router.get('/reset', async function (req, res, next) {
  await Meshub.remove({});
  return res.status(200).json(await Meshub.find({}));
});

router.get('/job_details', async function (req, res, next) {
  const jobs = await Job.find({}).sort({ updatedAt: -1 }).limit(5).populate('splitJobs');
  res.status(200).json(jobs);
})

module.exports = router;
