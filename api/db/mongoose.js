const mongoose = require('mongoose')

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  auth: {"authSource":"admin" },
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PWD,
  useMongoClient: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})