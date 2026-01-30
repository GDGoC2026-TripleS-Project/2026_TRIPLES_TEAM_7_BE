const swaggerUi = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: 'Piec 프로젝트 API 문서',
      version: "1.0.0",
      description: "Piec 프로젝트 API 명세서",
    },
    servers: [
      {
        url: "http://localhost:3000", // 요청 URL
        description: '개발 서버',
      },
    ],
  },
  apis: [
    "../src/routes/*.js",
    "../src/controllers/*.js"
  ],
}
const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs }