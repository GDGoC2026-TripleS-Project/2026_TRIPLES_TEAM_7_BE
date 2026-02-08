require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('[boot] USE_MOCK=', process.env.USE_MOCK);

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swaggerUi = require('swagger-ui-express');
var swagger = require('./config/swaggerConfig');
var dotenv =  require('dotenv');
const cors = require('cors');

<<<<<<< HEAD
dotenv.config();    // process.env 설정
=======
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var matchRouter = require('./routes/match');
var checklistRouter = require('./routes/checklist');
>>>>>>> 8a8432a (feat:match-checklist 중간저장)

require('./config/firebaseConfig');

const app = express();

app.set('port', process.env.PORT || 3000);

app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swagger.specs));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./src/routes/index');
var authRouter = require('./src/routes/googleAuth');

app.use('/', indexRouter);
<<<<<<< HEAD
app.use('/api/auth', authRouter);
=======
app.use('/users', usersRouter);
app.use('/api', matchRouter);
app.use('/api', checklistRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


>>>>>>> 8a8432a (feat:match-checklist 중간저장)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

<<<<<<< HEAD
// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
=======

app.use(function(err, req, res, next) {
  console.error('🔥 ERROR:', err);

  const status = err.status || 500;

  res.status(status).json({
    isSuccess: false,
    code: err.code || (status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'),
    message: err.message || 'Internal Server Error',
    path: req.originalUrl,
  });
});



module.exports = app;
>>>>>>> 8a8432a (feat:match-checklist 중간저장)
