const express = require('express');
const router = express.Router();
const {
  getAllGapChecklistsByUser,
  getMatchChecklists,
  toggleChecklist,
  getResumePopupTrigger,
} = require('../services/checklistService');

function requireUserId(req, res) {
  const userId = Number(req.header('X-USER-ID'));
  if (!Number.isInteger(userId)) {
    res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'X-USER-ID required' });
    return null;
  }
  return userId;
}

// 모든 GAP 체크리스트 조회
router.get('/checklists/all', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const data = await getAllGapChecklistsByUser(userId);
    res.json({ isSuccess: true, code: 'SUCCESS-200', data });
  } catch (err) { next(err); }
});

// 특정 매치 체크리스트 조회
router.get('/matches/:matchId/checklists', async (req, res, next) => {
  try {
    const matchId = Number(req.params.matchId);
    const result = await getMatchChecklists(matchId);
    res.json(result);
  } catch (err) { next(err); }
});

// 체크리스트 토글
router.patch('/checklists/:checklistId/toggle', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const checklistId = Number(req.params.checklistId);
    const result = await toggleChecklist(checklistId, userId);
    res.json(result);
  } catch (err) { next(err); }
});

// 이력서 업데이트 팝업 트리거 조회
router.get('/matches/:matchId/resume-popup-trigger', async (req, res, next) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const matchId = Number(req.params.matchId);
    const data = await getResumePopupTrigger(matchId, userId);
    res.json({ isSuccess: true, code: 'SUCCESS-200', data });
  } catch (err) { next(err); }
});

module.exports = router;