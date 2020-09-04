var express = require('express');
var router = express.Router();

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

router.get('/', (req, res, next) => {
  Account.find({}).select('-_id -__v')
    .then(accounts => {
      res.status(200).json({ accounts });
      console.log(accounts);
    })
    .catch(err => {
      res.status(500).json({ "message": "Server error." });
      console.log(err)
    });
})

router.get('/:account', (req, res, next) => {
  Account.findOne({ account: req.params.account })
    .then(account => {
      console.log(account);
      res.status(200).json({ account });
    })
    .catch(err => {
      res.status(404).end();
    });
  // return selectedAccount == null ? res.status(404).end() : res.status(200).json({ account: selectedAccount });
})

router.post('/:account', (req, res, next) => {
  const newAccount = new Account({
    account: req.params.account,
    token: randomString()
  });

  newAccount.save()
    .then(account => {
      res.status(201).json(account);
    })
    .catch(err => {
      res.status(409).json({ message: "Account already in use!" });
    });
})

router.delete('/:account', (req, res, next) => {
  Account.findOneAndDelete({ account: req.params.account }, err => {
    if (err) return res.status(404).end();
    res.status(200).json({ "message": "Account deleted successfully." });
  });

})


module.exports = router;