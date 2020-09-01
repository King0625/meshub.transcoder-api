const mongoose = require('mongoose')

const splitJobSchema = new mongoose.Schema({
  sourceUrl: {
    type: String,
    required: true,
    trim: true
  },
  paramCrf: {
    type: String,
    required: true,
    trim: true
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
  resolution: {
    type: String,
    required: true,
    trim: true
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
  uploadFileName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

const SplitJob = mongoose.model('SplitJob', splitJobSchema);

module.exports = SplitJob;