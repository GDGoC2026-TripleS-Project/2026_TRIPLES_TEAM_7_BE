require('dotenv').config(); // .env 파일 로드

module.exports = {
  development: {
        username: 'root',
        password: process.env.SEQUELIZE_PASSWORD,
        database: 'piec_development',
        host: '127.0.0.1',
        dialect: 'mysql',
    },
    test: {
        username: 'root',
        password: process.env.SEQUELIZE_PASSWORD,
        database: 'piec_test',
        host: '127.0.0.1',
        dialect: 'mysql',
    },
    production: {
        username: 'root',
        password: process.env.SEQUELIZE_PASSWORD,
        database: 'piec_production',
        host: '127.0.0.1',
        dialect: 'mysql',
    }
}
