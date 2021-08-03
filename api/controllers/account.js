const Account = require('../models/account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { accountFields } = require('../utils/field');

exports.loginAccount = async (req, res, next) => {
  const { account, password } = req.body;

  const accountData = await Account.findOne({ account });
  if (!accountData) {
    return res.status(400).json({
      message: "Wrong account or password"
    });
  }

  try {
    const hashedPassword = accountData.password;
    const compare = bcrypt.compareSync(password, hashedPassword);
    if (!compare) {
      return res.status(400).json({
        message: "Wrong username or password"
      });
    }

    const token = jwt.sign({ account }, process.env.JWT_SECRET, {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: 7 * 24 * 60 * 60
    });

    accountData.time_use = new Date();
    await accountData.save();
    return res.status(200).json({
      message: "Login successfully",
      isAdmin: account === process.env.ADMIN_USER,
      token
    })

  } catch (error) {
    return res.status(500).json({
      message: "[Login] server side error"
    })
  }

}

exports.listAccounts = (req, res, next) => {
  Account.find({}).select('-__v -password')
    .then(accounts => {
      res.status(200).json({
        fields: accountFields,
        accounts
      });
      console.log(accounts);
    })
    .catch(err => {
      res.status(500).json({ "message": "Server error." });
      console.log(err)
    });
}

exports.createAccount = (req, res, next) => {
  const { account, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newAccount = new Account({
    account,
    password: hashedPassword
  });

  newAccount.save()
    .then(account => {
      res.status(201).json({
        message: "Account created successfully",
        account
      });
    })
    .catch(err => {
      console.log(err);
      res.status(409).json({ message: "Account already in use!" });
    });
}

exports.resetPassword = async (req, res, next) => {
  const { accountId } = req.params;
  const { password } = req.body;
  const account = await Account.findOne({ _id: accountId });
  if (!account)
    return res.status(404).json({
      message: "Account not found"
    })
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    account.password = hashedPassword;
    await account.save();
    return res.status(200).json({
      message: "Reset password successfully"
    })
  } catch (error) {
    console.log("reset account error:", error);
    return res.status(500).json({
      message: "Server side error"
    })
  }
}

exports.deleteAccount = (req, res, next) => {
  const { accountId } = req.params;
  Account.findOneAndDelete({ _id: accountId }, (err, docs) => {
    console.log(err);
    console.log(docs);
    if (err) {
      return res.status(500).json({
        message: "Server side error"
      })
    }
    if (!docs) {
      return res.status(404).json({
        message: "Account not found"
      });
    }
    res.status(200).json({ "message": "Account deleted successfully." });
  });
}
