const mongoose = require('mongoose')
const dayjs = require('dayjs');

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
}, {
  id: false,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.timestamp = dayjs(ret.timestamp).format('YYYY/MM/DD HH:mm:ss');
    }
  }
});

const Meshub = mongoose.model('Meshub', meshubSchema);

module.exports = Meshub;