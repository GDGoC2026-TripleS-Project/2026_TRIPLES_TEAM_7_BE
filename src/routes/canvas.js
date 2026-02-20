/**
 * @swagger
 * tags:
 *   name: Canvas
 *   description: 캔버스 관리 API
 */

const authenticateJWTtoken = require('../../middleware/authenticateToken.js');
const { getCanvasItems, setCanvasItems, getSortedCanvasItems } = require('../controllers/canvasController');
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/canvas:
 *   get:
 *     summary: 홈 화면(캔버스) 카드 조회
 *     tags: [Canvas]
 *     security:
 *       - Authorization: []
 *     description: 홈 화면(캔버스)에 표시될 모든 카드의 내용과 위치 정보를 반환합니다. 카드 내용은 job_cards 모델에서, 위치 정보는 canvas_items 모델에서 가져옵니다.
 *     responses:
 *       200:
 *         description: 카드 내용 및 위치 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   cardId:
 *                     type: integer
 *                   cardContent:
 *                     type: object
 *                     properties:
 *                       jobPostId:
 *                         type: integer
 *                       deadlineAt:
 *                         type: string
 *                         format: date-time
 *                       jobTitle:
 *                         type: string
 *                       companyName:
 *                         type: string
 *                       employmentType:
 *                         type: string
 *                         enum: [FULL_TIME, CONTRACT, INTERN]
 *                       roleText:
 *                         type: string
 *                       necessaryStack:
 *                         type: array
 *                         items:
 *                           type: string
 *                       matchPercent:
 *                         type: integer
 *                   x:
 *                     type: number
 *                   y:
 *                     type: number
 *             example:
 *               - cardId: "1"
 *                 cardContent:
 *                   jobPostId: 1
 *                   deadlineAt: "2026-03-01T23:59:59"
 *                   jobTitle: "Backend Developer"
 *                   companyName: "네이버랩스"
 *                   employmentType: FULL_TIME
 *                   roleText: "대규모 트래픽 API 설계 및 운영\nSpring기반 서버 개발 및 유지보수"
 *                   necessaryStack: ["Java", "Spring", "RDS경험"]
 *                   matchPercent: 85
 *                 x: 85.5
 *                 y: 20
 *               - cardId: "2"
 *                 cardContent:
 *                   jobPostId: 2
 *                   deadlineAt: "2026-04-15T23:59:59"
 *                   jobTitle: "Backend Developer"
 *                   companyName: "카카오엔터프라이즈"
 *                   employmentType: CONTRACT
 *                   roleText: "Node.js 기반 백엔드 API 개발"
 *                   necessaryStack: ["Node.js", "MySQL"]
 *                   matchPercent: 85
 *                 x: 150
 *                 y: 45
 *       401:
 *         description: 인증되지 않은 사용자
 *       404:
 *         description: 카드 정보를 찾을 수 없음
 */
router.get('/canvas', authenticateJWTtoken, getCanvasItems);


/**
 * @swagger
 * /api/canvas:
 *   post:
 *     summary: 캔버스 아이템 위치 업데이트
 *     description: 특정 카드의 캔버스 내 x, y 좌표를 업데이트합니다.
 *     tags: [Canvas]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardId
 *               - x
 *               - y
 *             properties:
 *               cardId:
 *                 type: integer
 *                 description: 업데이트할 카드의 ID
 *                 example: 1
 *               x:
 *                 type: number
 *                 format: float
 *                 description: 이동할 X 좌표
 *                 example: 23.456
 *               y:
 *                 type: number
 *                 format: float
 *                 description: 이동할 Y 좌표
 *                 example: 45.567
 *     responses:
 *       200:
 *         description: 업데이트 성공
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
 *                   example: "캔버스 카드 위치가 성공적으로 업데이트되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     cardId:
 *                       type: integer
 *                       example: 1
 *                     x:
 *                       type: number
 *                       example: 23.456
 *                     y:
 *                       type: number
 *                       example: 45.567
 *       401:
 *         description: 인증 실패 (토큰 누락 또는 만료)
 *       404:
 *         description: 해당 카드를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.post('/canvas', authenticateJWTtoken, setCanvasItems);


/**
 * @swagger
 * /api/canvas/sorted:
 *   get:
 *     summary: 우선순위별 카드 조회
 *     tags: [Canvas]
 *     security:
 *       - Authorization: []
 *     description: 홈 화면(캔버스)에 표시될 모든 카드를 선택한 기준(deadline, salary, distance, matchedPercent)에 따라 우선순위를 매기고, 같은 우선순위의 카드들을 묶어서 반환합니다. 각 카드에는 cardId만 포함됩니다.
 *                  마감일 지난 카드, 연봉 미정 카드, 거리 미정 카드, 매칭률 미정 카드는 가장 낮은 우선순위를 갖습니다.
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [deadline, salary, distance, matchedPercent]
 *         required: true
 *         description: 정렬 기준 (마감일, 연봉, 거리 중 하나)
 *     responses:
 *       200:
 *         description: 우선순위별 카드 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 priorities:
 *                   type: array
 *                   data:
 *                     type: object
 *                     properties:
 *                       priorityLevel:
 *                         type: integer
 *                       cardIds:
 *                         type: array
 *                         items:
 *                           type: integer
 *             example:
 *               success: true
 *               sort: "salary"
 *               message: "우선순위별 카드 조회 성공"
 *               data:
 *                 - priorityLevel: 1
 *                   cardIds: [4, 5]
 *                 - priorityLevel: 2
 *                   cardIds: [6]
 *       401:
 *         description: 인증되지 않은 사용자
 *       404:
 *         description: 카드 정보를 찾을 수 없음
 */
router.get('/canvas/sorted', authenticateJWTtoken, getSortedCanvasItems);

module.exports = router;