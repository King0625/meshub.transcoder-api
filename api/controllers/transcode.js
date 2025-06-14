const { v4: uuidv4 } = require('uuid');
const util = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const Job = require('../models/job');
const Meshub = require('../models/meshub');
const SplitJob = require('../models/splitJob');

let socketApi;

exports.setSocketApi = (socketIoObject) => {
  socketApi = socketIoObject
}

function submitJobStatus(job) {
  const jobData = job.toJSON();
  console.log(JSON.stringify(jobData))
  const account = jobData.account;
  console.log("Emit this event to:", process.env.ADMIN_USER, ",", account)
  socketApi.to(process.env.ADMIN_USER).to(account).emit('job-progress', jobData)
}

async function refresh_meshub_status() {
  const meshubs = await Meshub.find({});
  for (meshub of meshubs) {
    meshub.dead = (Date.now() - meshub.timestamp.getTime() > 1000 * 60 * 10);
    meshub.time = meshub.timestamp.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    await meshub.save();
  }
  return meshubs;
}

async function job_dispatch(job, duration, alive_meshubs, meshubNumbers, hasPreviewData) {
  // let segmentLength = hasPreviewData ? Math.min(Math.ceil(job.previewToSec - job.previewFromSec), 60) : Math.min(Math.ceil(duration), 60);
  // job.splitJobCount = hasPreviewData ? Math.ceil((job.previewToSec - job.previewFromSec) / segmentLength) : Math.ceil(duration / segmentLength);
  //job.splitJobCount = parseInt(job.splitJobCount) == 0 ? alive_meshubs.length : parseInt(job.splitJobCount);

  job.splitJobCount = meshubNumbers;

  await Job.create(job);
  console.log(`[Socket] Insert one job...`);
  console.log(JSON.stringify(job, '', '\t'));

  let splitJobCount = job.splitJobCount > alive_meshubs.length ?
    alive_meshubs.length : job.splitJobCount;

  let segmentLength = hasPreviewData ? Math.floor((job.previewToSec - job.previewFromSec) / splitJobCount) : Math.floor(duration / splitJobCount);

  let paramSeekBeginSec = hasPreviewData ? job.previewFromSec : 0;

  let paramSeekEndSec = hasPreviewData ? paramSeekBeginSec + segmentLength : segmentLength;

  const splitJobs = [];
  for (let i = 0; i < splitJobCount; i++) {
    // To prevent if meshubNumber is greater than the number of alive meshubs
    //let assigned = i % alive_meshubs.length;

    let job_slice = {};
    Object.assign(job_slice, job);
    delete job_slice.splitJobCount;
    delete job_slice.overall_progress;
    job_slice.paramSeekBeginSec = paramSeekBeginSec;
    job_slice.paramSeekEndSec = paramSeekEndSec;
    job_slice.meshubId = alive_meshubs[i % alive_meshubs.length].ip_address;
    // job_slice.meshubId = "--";
    job_slice.progress = 0;
    let prepend = "00" + i;
    let suffix = prepend.substr(prepend.length - 2);
    job_slice.uploadFileName = `${job.uuid}-${suffix}.mp4`;
    //alive_meshubs[assigned].assigned = i;
    //alive_meshubs[assigned].save();
    splitJobs.push(job_slice);
    console.log(`pushed job_slice ${i}/${splitJobCount}: seekBegin=${paramSeekBeginSec},seekEnd=${paramSeekEndSec}`);
    paramSeekBeginSec += segmentLength;

    paramSeekEndSec = (i == splitJobCount - 2) ? (hasPreviewData ? Math.ceil(job.previewToSec) : Math.ceil(duration)) : paramSeekEndSec + segmentLength;
  }

  (async function () {
    const insertMany = await SplitJob.insertMany(splitJobs);
    console.log(`Bulk insert split jobs...`);
    console.log(JSON.stringify(insertMany, '', '\t'));
    const jobData = await Job.findOne({ uuid: job.uuid }).populate('splitJobs')
    submitJobStatus(jobData);
  })();
}

async function job_check_processing(params, account) {
  console.log(JSON.stringify(params, '', '\t'));
  const g_job_test = await Job.findOne({
    status: { "$in": ["transcoding", "pending", "merging", "uploading"] },
    account,
    sourceUrl: params.transcode_job.sourceUrl,
    job_type: params.transcode_job.job_type,
    paramBitrate: params.resolutions[0].paramBitrate,
    paramCrf: params.resolutions[0].paramCrf,
    paramPreset: params.resolutions[0].paramPreset,
    paramResolutionWidth: params.resolutions[0].paramResolutionWidth,
    paramResolutionHeight: params.resolutions[0].paramResolutionHeight
  }).populate("splitJobs", "-_id -__v");
  console.log("found\n" + JSON.stringify(g_job_test, '', '\t'));
  return g_job_test;
}

async function job_find(job_uuid) {
  const g_job_test = await Job.findOne({ uuid: job_uuid }).populate("splitJobs", "-_id -__v -in_progress -meshubId -createdAt -updatedAt");
  return g_job_test;
}

function find_meshub_id_from_request(req) {
  let meshubId = req.clientIp;
  return meshubId;
}

async function concat_segments_to_result(job, job_uuid) {
  let all_split_jobs_uploaded = true;
  let splitJobs = await SplitJob.find({ uuid: job_uuid });

  for (let i = 0; i < splitJobs.length; i++) {
    let job_slice = splitJobs[i];
    let transcode_segment_exist = fs.existsSync(path.join(__dirname, `../public/upload/${job_slice.uploadFileName}`));
    if (transcode_segment_exist == false) {
      all_split_jobs_uploaded = false;
    }
    else if (splitJobs[i].progress != 100) {
      splitJobs[i].progress = 100;
      await splitJobs[i].save();
    }
    console.log(`job_slice for meshub ${job_slice.meshubId} : progress=${job_slice.progress}, segment_file=${job_slice.uploadFileName},segment_file_exists=${transcode_segment_exist}, dir=${__dirname}`);
  }

  if (all_split_jobs_uploaded) {
    if (job.status == "uploading") {
      job.merging_at = new Date();
      job.status = "merging";
    }

    await job.save();

    submitJobStatus(job);
    console.log('[socket] Start to merge mp4...')
    var result_mp4 = execute_concat_sync(job_uuid, job.account);
    let result_segment_exist = fs.existsSync(path.join(__dirname, `../public/result/${result_mp4}`));
    if (result_segment_exist == true) {
      job.overall_progress = 100;
      job.result_mp4 = `https://${process.env.DOMAIN_NAME}/v2/result/${result_mp4}`;
      job.status = "finished";
      job.finished_at = new Date();
      job.save();
      delete_old_mp4_files(job_uuid);
      submitJobStatus(job);
      console.log('[socket] Job finished...')
      return "";
    }
    else {
      return "concat segments failed";
    }
  }
  else {
    return `segments in job '${job_uuid}' are not all uploaded`;
  }
}
function delete_old_mp4_files(uuid) {
  const child_process = require('child_process');
  const filePath = path.join(__dirname, `../public/upload/${uuid}-*.mp4`)
  let cmd = `rm -f ${filePath}`;
  console.log(cmd);
  let stdout = child_process.execSync(cmd);
  console.log(`delete_mp4:${stdout.toString()}`);
}

function execute_concat_sync(uuid, account) {
  const execFileSync = require('child_process').execFileSync;
  let cmd = `${__dirname}/test_concat.sh`;
  if (os.platform() == 'darwin') cmd = `${__dirname}/test_concat_mac.sh`;
  let output_file_name = `${account}_${Math.random().toString(36).substring(7)}.mp4`;
  execFileSync(cmd, [uuid, path.join(__dirname, `../public/upload`), `${path.join(__dirname, `../public/result`)}/${output_file_name}`]);
  return output_file_name;
}

function execute_probe_duration(url) {
  const execFileSync = require('child_process').execFileSync;
  let cmd = `${__dirname}/probe_duration.sh`;
  duration = execFileSync(cmd, [url]);
  return duration;
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

exports.submitJob = async (req, res, next) => {
  console.log(util.inspect(req.body));

  const account = req.user.account;
  const meshubs_with_new_status = await refresh_meshub_status();

  const g_job_data = req.body;
  const g_jobs = req.body.resolutions;

  const exist_job = await job_check_processing(g_job_data, account);
  if (exist_job != null) {
    return res.status(409).json({
      message: "Duplicated job"
    });
  }

  const alive_meshubs = meshubs_with_new_status.filter(meshub => !meshub.dead);

  if (alive_meshubs.length == 0) {
    console.log("Emergency: No meshubs alive!!!!");
    return res.status(200).json({
      message: "No meshubs alive now!!!!"
    });
  }

  const previewFromSec = g_job_data.transcode_job.previewFromSec;
  const previewToSec = g_job_data.transcode_job.previewToSec;

  if ((previewToSec != undefined && previewFromSec == undefined) || (previewToSec == undefined && previewFromSec != undefined)) {
    return res.status(400).json({
      error: "You missed previewToSec or previewFromSec"
    })
  }

  const hasPreviewData = previewFromSec != undefined && previewToSec != undefined;

  if (hasPreviewData && (previewFromSec < 0 || previewToSec < 0 || previewToSec - previewFromSec <= 0)) {
    return res.status(400).json({
      error: "invalid preview data"
    })
  }

  for (g_job of g_jobs) {
    g_job.account = account;
    g_job.uuid = uuidv4();
    const job_info = {};
    Object.assign(job_info, g_job_data.transcode_job, g_job, { overall_progress: 0 });
    job_info.status = 'pending';
    job_info.pending_at = new Date();
    try {
      duration = execute_probe_duration(job_info.sourceUrl);
      console.log(`probe duration: ${duration}`);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: `unable to probe duration of given url ${job_info.sourceUrl}` });
      return;
    }
    await job_dispatch(job_info, duration, alive_meshubs, g_job_data.transcode_job.meshubNumbers, hasPreviewData);
  }

  res.status(200).json({
    sourceUrl: g_job_data.transcode_job.sourceUrl,
    jobs: g_jobs
  });
}

exports.getJobsByUuids = (req, res, next) => {
  let job_uuids = req.query.uuids;
  (async function () {
    const job_jsons = [];
    for (job_uuid of job_uuids) {
      let job = await Job.findOne({ uuid: job_uuid }).populate('splitJobs');
      let job_json = {};
      if (job != null) {
        job_json = await job.toJSON();
        delete job_json._id;
        delete job_json.__v;
        delete job_json.createdAt;
        delete job_json.updatedAt;
        job_jsons.push(job_json);
      }
    }
    if (job_jsons.length === 0) return res.status(404).json({ message: "Jobs not found" });
    return res.status(200).json({ jobs: job_jsons });
  })();
}

exports.getJobByMeshub = (req, res, next) => {
  let meshub_ip = req.clientIp;
  console.log(`GET job_meshub from ${meshub_ip}`);

  const meshub_data = {
    ip_address: meshub_ip,
    timestamp: new Date()
  };

  let meshubId = find_meshub_id_from_request(req);

  (async function () {
    await Meshub.updateOne({ ip_address: meshub_data.ip_address }, meshub_data, {
      upsert: true,
      setDefaultsOnInsert: true
    });

    var first_splitJob = null;

    let job_json = {};

    if (first_splitJob == null) {
      const first_overdueJob = await SplitJob.findOne({
        "in_progress": true,
        "updatedAt": { "$lte": Date.now() - 1000 * 60 * 10 },
        "progress": { "$ne": 100 }
      }).sort("uuid uploadFileName");

      if (first_overdueJob != null) {
        first_splitJob = first_overdueJob;
      }
    }
    if (first_splitJob == null) {
      const first_pendingJob = await SplitJob.findOne({
        "in_progress": false,
        "progress": { "$ne": 100 }
      }).sort("uuid uploadFileName");

      if (first_pendingJob != null) {
        first_splitJob = first_pendingJob;
      }
    }

    if (first_splitJob != null) {
      first_splitJob.meshubId = meshubId;
      first_splitJob.in_progress = true;
      first_splitJob.dispatchedAt = new Date();
      await first_splitJob.save();
      job_json = first_splitJob.toJSON();
      delete job_json.in_progress;
      delete job_json._id;
      delete job_json.__v;
      delete job_json.createdAt;
      delete job_json.updatedAt;
      console.log(`dispatched splitJob: ${util.inspect(job_json)}`);
    }
    return res.status(200).json(job_json);
  })();
}

exports.submitJobProgressByMeshub = (req, res, next) => {
  let meshub_ip = req.clientIp;

  let job_uuid = req.body.uuid;
  let job_paramSeekBeginSec = req.body.param_seek_begin_sec;
  let job_paramSeekEndSec = req.body.param_seek_end_sec;
  if (job_uuid == null || job_paramSeekBeginSec == null || job_paramSeekEndSec == null) {
    return res.status(400).json({ error: `job uuid/param_seek_begin_sec/param_seek_end_sec not found in request body` });
  }

  (async function () {
    let job = await Job.findOne({ uuid: job_uuid }).populate('splitJobs');
    if (job == null) {
      return res.status(404).json({ error: `job with uuid not found: ${job_uuid}` });
    }

    let req_meshubId = find_meshub_id_from_request(req);
    let req_job = await SplitJob.findOne({ uuid: job_uuid, paramSeekBeginSec: job_paramSeekBeginSec, paramSeekEndSec: job_paramSeekEndSec, meshubId: req_meshubId });
    if (req_job == null) {
      return res.status(404).json({ error: `job with uuid not found: ${job_uuid}` });
    }
    req_job.in_progress = true;
    req_job.progress = req.body.progress;
    req_job.updatedAt = Date.now();
    await req_job.save();
    let splitJobs = await SplitJob.find({ uuid: job_uuid });
    for (let i = 0; i < splitJobs.length; i++) {
      let splitJob = splitJobs[i];
      if (splitJob.progress == 100) splitJob.in_progress = false;
      if (splitJob.in_progress == true && (Date.now() - splitJob.updatedAt) > 1000 * 60 * 10) {
        splitJob.meshubId = "--";
        splitJob.in_progress = false;
      }
      await splitJob.save();
    }

    const progressData = await SplitJob.aggregate([
      { $match: { uuid: job_uuid } },
      { $group: { _id: null, average: { $avg: "$progress" } } },
    ]).exec();

    job.overall_progress = progressData[0].average;
    job.updatedAt = Date.now();

    if (job.overall_progress == 100) {
      job.overall_progress = 99;
      console.log('[socket] Start to upload splited mp4...')
      if (job.status == "transcoding") {
        job.status = "uploading";
        job.uploading_at = !job.uploading_at ? new Date() : job.uploading_at;
      }
    } else {
      console.log('[socket] Transcoding...')
      if (job.status == "pending") {
        job.status = "transcoding";
        job.transcoding_at = !job.transcoding_at ? new Date() : job.transcoding_at
      }
    }

    await job.save();
    submitJobStatus(job);

    console.log(`POST job_meshub_progress from ${meshub_ip}, uuid=${req.body.uuid}, paramSeekBeginSec=${req.body.param_seek_begin_sec}, progress=${req.body.progress}, overall_progress=${job.overall_progress}`);
    return res.status(200).end();
  })();
}

exports.merge = (req, res, next) => {
  let job_uuid = req.body.uuid;
  if (job_uuid == null) {
    return res.status(400).json({ error: `job uuid not found in request body` });
  }
  (async function () {
    let job = await Job.findOne({ uuid: job_uuid }).populate('splitJobs');
    if (job == null) {
      return res.status(404).json({ error: `job with uuid not found: ${job_uuid}` });
    }

    const concat_result = await concat_segments_to_result(job, job_uuid);
    if (concat_result == "") {
      res.status(200).end();
    }
    else {
      return res.status(404).json({ error: `${concat_result}` });
    }
  })();
}

exports.upload = (req, res, next) => {
  console.log(`UPLOAD from ${req.clientIp},name=${req.files.sampleFile.name}`);
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  let filePath = path.join(__dirname, `../public/upload/${sampleFile.name}`);
  sampleFile.mv(filePath, function (err) {
    if (err)
      return res.status(500).send(err);

    let job_uuid = find_job_uuid_from_slice_filename(sampleFile.name);
    if (job_uuid == null) {
      return res.status(200).json({ result: `failed to parse job uuid:${sampleFile.name}` });
    }

    console.log(`upload: checking transcode job: ${job_uuid}`);

    (async function () {
      let job = await Job.findOne({ uuid: job_uuid }).populate('splitJobs');
      if (job == null) {
        return res.status(200).json({ result: `failed to find job with uuid:${job_uuid}` });
      }

      res.status(200).json({ result: 'upload success', path: filePath });

      //might trigger concat job
      const concat_result = await concat_segments_to_result(job, job_uuid);
      if (concat_result == "") {
        console.log(`upload: result_mp4=${job.result_mp4}`);
      }
    })();
  });
}

exports.removeMp4ByUuid = async (req, res, next) => {
  const execFileSync = require('child_process').execFileSync;
  let cmd = `${__dirname}/remove_mp4.sh`;
  const uuid = req.body.uuid;
  const requestAccount = req.user.account;
  const finishedJob = await Job.findOne({
    uuid: uuid,
    result_mp4: { $ne: undefined }
  })

  if (finishedJob) {
    const fileName = finishedJob.result_mp4;
    const account = finishedJob.account;
    if (account !== requestAccount) {
      return res.status(403).json({
        message: "Forbidden"
      })
    }

    if (finishedJob.mp4_removed) {
      return res.status(400).json({
        message: "Mp4 has been removed before"
      })
    }

    console.log(fileName);
    var reg = new RegExp(`https:\/\/${process.env.DOMAIN_NAME_REGEX}\/v2\/result\/` + account + '_([0-9A-Za-z]+)\.mp4');
    //const parsedFileName = fileName.match(/https:\/\/torii-demo\.meshub\.io\/v2\/result\/([0-9A-Za-z]+)\.mp4/)[1];
    const parsedFileName = account + '_' + fileName.match(reg)[1];
    console.log(parsedFileName);
    const stdout = execFileSync(cmd, [`${path.join(__dirname, `../public/result`)}/${parsedFileName}`]);
    console.log(`Finish deleting ${parsedFileName}.mp4: ${stdout}`);

    finishedJob.mp4_removed = true;
    await finishedJob.save();

    return res.status(200).json({
      "error": false,
      "uuid": uuid,
      "message": `Delete '${parsedFileName}.mp4' successfully.`
    });
  }

  res.status(404).json({
    "error": true,
    "message": "uuid not found"
  });
}