const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
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
    required: true,
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