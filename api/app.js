var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
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
app.use('/', indexRouter);
app.use('/users', usersRouter);


module.exports = app;
