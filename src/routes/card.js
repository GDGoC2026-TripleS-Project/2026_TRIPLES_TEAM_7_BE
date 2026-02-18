const authenticateJWTtoken = require('../../middleware/authenticateToken.js');

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
 *                 message: token required
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
router.post('/card/create', authenticateJWTtoken, cardController.createCard);

/**
 * @swagger
 * /api/card/delete/{cardId}:
 *   delete:
 *     summary: 채용공고 카드 삭제
 *     description:
 *       카드 ID를 기반으로 해당 카드를 완전 삭제합니다.
 *       카드와 연결된 job_post 및 관련 데이터도 함께 삭제됩니다.
 *     tags: [Cards]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 카드 ID
 *         example: 15
 *     responses:
 *       200:
 *         description: 카드 삭제 성공
 *         content:
 *           application/json:
 *             example:
 *               isSuccess: true
 *               code: SUCCESS-200
 *               message: 카드가 성공적으로 삭제되었습니다.
 *               data:
 *                 cardId: 15
 *       400:
 *         description: cardId 누락
 *       401:
 *         description: 사용자 인증 실패
 *       403:
 *         description: 삭제 권한 없음 또는 카드 없음
 *       500:
 *         description: 서버 내부 오류
 */
router.delete('/card/delete/:cardId', authenticateJWTtoken, cardController.deleteCard);

/**
 * @swagger
 * /api/card/{cardId}:
 *   get:
 *     summary: 카드 상세 조회
 *     description: >
 *       특정 사용자의 AI 요약 카드 상세 정보를 조회합니다.  
 *       JWT 인증이 필요합니다.
 *     tags:
 *       - Cards
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 카드 ID
 *
 *     responses:
 *       200:
 *         description: 카드 세부 정보 조회 성공
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
 *                   example: 정상적으로 카드 세부정보를 반환했습니다.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: 카드 고유 ID
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       description: 카드 소유 사용자 ID
 *                       example: 12
 *                     jobPostId:
 *                       type: integer
 *                       description: 원본 채용공고 ID
 *                       example: 55
 *                     fileUrl:
 *                       type: string
 *                       description: 채용공고 원본 파일 또는 이미지 URL
 *                       example: https://example.com/file.pdf
 *                     deadlineAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: 채용공고 마감일
 *                       example: 2026-03-01T23:59:59.000Z
 *                     jobTitle:
 *                       type: string
 *                       description: 채용공고 제목
 *                       example: Backend Developer
 *                     companyName:
 *                       type: string
 *                       description: 회사명
 *                       example: Kakao
 *                     employmentType:
 *                       type: string
 *                       enum: [FULL_TIME, CONTRACT, INTERN]
 *                       description: >
 *                         고용 형태  
 *                         FULL_TIME: 정규직  
 *                         CONTRACT: 계약직  
 *                         INTERN: 인턴
 *                       example: FULL_TIME
 *                     roleText:
 *                       type: string
 *                       description: 직무 역할 요약 설명
 *                       example: Node.js 기반 백엔드 API 개발
 *                     necessaryStack:
 *                       type: array
 *                       description: 필수 기술 스택 목록
 *                       items:
 *                         type: string
 *                       example: ["Node.js", "MySQL"]
 *                     preferStack:
 *                       type: array
 *                       description: 우대 기술 스택 목록
 *                       items:
 *                         type: string
 *                       example: ["AWS", "Docker"]
 *                     salaryText:
 *                       type: string
 *                       nullable: true
 *                       description: 연봉 정보 (텍스트 형태)
 *                       example: 연봉 4000만원 이상
 *                     locationText:
 *                       type: string
 *                       nullable: true
 *                       description: 근무 위치 (텍스트)
 *                       example: 판교
 *                     experienceLevel:
 *                       type: string
 *                       nullable: true
 *                       description: 경력 조건
 *                       example: 3년 이상
 *                     workDay:
 *                       type: string
 *                       nullable: true
 *                       description: 근무 요일 정보
 *                       example: 주 5일
 *                     addressPoint:
 *                       type: object
 *                       nullable: true
 *                       description: 회사 위치 좌표 정보 (경도, 위도)
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: Point
 *                         coordinates:
 *                           type: array
 *                           description: [경도, 위도]
 *                           items:
 *                             type: number
 *                           example: [127.12345, 37.56789]
 *                     cardStatus:
 *                       type: string
 *                       enum: [CANVAS, INTERVIEW]
 *                       description: >
 *                         카드 상태  
 *                         CANVAS: 캔버스 카드  
 *                         INTERVIEW: 인터뷰 카드
 *                       example: CANVAS
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: 카드 생성일
 *                       example: 2026-02-17T12:00:00.000Z
 *
 *       400:
 *         description: cardId 누락
 *       401:
 *         description: 인증 실패 또는 JWT 토큰 누락
 *       404:
 *         description: 카드가 존재하지 않음
 *       500:
 *         description: 서버 내부 오류
 */
router.get('/card/:cardId', authenticateJWTtoken, cardController.getCard);

module.exports = router;