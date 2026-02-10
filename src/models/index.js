const Sequelize = require('sequelize');
const env = 'development';
const config = require( '../../config/config.js')[env];
const fs = require('fs');
const path = require('path');

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);
db.sequelize = sequelize;

const basename = path.basename(__filename);   // index.js
function loadModelsFromDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // 하위 디렉토리면 재귀 호출
      loadModelsFromDir(fullPath);
    } else if (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    ) { 
      const modelClass = require(fullPath);
      console.log(file, modelClass.name);
      const model = modelClass.init(sequelize);
      db[modelClass.name] = model;
    }
  });
}

loadModelsFromDir(__dirname);
// associate는 initiate 이후에 호출해야 함
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);   // associate 호출
  }});

module.exports = db;
