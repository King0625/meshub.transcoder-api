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

  const pageOptions = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    populate: 'splitJobs'
  }

  const jobs = await Job.paginate({ account }, pageOptions)
  return res.status(200).json({
    message: "Fetch your own jobs successfully",
    fields: jobFields,
    splitJobFields,
    data: jobs
  })
}

exports.cancelSelfJobs = async function (req, res, next) {
  const account = req.user.account;
  const jobIds = req.body.jobIds;
  const jobsToBeDeleted = await Job.find({
    account,
    status: "pending",
    _id: { $in: jobIds }
  })

  const deletedJobIds = jobsToBeDeleted.map(job => job._id);
  const deletedJobUuids = jobsToBeDeleted.map(job => job.uuid);
  console.log("deletedJobIds", deletedJobIds);

  const jobDeletedResult = await Job.deleteMany({
    account,
    _id: { $in: deletedJobIds }
  })
  console.log("jobDeletedResult:", jobDeletedResult);

  const splitJobDeletedResult = await SplitJob.deleteMany({
    account,
    uuid: { $in: deletedJobUuids }
  })
  console.log("splitJobDeletedResult:", splitJobDeletedResult);

  return res.status(200).json({
    message: "Delete pending jobs successfully",
    desiredDeletedCounts: jobIds.length,
    actualDeletedCounts: deletedJobIds.length,
    deletedJobIds
  })
}

exports.getPersonalJobSpentTime = async function (req, res, next) {
  let { from, to, interval } = req.query;

  from = Math.floor(from / interval) * interval;

  const account = req.user.account;

  const options = [
    {
      $match: {
        account,
        status: 'finished',
        createdAt: {
          '$gte': new Date(from),
          '$lt': new Date(to)
        }
      }
    },
    {
      $group: {
        '_id': {
          "$subtract": [
            { "$subtract": ["$createdAt", new Date("1970-01-01")] },
            {
              "$mod": [
                { "$subtract": ["$createdAt", new Date("1970-01-01")] },
                interval
              ]
            }
          ]
        },
        'jobSpentTime': {
          $push: { $divide: [{ $subtract: ["$finished_at", "$pending_at"] }, 1000] }
        },
      }
    },
    {
      "$project": {
        "tempId": "$_id",
        "values": { "$sum": "$jobSpentTime" },
      }
    },
    {
      "$group": {
        "_id": "$tempId",
        "totalSpentTime": { "$sum": "$values" }
      }
    },
    {
      "$addFields": {
        "timestamps": { "$toDate": "$_id" }
      }
    }
  ]

  const jobs = await Job.aggregate(options);

  const jobSpentTimeData = [];
  for (let date = from; date < to; date += interval) {
    const job = jobs.find(job => job._id === date);
    if (job) {
      jobSpentTimeData.push(job)
    }
    jobSpentTimeData.push({
      "_id": date,
      "totalSpentTime": 0,
      "timestamp": new Date(date)
    })
  }
  return res.status(200).json({
    message: "Fetch personal job spent time successfully",
    data: jobSpentTimeData
  })
}

exports.getAllWorkers = async function (req, res, next) {
  const pageOptions = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  }

  const meshubs = await Meshub.paginate({}, pageOptions);

  for (meshub of meshubs.docs) {
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

  const pageOptions = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10
  }
  const splitJobs = await SplitJob.paginate({ meshubId: meshub.ip_address }, pageOptions);

  return res.status(200).json({
    message: "Fetch splitjobs by workerId successfully",
    fields: splitJobFields,
    data: splitJobs
  })
}

exports.listRunningJobDetails = async function (req, res, next) {
  const pageOptions = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sort: { updatedAt: -1 },
    populate: 'splitJobs'
  }

  const jobs = await Job.paginate({ status: { "$ne": "finished" } }, pageOptions);
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

  const pageOptions = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    populate: 'splitJobs'
  }

  const jobs = await Job.paginate({ account: accountData.account }, pageOptions)
  return res.status(200).json({
    message: "Fetch jobs by accountId successfully",
    fields: jobFields,
    splitJobFields,
    data: jobs
  })
}

exports.getJobSpentTimeByAccountId = async function (req, res, next) {
  const { accountId } = req.params;
  const accountData = await Account.findOne({ _id: accountId });
  if (!accountData) {
    return res.status(404).json({
      message: "AccountId not found"
    })
  }

  let { from, to, interval } = req.query;

  from = Math.floor(from / interval) * interval;

  const options = [
    {
      $match: {
        account: accountData.account,
        status: 'finished',
        createdAt: {
          '$gte': new Date(from),
          '$lt': new Date(to)
        }
      }
    },
    {
      $group: {
        '_id': {
          "$subtract": [
            { "$subtract": ["$createdAt", new Date("1970-01-01")] },
            {
              "$mod": [
                { "$subtract": ["$createdAt", new Date("1970-01-01")] },
                interval
              ]
            }
          ]
        },
        'jobSpentTime': {
          $push: { $divide: [{ $subtract: ["$finished_at", "$pending_at"] }, 1000] }
        },
      }
    },
    {
      "$project": {
        "tempId": "$_id",
        "values": { "$sum": "$jobSpentTime" },
      }
    },
    {
      "$group": {
        "_id": "$tempId",
        "totalSpentTime": { "$sum": "$values" }
      }
    },
    {
      "$addFields": {
        "timestamps": { "$toDate": "$_id" }
      }
    }
  ]

  const jobs = await Job.aggregate(options);

  const jobSpentTimeData = [];
  for (let date = from; date < to; date += interval) {
    const job = jobs.find(job => job._id === date);
    if (job) {
      jobSpentTimeData.push(job)
    }
    jobSpentTimeData.push({
      "_id": date,
      "totalSpentTime": 0,
      "timestamp": new Date(date)
    })
  }
  return res.status(200).json({
    message: "Fetch job spent time from a specific account successfully",
    data: jobSpentTimeData
  })
}
