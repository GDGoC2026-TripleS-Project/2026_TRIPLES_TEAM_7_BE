const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TRIPLES TEAM 7 API',
      version: '1.0.0',
      description: 'Match Result & Improve Checklist API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    tags: [
      { name: 'Match', description: '매치 결과 API' },
      { name: 'Checklist', description: '보완 체크리스트 API' },
    ],
  },
  apis: ['./routes/*.js'], // 라우터 주석 읽어옴
};

module.exports = swaggerJSDoc(options);
