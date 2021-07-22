const Account = require('../models/account');

function randomString() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var randomstring = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }
  return randomstring;
}

exports.listAccounts = (req, res, next) => {
  Account.find({}).select('-_id -__v')
    .then(accounts => {
      res.status(200).json({ accounts });
      console.log(accounts);
    })
    .catch(err => {
      res.status(500).json({ "message": "Server error." });
      console.log(err)
    });
}

exports.getAccount = (req, res, next) => {
  Account.findOne({ account: req.params.account }).select('-_id -__v')
    .then(account => {
      console.log(account);
      res.status(200).json({ account });
    })
    .catch(err => {
      res.status(404).end();
    });
}

exports.createAccount = (req, res, next) => {
  const newAccount = new Account({
    account: req.params.account,
    token: randomString()
  });

  newAccount.save()
    .then(account => {
      res.status(201).json({
        message: "Account created successfully",
        account
      });
    })
    .catch(err => {
      res.status(409).json({ message: "Account already in use!" });
    });
}

exports.deleteAccount = (req, res, next) => {
  Account.findOneAndDelete({ account: req.params.account }, err => {
    if (err) return res.status(404).end();
    res.status(200).json({ "message": "Account deleted successfully." });
  });
}
