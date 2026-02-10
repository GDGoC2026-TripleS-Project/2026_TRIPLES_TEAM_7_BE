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
    components: {
        securitySchemes: {
            Authorization: {
                type: "http",
                in: "header",
                name: "Authorization",
                scheme: "bearer",
            },
        },
    },
    security: [
        {
            Authorization: [], // 전역적으로 토큰이 필요한 경우
        },
    ],
    servers: [
      {
        url: "http://52.78.20.212", // 요청 URL
        description: '개발 서버',
      },
    ],
  },
  apis: [
    path.join(__dirname, "./src/routes/*.js"),
    path.join(__dirname, "./src/controllers/*.js")
  ],
}
const specs = swaggerJsdoc(options);
// console.log(JSON.stringify(specs.paths, null, 2));

module.exports = { swaggerUi, specs }