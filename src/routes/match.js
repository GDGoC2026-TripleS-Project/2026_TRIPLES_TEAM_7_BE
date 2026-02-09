// routes/match.js
const express = require('express');
const router = express.Router();

const matchService = require('../services/matchService');

// POST /api/cards/:cardId/match  (AI 연동 + 저장)
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

    // ✅ 응답은 최소 형태만
    return res.status(200).json(result); // { matchId, matchPercent }
  } catch (err) {
    next(err);
  }
});


// ✅ 최신 매치 조회
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
