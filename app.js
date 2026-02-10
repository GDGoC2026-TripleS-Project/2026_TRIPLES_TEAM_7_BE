var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swaggerUi = require('swagger-ui-express');
var swagger = require('./config/swaggerConfig');
const { sequelize } = require('./src/models');
var dotenv =  require('dotenv');

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log('[boot] USE_MOCK=', process.env.USE_MOCK);

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');

const indexRouter = require('./src/routes/index');
const matchRouter = require('./src/routes/match');
const checklistRouter = require('./src/routes/checklist');

// firebase가 개발 환경에서 없을 수도 있으니, 에러로 서버 죽지 않게
try {
  require('./config/firebaseConfig');
} catch (e) {
  console.warn('[firebase] init skipped:', e.message);
}

const app = express();
app.set('port', process.env.PORT || 8080);

sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

console.log('[swagger] typeof specs:', typeof specs);
console.log('[swagger] openapi:', specs && specs.openapi, 'keys:', specs && Object.keys(specs));

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // ejs 설치 필요


// routes
app.use('/', indexRouter);
app.use('/api', matchRouter);
app.use('/api', checklistRouter); 

// swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 404
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
