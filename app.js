var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
require('dotenv').config();


//var indexRouter = require('./routes/index');
//var usersRouter = require('./routes/users');
const botRouter = require('./routes/bot');
var qnaRouter = require('./routes/qnalanguage.router');
const swaggerDocument = YAML.load('./swagger-doc.yml');
swaggerDocument.servers = [{
  url: `${process.env.API_SERVER_URL_LOCAL}`
}];

var app = express();
 
// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));


//////////////////////////added for angular
app.use(express.static(__dirname + '/dist/test-angular/browser/'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/dist/test-angular/browser/index.html');
  // console.log(__dirname + '/dist/test-angular/browser/index.html')
});
//////////////////////added for angular



//app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use("/api/v1/qna",qnaRouter)
app.use("/api/v1/bot",botRouter)

// Use Swagger with your Express App
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.status(404).json({message: "Not Found"});
});

module.exports = app;
