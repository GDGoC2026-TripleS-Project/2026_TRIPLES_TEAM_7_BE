/**
 * @swagger
 * tags:
 *   name: Checklists
 *   description: GAP 체크리스트 및 매치 체크리스트 조회/완료/읽음 처리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CardSummary:
 *       type: object
 *       properties:
 *         cardId:
 *           type: integer
 *           example: 5
 *         jobTitle:
 *           type: string
 *           example: 웹 프론트엔드 개발자
 *         companyName:
 *           type: string
 *           example: 카카오모빌리티
 *         employmentType:
 *           type: string
 *           enum: [FULL_TIME, CONTRACT, INTERN]
 *           example: FULL_TIME
 *         matchPercent:
 *           type: integer
 *           description: 매치율(%)
 *           example: 72
 *         deadlineAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 모집 공고 마감일(정렬용). 없으면 null
 *           example: 2026-03-01T14:59:59.000Z
 *
 *     ChecklistItem:
 *       type: object
 *       properties:
 *         checklistId:
 *           type: integer
 *           example: 19
 *         checkListText:
 *           type: string
 *           example: 기존 자바스크립트 프로젝트를 타입스크립트로 변환하여 GitHub에 커밋 완료하기
 *         isButtonActive:
 *           type: boolean
 *           example: false
 *
 *     GapResultItemWithCard:
 *       type: object
 *       properties:
 *         matchResultId:
 *           type: integer
 *           example: 58
 *         cardStatus:
 *           type: string
 *           enum: [GAP]
 *           example: GAP
 *         comment:
 *           type: string
 *           example: TypeScript 사용경험
 *         isRequired:
 *           type: boolean
 *           example: true
 *         keywords:
 *           type: array
 *           description: GAP 키워드(2~5개)
 *           items:
 *             type: string
 *           example: ["TypeScript", "정적 타이핑", "Interface"]
 *         checklists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChecklistItem'
 *
 *     ChecklistsAllWithCardItem:
 *       type: object
 *       properties:
 *         matchId:
 *           type: integer
 *           example: 13
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-02-20T10:10:27.000Z
 *         seenAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         isNew:
 *           type: boolean
 *           example: true
 *         totalChecklists:
 *           type: integer
 *           description: 해당 match의 전체 체크리스트 개수
 *           example: 9
 *         completedChecklists:
 *           type: integer
 *           description: 해당 match의 완료된 체크리스트 개수
 *           example: 1
 *         cardSummary:
 *           $ref: '#/components/schemas/CardSummary'
 *         gapResults:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GapResultItemWithCard'
 */

const express = require('express');
const router = express.Router();

const authenticateJWTtoken = require('../../middleware/authenticateToken.js');
const {
  getAllGapChecklistsByUser,
  getMatchChecklists,
  toggleChecklist,
  getResumePopupTrigger,
  markMatchChecklistsSeen,
  getAllGapChecklistsByUserWithCardSummary,
} = require('../services/checklistService');

// -------------------------
// GET /api/checklists/all
// -------------------------
/**
 * @swagger
 * /api/checklists/all:
 *   get:
 *     summary: 모든 GAP 체크리스트 조회 (match 단위 그룹)
 *     description: |
 *       로그인 유저의 모든 GAP 체크리스트를 matchId(match_percent.id) 기준으로 묶어서 반환합니다.
 *       읽음(seenAt/isNew)은 match_percent 단위로만 제공합니다. (GAP/checklist 단위 제공 없음)
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: GAP 체크리스트 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChecklistsAllItem'
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
    return res.json({ isSuccess: true, code: 'SUCCESS-200', message: 'OK', data });
  } catch (err) {
    next(err);
  }
});

// -------------------------------------
// GET /api/matches/:matchId/checklists
// -------------------------------------
/**
 * @swagger
 * /api/matches/{matchId}/checklists:
 *   get:
 *     summary: 특정 매치 체크리스트 상세 조회
 *     description: |
 *       특정 matchId(match_percent.id)의 STRENGTH/GAP/RISK 결과를 모두 반환합니다.
 *       읽음(seenAt/isNew)은 match_percent 단위로만 제공합니다. (GAP/checklist 단위 제공 없음)
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 13
 *     responses:
 *       200:
 *         description: 매치 체크리스트 반환
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MatchChecklistsData'
 *       400:
 *         description: 잘못된 matchId
 *       401:
 *         description: JWT 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 권한 없음 (해당 match 소유자 아님)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------
// PATCH /api/checklists/:checklistId/toggle
// -------------------------------------
/**
 * @swagger
 * /api/checklists/{checklistId}/toggle:
 *   patch:
 *     summary: 체크리스트 완료 여부 토글
 *     description: 특정 체크리스트의 완료 상태(isButtonActive)를 토글합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 19
 *     responses:
 *       200:
 *         description: 토글 성공
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
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/checklists/:checklistId/toggle', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }

    const checklistId = Number(req.params.checklistId);
    if (!Number.isInteger(checklistId)) {
      return res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: 'checklistId must be integer' });
    }

    const result = await toggleChecklist(checklistId, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------
// GET /api/matches/:matchId/resume-popup-trigger
// -------------------------------------
/**
 * @swagger
 * /api/matches/{matchId}/resume-popup-trigger:
 *   get:
 *     summary: 이력서 업데이트 팝업 트리거 조회
 *     description: 특정 매치에서 모든 체크리스트가 완료되었는지 확인하여 팝업 표시 여부를 반환합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 13
 *     responses:
 *       200:
 *         description: 팝업 트리거 정보 반환
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
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/matches/:matchId/resume-popup-trigger', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }

    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: 'matchId must be integer' });
    }

    const result = await getResumePopupTrigger(matchId, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});



// -------------------------------------
// PATCH /api/matches/:matchId/checklists/seen
// -------------------------------------
/**
 * @swagger
 * /api/matches/{matchId}/checklists/seen:
 *   patch:
 *     summary: 특정 매치의 "확인함" 처리 (match 단위)
 *     description: |
 *       해당 matchId(match_percent.id)의 seenAt을 현재 시각으로 업데이트합니다.
 *       (노란점 제거용 / match 단위)
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 13
 *     responses:
 *       200:
 *         description: 확인 처리 결과
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MarkSeenResponseData'
 *       400:
 *         description: 잘못된 matchId
 *       401:
 *         description: JWT 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 권한 없음 (해당 match 소유자 아님)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/matches/:matchId/checklists/seen', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }

    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: 'matchId must be integer' });
    }

    const result = await markMatchChecklistsSeen(matchId, userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/checklists/all-with-card:
 *   get:
 *     summary: 모든 GAP 체크리스트 조회 + 카드 상단 요약 포함 (match 단위 그룹)
 *     description: |
 *       로그인 유저의 모든 GAP 체크리스트를 matchId(match_percent.id) 기준으로 묶어서 반환합니다.
 *       각 match 그룹 상단에 카드 요약정보(jobTitle/companyName/employmentType/matchPercent/deadlineAt)를 함께 내려줍니다.
 *       읽음(seenAt/isNew)은 match_percent 단위로만 제공합니다. (GAP/checklist 단위 제공 없음)
 *       정렬은 query parameter(sort/order)로 제어합니다.
 *     tags: [Checklists]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum: [deadline, recent, incomplete]
 *           default: recent
 *         description: |
 *           정렬 기준
 *           - deadline: 모집 공고 순(마감 가까운 순)
 *           - recent: 최근순(match createdAt 최신)
 *           - incomplete: 미완료 순(남은 체크리스트 많은 순)
 *         example: recent
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: |
 *           정렬 방향
 *           - deadline 기본값: asc
 *           - recent 기본값: desc
 *           - incomplete 기본값: desc
 *         example: desc
 *     responses:
 *       200:
 *         description: GAP 체크리스트 목록 반환 (카드 요약 포함)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/BaseResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChecklistsAllWithCardItem'
 *       401:
 *         description: JWT 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/checklists/all-with-card', authenticateJWTtoken, async (req, res, next) => {
  try {
      res.set('Cache-Control', 'no-store');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }

    const sort = (req.query.sort ?? 'recent').toString();  // deadline | recent | incomplete
    const order = (req.query.order ?? '').toString();      // asc | desc (optional)

    const data = await getAllGapChecklistsByUserWithCardSummary(userId, { sort, order });

    return res.json({ isSuccess: true, code: 'SUCCESS-200', message: 'OK', data });
  } catch (err) {
    next(err);
  }
});


module.exports = router;