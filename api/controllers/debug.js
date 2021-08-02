const Job = require('../models/job');
const SplitJob = require('../models/splitJob');
const Meshub = require('../models/meshub');
const Account = require('../models/account');
const { workerFields, jobFields, splitJobFields } = require('../utils/field');

exports.fixMissing = async function (req, res, next) {
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
}

exports.getSelfJobs = async function (req, res, next) {
  const account = req.user.account;

  const jobs = await Job.find({ account })
  return res.status(200).json({
    message: "Fetch your own jobs successfully",
    fields: jobFields,
    data: jobs
  })
}

exports.getAllWorkers = async function (req, res, next) {
  const meshubs = await Meshub.find({});
  console.log(meshubs)
  for (meshub of meshubs) {
    meshub.dead = (Date.now() - meshub.timestamp.getTime() > 1000 * 60 * 10);
    meshub.time = meshub.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    await meshub.save();
  }
  return res.status(200).json({
    fields: workerFields,
    data: meshubs
  });
}

exports.resetWorkerList = async function (req, res, next) {
  await Meshub.remove({});
  return res.status(200).json({
    message: "Reset worker list successfully"
  });
}

exports.resetJobData = async function (req, res, next) {
  await SplitJob.remove({});
  await Job.remove({});
  return res.status(200).json({
    message: "Remove all jobs and splitjobs successfully"
  });
}

exports.getSplitJobsByWorkerId = async function (req, res, next) {
  const { workerId } = req.params;
  const meshub = await Meshub.findOne({ _id: workerId });
  if (!meshub) {
    return res.status(404).json({
      message: "WorkerId not found."
    })
  }

  const splitJobs = await SplitJob.find({ meshubId: meshub.ip_address });

  return res.status(200).json({
    message: "Fetch splitjobs by workerId successfully",
    fields: splitJobFields,
    data: splitJobs
  })
}

exports.listRunningJobDetails = async function (req, res, next) {
  const jobs = await Job.find({ "status": { "$ne": "finished" } }).sort({ updatedAt: -1 }).limit(50).populate('splitJobs');
  res.status(200).json({
    message: "Fetch running jobs successfully",
    fields: jobFields,
    splitJobFields,
    data: jobs
  });
}

exports.getJobsByAccountId = async function (req, res, next) {
  const { accountId } = req.params;
  const accountData = await Account.findOne({ _id: accountId });
  if (!accountData) {
    return res.status(404).json({
      message: "AccountId not found"
    })
  }

  const jobs = await Job.find({ account: accountData.account })
  return res.status(200).json({
    message: "Fetch jobs by accountId successfully",
    fields: jobFields,
    data: jobs
  })
}
