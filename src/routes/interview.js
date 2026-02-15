/**
 * @swagger
 * tags:
 *   - name: Interview
 *     description: 면접 질문 관련 API
 *
 * components:
 *   schemas:
 *     InterviewQuestion:
 *       type: object
 *       properties:
 *         questionId:
 *           type: integer
 *           example: 12
 *         orderNo:
 *           type: integer
 *           example: 1
 *         questionText:
 *           type: string
 *           example: 최근 부족하다고 느낀 역량을 어떻게 보완하려고 노력했나요?
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - 문제 해결
 *             - 성장성
 *
 *     InterviewQuestionSetData:
 *       type: object
 *       properties:
 *         cardId:
 *           type: integer
 *           example: 5
 *         setId:
 *           type: integer
 *           example: 22
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-15T05:22:11.000Z
 *         questions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InterviewQuestion'
 *
 *     InterviewQuestionSetResponse:
 *       type: object
 *       properties:
 *         isSuccess:
 *           type: boolean
 *           example: true
 *         code:
 *           type: string
 *           example: SUCCESS-201
 *         data:
 *           $ref: '#/components/schemas/InterviewQuestionSetData'
 */

const express = require('express');
const router = express.Router();

const {
  setAllCardsToInterview,
  generateInterviewQuestionsForCard,
  getActiveInterviewQuestions,
  saveActiveInterviewQuestions,
} = require('../services/interviewService');

function requireUserId(req, res) {
  const userId = Number(req.header('X-USER-ID'));
  if (!Number.isInteger(userId)) {
    res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'X-USER-ID required' });
    return null;
  }
  return userId;
}

function requireIntParam(req, res, name) {
  const v = Number(req.params[name]);
  if (!Number.isInteger(v)) {
    res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: `${name} must be integer` });
    return null;
  }
  return v;
}

/**
 * @swagger
 * /api/interview/cards/status:
 *   post:
 *     summary: 내 카드 전체를 INTERVIEW 상태로 변경
 *     tags: [Interview]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: 카드 상태 변경 성공
 *         content:
 *           application/json:
 *             example:
 *               isSuccess: true
 *               code: SUCCESS-200
 *               data:
 *                 userId: 2
 *                 updatedCount: 3
 *       401:
 *         description: 사용자 헤더 누락
 */
router.post('/interview/cards/status', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;

    const result = await setAllCardsToInterview(userId);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/cards/{cardId}/interview/questions:
 *   post:
 *     summary: AI 면접 질문 3개 생성 (키워드 2개 포함)
 *     tags: [Interview]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       201:
 *         description: 면접 질문 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InterviewQuestionSetResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 사용자 헤더 누락
 *       403:
 *         description: 카드 소유권 없음
 *       502:
 *         description: AI 생성 실패
 */
router.post('/cards/:cardId/interview/questions', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;

    const cardId = requireIntParam(req, res, 'cardId');
    if (cardId == null) return;

    // ✅ 항상 재생성(기존 삭제 + 새로 생성)
    const result = await generateInterviewQuestionsForCard(cardId, userId, { reset: true });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/cards/{cardId}/interview/questions:
 *   get:
 *     summary: 활성화된 면접 질문 조회
 *     tags: [Interview]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InterviewQuestionSetResponse'
 *       401:
 *         description: 사용자 헤더 누락
 *       403:
 *         description: 카드 소유권 없음
 */
router.get('/cards/:cardId/interview/questions', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;

    const cardId = requireIntParam(req, res, 'cardId');
    if (cardId == null) return;

    const result = await getActiveInterviewQuestions(cardId, userId);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;