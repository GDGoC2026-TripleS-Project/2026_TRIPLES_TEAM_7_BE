// routes/match.js
const express = require('express');
const router = express.Router();
const matchService = require('../services/matchService');
const authenticateJWTtoken = require('../../middleware/authenticateToken.js');
const db = require('../models'); 

/**
 * @swagger
 * tags:
 *   name: Match
 *   description: 이력서-공고 매칭 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MatchJobInfoRequest:
 *       type: object
 *       required:
 *         - jobTitle
 *         - companyName
 *         - employmentType
 *         - roleText
 *         - necessaryStack
 *         - preferStack
 *         - experienceLevel
 *         - salaryText
 *         - workDay
 *         - locationText
 *         - deadlineAt
 *       properties:
 *         jobTitle:
 *           type: string
 *           example: 웹 프론트엔드 개발자
 *         companyName:
 *           type: string
 *           example: 카카오모빌리티
 *         employmentType:
 *           type: array
 *           items:
 *             type: string
 *           example: ["FULL_TIME"]
 *         roleText:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - TypeScript와 React/Next.js 기반의 카카오 T, 카카오내비 웹뷰 및 웹 서비스 아키텍처 설계 및 개발을 담당합니다.
 *         necessaryStack:
 *           type: array
 *           items:
 *             type: string
 *           example: ["TypeScript","React","JavaScript","웹 개발","Front-end 개발","비동기 처리"]
 *         preferStack:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AI 기술","Back-end","DevOps","클라우드 시스템","웹 접근성","디자인 시스템"]
 *         experienceLevel:
 *           type: array
 *           items:
 *             type: string
 *           example: ["경력직"]
 *         salaryText:
 *           type: string
 *           example: 회사 내규에 따름
 *         workDay:
 *           type: string
 *           example: ""
 *         locationText:
 *           type: string
 *           example: 경기 성남시 분당구 판교역로 152 카카오모빌리티
 *         deadlineAt:
 *           type: string
 *           format: date-time
 *           example: "2026-02-04T23:59:59.000Z"
 *
 *     MatchTopItem:
 *       type: object
 *       properties:
 *         matchResultId:
 *           type: integer
 *           example: 55
 *         comment:
 *           type: string
 *           example: React실무 경험
 *
 *     MatchGapItem:
 *       type: object
 *       properties:
 *         matchResultId:
 *           type: integer
 *           example: 58
 *         comment:
 *           type: string
 *           example: TypeScript 사용경험
 *         isRequired:
 *           type: boolean
 *           example: true
 *
 *     MatchCreateResponse:
 *       type: object
 *       properties:
 *         matchId:
 *           type: integer
 *           example: 6
 *         matchPercent:
 *           type: integer
 *           example: 72
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-02-09T08:34:29.287Z"
 *         sourceFileUrl:
 *           type: string
 *           example: "https://.../resume.pdf"
 *         strengthTop3:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchTopItem'
 *         gapTop3:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchGapItem'
 *         riskTop3:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchTopItem'
 *         canCreateChecklist:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/cards/{cardId}/match:
 *   post:
 *     summary: AI 매칭 생성
 *     description: 이력서 PDF URL(fileUrl)과 공고 정보(jobInfo)를 기반으로 AI 매칭을 생성하고 결과를 저장/반환합니다.
 *     tags: [Match]
 *     security:
 *       - Authorization: []
 *     parameters:
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
 *               - jobInfo
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 description: 이력서 PDF URL
 *               jobInfo:
 *                 $ref: '#/components/schemas/MatchJobInfoRequest'
 *           example:
 *             fileUrl: "https://piec-bucket-01.s3.ap-northeast-2.amazonaws.com/piec1/1771655935898-781900868.pdf"
 *             jobInfo:
 *               jobTitle: "웹 프론트엔드 개발자"
 *               companyName: "카카오모빌리티"
 *               employmentType:
 *                 - "FULL_TIME"
 *               roleText:
 *                 - "TypeScript와 React/Next.js 기반의 카카오 T, 카카오내비 웹뷰 및 웹 서비스 아키텍처 설계 및 개발을 담당합니다."
 *               necessaryStack:
 *                 - "TypeScript"
 *                 - "React"
 *                 - "JavaScript"
 *                 - "웹 개발"
 *                 - "Front-end 개발"
 *                 - "비동기 처리"
 *               preferStack:
 *                 - "AI 기술"
 *                 - "Back-end"
 *                 - "DevOps"
 *                 - "클라우드 시스템"
 *                 - "웹 접근성"
 *                 - "디자인 시스템"
 *               experienceLevel:
 *                 - "경력직"
 *               salaryText: "회사 내규에 따름"
 *               workDay: ""
 *               locationText: "경기 성남시 분당구 판교역로 152 카카오모빌리티"
 *               deadlineAt: "2026-02-04T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: 매칭 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MatchCreateResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: JWT 인증 실패 (토큰 누락/만료/위조)
 */
router.post('/cards/:cardId/match', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    const cardId = Number(req.params.cardId);
    const { fileUrl, jobInfo } = req.body;

    // 먼저 검증
    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({ ok: false, message: 'userId is required' });
    }
    if (!cardId || Number.isNaN(cardId)) {
      return res.status(400).json({ ok: false, message: 'cardId is invalid' });
    }
    // ✅ jobInfo 없으면 카드에서 조립
    if (!jobInfo) {
      const card = await db.job_cards.findOne({ where: { id: cardId, userId } });
      if (!card) return res.status(404).json({ ok: false, message: 'card not found' });

      // fileUrl도 없으면 카드에서 보강
      if (!fileUrl) fileUrl = card.fileUrl;

      // employmentType 정규화(카드에 enum이 이미 들어가면 그대로 통과)
      const et = card.employmentType;
      const normalizedEmploymentType =
        et === 'FULL_TIME' || et === 'CONTRACT' || et === 'INTERN'
          ? et
          : (String(et).includes('정규직') ? 'FULL_TIME'
            : String(et).includes('계약') ? 'CONTRACT'
            : String(et).includes('인턴') ? 'INTERN'
            : 'FULL_TIME');

      jobInfo = {
        jobTitle: card.jobTitle,
        companyName: card.companyName,
        employmentType: [normalizedEmploymentType],
        roleText: card.roleText ? String(card.roleText).split('\n').filter(Boolean) : [],
        necessaryStack: card.necessaryStack ?? [],
        preferStack: card.preferStack ?? [],
        experienceLevel: card.experienceLevel
          ? String(card.experienceLevel).split(',').map(s => s.trim()).filter(Boolean)
          : [],
        salaryText: card.salaryText ?? '',
        workDay: card.workDay ?? '',
        locationText: card.locationText ?? '',
        deadlineAt: card.deadlineAt
          ? new Date(card.deadlineAt).toISOString()
          : new Date().toISOString(),
      };
    }

    // 그 다음 서비스 호출 (result는 1번만 선언)
    const result = await matchService.createMatchAndSave({ userId, cardId, fileUrl, jobInfo });
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
 *     security:
 *       - Authorization: []
 *     parameters:
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
 *               $ref: '#/components/schemas/MatchCreateResponse'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: JWT 인증 실패 (토큰 누락/만료/위조)
 */
router.get('/cards/:cardId/match', authenticateJWTtoken, async (req, res, next) => {
  try {
    const userId = Number(req.user?.id);
    const cardId = Number(req.params.cardId);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }
    if (!Number.isInteger(cardId)) {
      return res.status(400).json({ isSuccess: false, code: 'BAD_REQUEST', message: 'cardId must be integer' });
    }

    const result = await matchService.getLatestMatch({ userId, cardId });
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});



module.exports = router;
