const mongoose = require('mongoose')
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Taipei")

const splitJobSchema = new mongoose.Schema({
  sourceUrl: {
    type: String,
    required: true,
    trim: true
  },
  imageSourceUrl: {
    type: String,
    trim: true
  },
  paramBitrate: {
    type: Number,
    required: true,
  },
  paramCrf: {
    type: Number,
    required: true,
  },
  paramPreset: {
    type: String,
    required: true,
    trim: true
  },
  paramResolutionWidth: {
    type: Number,
    required: true
  },
  paramResolutionHeight: {
    type: Number,
    required: true
  },
  account: {
    type: String,
    required: true,
    trim: true,
  },
  uuid: {
    type: String,
    required: true,
    trim: true
  },
  meshubId: {
    type: String,
    required: true,
    trim: true
  },
  paramSeekBeginSec: {
    type: Number,
    required: true,
  },
  paramSeekEndSec: {
    type: Number,
    required: true,
  },
  progress: {
    type: Number,
    required: true
  },
  job_type: {
    type: String,
    trim: true,
  },
  in_progress: {
    type: Boolean,
    required: true,
    default: false
  },
  uploadFileName: {
    type: String,
    required: true,
    trim: true
  },
  dispatchedAt: {
    type: Date,
  }
}, {
  id: false,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.in_progress = ret.in_progress.toString();
      ret.dispatchedAt = ret.dispatchedAt ?
        dayjs(ret.dispatchedAt).format('YYYY/MM/DD HH:mm:ss') : null;
      ret.createdAt = ret.createdAt ?
        dayjs(ret.createdAt).format('YYYY/MM/DD HH:mm:ss') : null;
      ret.updatedAt = ret.updatedAt ?
        dayjs(ret.updatedAt).format('YYYY/MM/DD HH:mm:ss') : null;
    }
  }
});

const SplitJob = mongoose.model('SplitJob', splitJobSchema);

module.exports = SplitJob;
