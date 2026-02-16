const express = require('express');
const { login, logout, refreshToken } = require('../controllers/googleAuthController');
const verifyToken = require('../../middleware/googleAuthMiddleware.js');
const swaggerJsDoc = require('swagger-jsdoc');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 구글 인증 관리 API
 */

/**
 * @swagger
 * /api/auth/googleLogin:
 *   post:
 *     summary: 구글 로그인
 *     tags: [Auth]
 *     security:
 *       - Authorization: []
 *     requestHeaders:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: firebase ID 토큰
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "로그인 성공"
 *                 refreshToken:
 *                   type: string
 *                   description: 유효한 JWT 리프레시 토큰
 *                   example: "eyJhbGciOiJIUzI1..."
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID 토큰이 필요합니다."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 토큰입니다."
 */
router.post('/auth/googleLogin', verifyToken, login);

/**
 * @swagger
 * /api/auth/googleLogout:
 *   post:
 *     summary: 구글 로그아웃
 *     tags: [Auth]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "로그아웃되었습니다."
 *       401:
 *         description: 인증되지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "인증 토큰이 필요합니다."
 */
router.post('/auth/googleLogout', verifyToken, logout);


/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *      summary: 액세스 토큰 및 리프레시 토큰 갱신
 *      description: |
 *          만료된 Access Token을 갱신하기 위해 유효한 Refresh Token을 전송합니다.
 *          성공 시 새로운 Access Token은 Response Header에, 
 *          새로운 Refresh Token은 Response Body에 담겨 반환됩니다. (Refresh Token Rotation)
 *      tags: [Auth]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      required:
 *                        - refreshToken
 *                      properties:
 *                        refreshToken:
 *                          type: string
 *                          description: 유효한 JWT 리프레시 토큰
 *                          example: "eyJhbGciOiJIUzI1..."
 *      responses:
 *        200:
 *          description: 토큰 갱신 성공
 *          headers:
 *              Authorization:
 *                  description: "새로 발급된 Access Token (Bearer 스키마)"
 *          schema:
 *              type: string
 *              example: "Bearer eyJhbGciOiJIUzI1..."
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                        success:
 *                          type: boolean
 *                          example: true
 *                        message:
 *                          type: string
 *                          example: "Token refreshed successfully"
 *                        refreshToken:
 *                          type: string
 *                          description: "새로 발급된 Refresh Token"
 *                          example: "eyJhbGciOiJIUzI1..."
 *        401:
 *          description: Refresh Token이 누락됨
 *        403:
 *          description: Refresh Token이 만료되었거나 유효하지 않음
 *        500:
 *          description: 서버 내부 오류
 */
router.post('/auth/verifyToken', refreshToken);


module.exports = router;
