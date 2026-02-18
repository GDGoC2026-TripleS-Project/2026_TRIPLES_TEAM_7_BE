/**
 * @swagger
 * tags:
 *   name: Canvas
 *   description: 캔버스 관리 API
 */

const authenticateJWTtoken = require('../../middleware/authenticateToken.js');
const { getCanvasItems, getSortedCanvasItems } = require('../controllers/canvasController');
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
 *                       isAnalyzed:
 *                         type: boolean
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
 *                   isAnalyzed: false
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
 *                   isAnalyzed: true
 *                 x: 150
 *                 y: 45
 *       401:
 *         description: 인증되지 않은 사용자
 *       404:
 *         description: 카드 정보를 찾을 수 없음
 */
router.get('/api/canvas', getCanvasItems);

/**
 * @swagger
 * /api/canvas/prioritized:
 *   get:
 *     summary: 우선순위별 카드 조회
 *     tags: [Canvas]
 *     security:
 *       - Authorization: []
 *     description: 홈 화면(캔버스)에 표시될 모든 카드를 선택한 기준(deadline, salary, distance)에 따라 우선순위를 매기고, 같은 우선순위의 카드들을 묶어서 반환합니다. 각 카드에는 cardId만 포함됩니다.
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [deadline, salary, distance]
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       priorityLevel:
 *                         type: integer
 *                         example: 1
 *                       cardIds:
 *                         type: array
 *                         items:
 *                           type: integer
 *                         example: [1, 2]
 *             example:
 *               priorities:
 *                 - priorityLevel: 1
 *                   cardIds: [1, 2]
 *                 - priorityLevel: 2
 *                   cardIds: [3]
 *                 - priorityLevel: 19
 *                   cardIds: [4, 5]
 *       401:
 *         description: 인증되지 않은 사용자
 *       404:
 *         description: 카드 정보를 찾을 수 없음
 */
router.get('/api/canvas/sorted', async (req, res) => {
  try {
    const userId = req.user.id;
    const sort = req.query.sort;
    // const sortedCanvasItems = await canvasService.getSortedCanvasItems(userId, sort); 
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  } });

module.exports = router;