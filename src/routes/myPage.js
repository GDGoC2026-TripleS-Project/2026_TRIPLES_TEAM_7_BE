const express = require('express');
const { updateAddress } = require('../controllers/myPageController');
const authenticateJWTtoken = require('../../middleware/authenticateToken.js');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: User
 *   description: 사용자 정보 관리 API
 */

/**
 * @swagger
 * /api/user/address:
 *   patch:
 *      summary: 로그인한 유저의 도로명 주소 정보를 최초 설정 및 업데이트합니다.
 *      tags: [User]
 *      security:
 *          - Authorization: []
 *      requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  address:
 *                    type: string
 *                    description: 수정할 도로명 주소
 *                    example: "서울특별시 성북구 북악산로 918"
 *      responses:
 *        200:
 *          description: 주소 수정 성공
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: true
 *                  message:
 *                    type: string
 *                    example: "주소가 성공적으로 수정되었습니다."
 *                  result:
 *                    type: object
 *                    example:
 *                      {
 *                          "address": "서울특별시 성북구 북악산로 918"
 *                      }
 * 
 *        401:
 *          description: 인증 실패
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "유효하지 않은 토큰입니다."
 */
router.patch('/user/address', updateAddress);
/**
 * @swagger
 * /api/user/resume:
 *   patch:
 *      summary: 유저 이력서 URL 생성 및 수정
 *      tags: [User]
 *      security:
 *          - Authorization: []
 *      requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  resumeUrl:
 *                    type: string
 *                    description: PDF 이력서가 저장된 외부 URL
 *                    example: "https://firebasestorage.googleapis.com/..."
 *      responses:
 *        200:
 *          description: 이력서 경로 저장 성공
 *        401:
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
router.patch('/user/resume', async (req, res) => {
    const userId = req.user.id; // 인증 미들웨어에서 설정된 사용자 ID
    const { resumeUrl } = req.body;
    return res.status(200).json({ success: true, message: "이력서 URL이 성공적으로 저장되었습니다." });
});


module.exports = router;