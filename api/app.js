var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('./db/mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var accountRouter = require('./routes/account');
const requestIp = require('request-ip');
const fileUpload = require('express-fileupload');

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
app.use('/v2', indexRouter);
app.use('/v2/api/account', accountRouter);
app.use('/v2/users', usersRouter);
app.set('json spaces', 2);

module.exports = app;
