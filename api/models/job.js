const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
    trim: true,
  },
  uuid: {
    type: String,
    required: true,
    trim: true,
  },
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
  meshubNumbers: {
    type: Number,
    required: true
  },
  previewFromSec: {
    type: Number,
  },
  previewToSec: {
    type: Number,
  },
  overall_progress: {
    type: Number,
    required: true
  },
  job_type: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    trim: true,
    default: "pending"
  },
  result_mp4: {
    type: String,
    trim: true
  },
  mp4_removed: {
    type: Boolean,
    default: false
  },
  pending_at: {
    type: Date,
    default: null
  },
  transcoding_at: {
    type: Date,
    default: null
  },
  uploading_at: {
    type: Date,
    default: null
  },
  merging_at: {
    type: Date,
    default: null
  },
  finished_at: {
    type: Date,
    default: null
  }
}, {
  id: false,
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

jobSchema.virtual('splitJobs', {
  ref: 'SplitJob',
  localField: 'uuid',
  foreignField: 'uuid',
})

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
