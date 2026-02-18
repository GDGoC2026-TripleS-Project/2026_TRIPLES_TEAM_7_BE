/**
 * @swagger
 * tags:
 *   name: Checklists
 *   description: GAP 체크리스트 및 매치 관련 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BaseResponse:
 *       type: object
 *       properties:
 *         isSuccess:
 *           type: boolean
 *         code:
 *           type: string
 *         data:
 *           type: object
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         isSuccess:
 *           type: boolean
 *           example: false
 *         code:
 *           type: string
 *           example: AUTH-401
 *         message:
 *           type: string
 *           example: JWT 인증 실패
 */
const express = require('express');
const router = express.Router();
const {
  getAllGapChecklistsByUser,
  getMatchChecklists,
  toggleChecklist,
  getResumePopupTrigger,
} = require('../services/checklistService');
const authenticateJWTtoken = require('../../middleware/authenticateToken.js');

/**
 * @swagger
 * /api/checklists/all:
 *   get:
 *     summary: 모든 GAP 체크리스트 조회
 *     description: 로그인 유저의 모든 GAP 상태 체크리스트를 조회합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: GAP 체크리스트 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       401:
 *         description: JWT 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/checklists/all', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }
    const data = await getAllGapChecklistsByUser(userId);
    res.json({ isSuccess: true, code: 'SUCCESS-200', data });
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/matches/{matchId}/checklists:
 *   get:
 *     summary: 특정 매치 체크리스트 조회
 *     description: 특정 매치(matchId)에 대한 체크리스트를 조회합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: 매치 체크리스트 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       400:
 *         description: 잘못된 matchId
 *       401:
 *         description: JWT 인증 실패
 */
router.get('/matches/:matchId/checklists', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'JWT token required' });
    }

    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: 'matchId must be integer' });
    }

    const result = await getMatchChecklists(matchId, userId);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/checklists/{checklistId}/toggle:
 *   patch:
 *     summary: 체크리스트 완료 여부 토글
 *     description: 특정 체크리스트의 완료 상태를 토글합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12
 *     responses:
 *       200:
 *         description: 토글 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       401:
 *         description: JWT 인증 실패
 */
router.patch('/checklists/:checklistId/toggle', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'userid is required' });
    }
    const checklistId = Number(req.params.checklistId);
    const result = await toggleChecklist(checklistId, userId);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @swagger
 * /api/matches/{matchId}/resume-popup-trigger:
 *   get:
 *     summary: 이력서 업데이트 팝업 트리거 조회
 *     description: 특정 매치에서 이력서 업데이트 팝업을 띄워야 하는지 여부를 조회합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: 팝업 트리거 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       401:
 *         description: JWT 인증 실패
 */
router.get('/matches/:matchId/resume-popup-trigger', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'userid is required' });
    }
    const matchId = Number(req.params.matchId);
    const data = await getResumePopupTrigger(matchId, userId);
    res.json({ isSuccess: true, code: 'SUCCESS-200', data });
  } catch (err) { next(err); }
});

module.exports = router;
