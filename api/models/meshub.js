const mongoose = require('mongoose')

const meshubSchema = new mongoose.Schema({
  ip_address: {
    type: String,
    required: true,
    trim: true
  },
  assigned: {
    type: Number,
    required: true,
    default: -1
  },
  dead: {
    type: Boolean,
    required: true,
    default: false
  },
  timestamp: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  }
});

const Meshub = mongoose.model('Meshub', meshubSchema);

module.exports = Meshub;