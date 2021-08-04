const mongoose = require('mongoose')
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Taipei")

const accountSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  time_create: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  time_use: {
    type: Date,
    required: true,
    default: () => new Date()
  }
}, {
  id: false,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.time_create = ret.time_create ?
        dayjs(ret.time_create).format('YYYY/MM/DD HH:mm:ss') : null;
      ret.time_use = ret.time_use ?
        dayjs(ret.time_use).format('YYYY/MM/DD HH:mm:ss') : null;
    }
  }
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;