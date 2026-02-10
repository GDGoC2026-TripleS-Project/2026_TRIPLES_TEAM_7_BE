const Sequelize = require('sequelize');
const env = 'development';
const config = require( '../../config/config.js')[env];
const fs = require('fs');
const path = require('path');

const config = require(path.join(__dirname, '../../config/config.json'))[env];

const db = {};
const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);
db.sequelize = sequelize;

const basename = path.basename(__filename);   // index.js

// 하위 폴더까지 .js 파일 전부 찾기
function listJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...listJsFiles(full));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      const base = path.basename(e.name);
      // index.js 제외
      if (ext === '.js' && base !== basename && base !== 'index.js') {
        files.push(full);
      }
    }
  }
  return files;
}

const modelFiles = listJsFiles(__dirname);

// 모델 init
for (const filePath of modelFiles) {
  const Model = require(filePath);
  if (!Model || typeof Model.init !== 'function') continue;

  console.log('load model:', filePath, '->', Model.name);
  db[Model.name] = Model;
  Model.init(sequelize);
}

// associate는 init 이후에 호출해야 함
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);   // associate 호출
  }});

module.exports = db;


