const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const fs = require('fs');
const path = require('path');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);
db.sequelize = sequelize;

const basename = path.basename(__filename);   // index.js
fs.readdirSync(__dirname)
  .filter((file) => {   // index.js 제외
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file));
    console.log(file, model.name);
    db[model.name] = model;
    model.initiate(sequelize);   // initiate 호출
  });
// associate는 initiate 이후에 호출해야 함
Object.keys(db).forEach((modelName) => {

  if (db[modelName].associate) {
    db[modelName].associate(db);   // associate 호출
  }
});
module.exports = db;
