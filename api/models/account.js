const mongoose = require('mongoose')

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
    default: new Date()
  },
  time_use: {
    type: Date,
    required: true,
    default: new Date()
  }
});

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;