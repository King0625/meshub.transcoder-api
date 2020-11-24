const mongoose = require('mongoose')

mongoose.connect("mongodb://mesh-admin:mesh1234@allinone.meshub.tv:50128/webrtc-admin", {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})

mongoose.connection
 .once('open', () => console.log('Good to go!'))
 .on('error', (error) => {
 console.warn('Warning', error);
 });