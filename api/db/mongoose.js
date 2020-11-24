const mongoose = require('mongoose')

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  auth:{authdb:"admin"},
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})