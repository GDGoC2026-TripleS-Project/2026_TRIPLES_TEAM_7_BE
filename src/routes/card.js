/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: 카드 CRUD 및 링크스크래퍼
 */

const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

/**
 * @swagger
 * /api/ai/test-job:
 *   post:
 *     summary: 채용공고 AI 분석 (테스트용)
 *     description: 채용 공고 URL을 기반으로 AI 분석을 수행하고 구조화된 데이터를 반환합니다. (현재는 테스트 데이터 반환)
 *     tags: [Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: 분석할 채용 공고 링크
 *                 example: https://example.com/job-posting
 *     responses:
 *       200:
 *         description: 분석 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobTitle:
 *                   type: string
 *                   example: 소프트웨어 개발
 *                 companyName:
 *                   type: string
 *                   example: 리네아 정보기술(주)
 *                 employmentType:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["정규직(수습 2개월)"]
 *                 roleText:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Python 개발", "데이터 파이프라인"]
 *                 necessaryStack:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Python", "Java"]
 *                 preferStack:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["정보처리산업기사", "정보처리기사"]
 *                 experienceLevel:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["신입", "경력 2년 이하"]
 *                 salaryText:
 *                   type: string
 *                   example: 회사 내규에 따름
 *                 workDay:
 *                   type: string
 *                   example: 주 5일
 *                 locationText:
 *                   type: string
 *                   example: 서울 금천구 가산동 680. 우림라이온스밸리2차 1108호
 *                 deadlineAt:
 *                   type: string
 *                   example: 2026.02.13
 *       400:
 *         description: 잘못된 요청 (url 누락 등)
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/ai/test-job', cardController.analyzeJobPosting);


/**
 * @swagger
 * /api/card/create:
 *   post:
 *     summary: 채용공고 카드 생성
 *     description: 
 *       채용 공고 URL을 기반으로 AI 분석을 수행한 뒤,
 *       job_post, job_card, canvas_item을 생성합니다.
 *     tags: [Cards]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: 분석할 채용 공고 링크
 *                 example: https://www.jobkorea.co.kr/Recruit/GI_Read/123456
 *     responses:
 *       200:
 *         description: 카드 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: SUCCESS-200
 *                 message:
 *                   type: string
 *                   example: 카드를 성공적으로 생성했습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     cardId:
 *                       type: integer
 *                       example: 15
 *                     message:
 *                       type: string
 *                       example: 카드 생성 완료
 *       400:
 *         description: url 누락
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 isSuccess: false
 *                 code: CARD-401
 *                 message: url은 필수입니다.
 *       401:
 *         description: 사용자 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 isSuccess: false
 *                 code: AUTH-401
 *                 message: X-USER-ID required
 *       500:
 *         description: 서버 내부 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 isSuccess: false
 *                 code: CARD-402
 *                 message: 카드 생성 중 문제가 발생하였습니다.
 */
router.post('/card/create', cardController.createCard);

module.exports = router;