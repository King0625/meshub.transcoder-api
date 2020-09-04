const Account = require('../models/account');

exports.accountMiddleware = (req, res, next) => {
  const token = req.header('X-MESHUB-TRANSCODER-API-TOKEN') || '';
  Account.findOne({ token })
    .then(account => {
      if (account == null) {
        return res.status(403).json({
          message: "Request forbidden"
        });
      }
      account.time_use = new Date();
      account.save();
      next();
    })
    .catch(err => {
      return res.status(500).json({ "message": "Server error." });
    })
}

exports.adminMiddleware = (req, res, next) => {
  const token = req.header('X-MESHUB-TRANSCODER-API-TOKEN') || '';
  Account.findOne({ token })
    .then(account => {
      if (account == null || account != null && account.account != 'admin') {
        return res.status(403).json({
          message: "Request forbidden"
        });
      }
      account.time_use = new Date();
      account.save();
      next();
    })
    .catch(err => {
      return res.status(500).json({ "message": "Server error." });
    })
}