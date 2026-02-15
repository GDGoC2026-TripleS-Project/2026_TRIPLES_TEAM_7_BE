const express = require('express');
const upload = require('../../config/multerConfig'); // 한 단계 위로 가서 config 접근
const { updateAddress, updateResume } = require('../controllers/myPageController');
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
 *        - Authorization: []
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
 *    patch:
 *      summary: 유저 이력서(PDF) 업로드 및 수정
 *      tags: [User]
 *      security:
 *        - Authorization: []
 *      requestBody:
 *          required: true
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                 resume:
 *                   type: string
 *                   format: binary
 *                   description: 업로드할 PDF 이력서 파일
 *      responses:
 *        200:
 *          description: 이력서 업로드 및 DB 업데이트 성공
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
 *                    example: "이력서가 S3에 저장되고 RDS 업데이트가 완료되었습니다."
 *                  resumeUrl:
 *                    type: string
 *                    example: "https://your-bucket.s3.region.amazonaws.com/resumes/unique-file-name.pdf"
 *        400:
 *          description: 파일이 전송되지 않았거나 잘못된 형식
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "이력서 파일이 전송되지 않았거나 잘못된 형식입니다."
 *        401:
 *          description: 인증 토큰 누락 또는 유효하지 않음
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "인증 토큰이 누락되었거나 유효하지 않습니다."
 *        500:
 *          description: S3 업로드 중 서버 오류 발생
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  message:
 *                    type: string
 *                    example: "S3 업로드 중 서버 오류가 발생했습니다."
 */
router.patch('/user/resume', updateResume);


module.exports = router;