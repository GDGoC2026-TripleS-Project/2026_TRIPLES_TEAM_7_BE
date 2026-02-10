const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TRIPLES TEAM 7 API',
      version: '1.0.0',
      description: 'Match Result & Improve Checklist API',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: [path.join(__dirname, './src/routes/*.js')],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
