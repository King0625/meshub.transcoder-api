var http = require('http');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var debug = require('debug')('api:server');
var jwt = require('jsonwebtoken');

require('./db/mongoose');
var transcodeRouter = require('./routes/transcode');
var debugRouter = require('./routes/debug');
var recoverRouter = require('./routes/recover_splitjobs');
var accountRouter = require('./routes/account');
var { setSocketApi } = require("./controllers/transcode");
const requestIp = require('request-ip');
const fileUpload = require('express-fileupload');

var port = process.env.PORT || 21543;

var cors = require('cors')

var app = express();
app.use(cors());
app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());
app.use('/v2/result', express.static(path.join(__dirname, 'public/result')))
app.use('/v2/api/transcode', transcodeRouter);
app.use('/v2/api/recover', recoverRouter);
app.use('/v2/api/hello', debugRouter);
app.use('/v2/api/account', accountRouter);


const server = http.createServer(app);
const io = require('socket.io')(server);
io.on('connection', socket => {
  const { jwtToken } = socket.handshake.query;

  // jwt.verify(jwtToken, process.env.JWT_SECRET, async function (err, payload) {
  jwt.verify(jwtToken, "IXHtVpHqVGtgC+3ilF+rMpChQRl2CLTUAvN58+4+cHupgTm4WIGkFmQZkVEM7y2X988=", async function (err, payload) {
    if (err) {
      socket.emit('unauthorized', err);
      socket.disconnect(true);
      return;
    }
    console.log(`[${new Date()}]{${socket.id}} connected`);
    socket.on('disconnect', () => {
      console.log(`[${new Date()}]{${socket.id}} DISCONNECTED...`);
    })
  })
})

setSocketApi(io);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log(`listen on port ${addr.port}`);
}

module.exports = app;
