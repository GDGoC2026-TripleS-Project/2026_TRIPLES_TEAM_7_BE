// routes/match.js
const express = require('express');
const router = express.Router();
const matchService = require('../services/matchService');

/**
 * @swagger
 * tags:
 *   name: Match
 *   description: 이력서-공고 매칭 API
 */

/**
 * @swagger
 * /api/cards/{cardId}/match:
 *   post:
 *     summary: AI 매칭 생성
 *     description: 이력서 파일 URL을 기반으로 AI 매칭을 생성하고 결과를 저장합니다.
 *     tags: [Match]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: https://example.com/resume.pdf
 *     responses:
 *       200:
 *         description: 매칭 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matchId:
 *                   type: integer
 *                   example: 12
 *                 matchPercent:
 *                   type: integer
 *                   example: 72
 *       400:
 *         description: 잘못된 요청
 */
router.post('/cards/:cardId/match', async (req, res, next) => {
  try {
    const userId = Number(req.header('X-USER-ID'));
    const cardId = Number(req.params.cardId);
    const { fileUrl } = req.body;

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ ok: false, message: 'X-USER-ID header is required' });
    }
    if (!cardId || Number.isNaN(cardId)) {
      return res.status(400).json({ ok: false, message: 'cardId is invalid' });
    }
    if (!fileUrl || typeof fileUrl !== 'string') {
      return res.status(400).json({ ok: false, message: 'fileUrl is required' });
    }

    const result = await matchService.createMatchAndSave({ userId, cardId, fileUrl });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/cards/{cardId}/match:
 *   get:
 *     summary: 최신 매칭 조회
 *     description: 특정 카드에 대한 사용자의 가장 최근 매칭 결과를 조회합니다.
 *     tags: [Match]
 *     parameters:
 *       - in: header
 *         name: X-USER-ID
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
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
 *               type: object
 *               properties:
 *                 matchId:
 *                   type: integer
 *                   example: 12
 *                 matchPercent:
 *                   type: integer
 *                   example: 72
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-02-09T10:20:50.000Z
 *       400:
 *         description: 잘못된 요청
 */
router.get('/cards/:cardId/match', async (req, res, next) => {
  try {
    const userId = Number(req.header('X-USER-ID'));
    const cardId = Number(req.params.cardId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ ok: false, message: 'X-USER-ID header is required' });
    }
    if (!cardId || Number.isNaN(cardId)) {
      return res.status(400).json({ ok: false, message: 'cardId is invalid' });
    }

    const result = await matchService.getLatestMatch({ userId, cardId });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
