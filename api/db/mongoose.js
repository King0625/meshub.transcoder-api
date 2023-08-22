const mongoose = require('mongoose');
const Account = require('../models/account');
const bcrypt = require('bcrypt');

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(async () => {
  const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  const query = {
    account: process.env.ADMIN_USER,
    password: hashedPassword
  };
  
  await Account.updateOne(
    { account: query.account },
    query,
    { upsert: true }
  );
  
  console.log("Admin user created!");
})

mongoose.connection
  .once('open', () => console.log('Good to go!'))
  .on('error', (error) => {
    console.warn('Warning', error);
  });