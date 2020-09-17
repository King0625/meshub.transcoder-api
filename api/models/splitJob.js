const mongoose = require('mongoose')

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
  paramProfile: {
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
}, { timestamps: true });

const SplitJob = mongoose.model('SplitJob', splitJobSchema);

module.exports = SplitJob;