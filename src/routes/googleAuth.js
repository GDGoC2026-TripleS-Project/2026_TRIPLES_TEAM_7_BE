const express = require('express');
const { login, logout } = require('../controllers/googleAuthController');
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
 *       - bearerAuth: []
 *     requestHeaders:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
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
 *                 idToken:
 *                   type: string
 *                   description: firebase ID 토큰
 *                 user:          # 전송하고 싶은 유저 객체 추가
 *                    type: object
 *                    properties:
 *                      email:
 *                        type: string
 *                        description: "구글 이메일"
 *                      name:
 *                        type: string
 *                        description: "구글 계정 사용자 이름"
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
 *       - bearerAuth: []
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


module.exports = router;
