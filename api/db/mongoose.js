const mongoose = require('mongoose')

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  auth: {"authSource":"admin" },
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})