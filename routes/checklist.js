const express = require('express');
const router = express.Router();
const db = require('../models');
const mockActiveMap = new Map();

function buildMockChecklistsResponse(matchId) {
  const createdAt = new Date('2026-02-08T09:01:00.000Z').toISOString();

  const base = [
    { matchResultId: 46, cardStatus: 'STRENGTH', comment: 'React실무 경험' },
    { matchResultId: 47, cardStatus: 'STRENGTH', comment: '협업 기반 개발 경험' },
    { matchResultId: 48, cardStatus: 'STRENGTH', comment: '포트폴리오 완성도 높음' },
    { matchResultId: 49, cardStatus: 'GAP', comment: 'TypeScript 사용경험', isRequired: true },
    { matchResultId: 50, cardStatus: 'GAP', comment: '테스트 코드 작성 경험', isRequired: false },
    { matchResultId: 51, cardStatus: 'GAP', comment: '관련 자격증', isRequired: false },
    { matchResultId: 52, cardStatus: 'RISK', comment: '조건 자체가 리스크' },
    { matchResultId: 53, cardStatus: 'RISK', comment: '경력 3년이상' },
    { matchResultId: 54, cardStatus: 'RISK', comment: '복수전공자 우대' },
  ];

  // matchResultId마다 3개씩 (총 27개)
  const textByComment = {
    'React실무 경험': [
      '기존 프로젝트 일부를 React로 리팩토링해 적용 사례 만들기',
      'React 성과(속도/UX 개선)를 포트폴리오에 수치로 정리하기',
      'React 컴포넌트 설계 기준과 이유를 README에 정리하기',
    ],
    '협업 기반 개발 경험': [
      'PR 템플릿과 코드리뷰 규칙을 문서로 정리하기',
      '협업 툴(Jira/GitHub Issues) 사용 흔적을 캡처해 첨부하기',
      '갈등/의견조율 경험을 문제-행동-결과로 정리하기',
    ],
    '포트폴리오 완성도 높음': [
      '프로젝트별 기여도(담당 기능)를 한 줄 요약으로 추가하기',
      '트러블슈팅 1~2개를 “원인-해결-배운점”으로 정리하기',
      '배포 링크/테스트 계정/데모 영상을 보기 쉽게 배치하기',
    ],
    'TypeScript 사용경험': [
      '기존 JS 프로젝트를 TS로 마이그레이션해보기',
      '공고에서 자주 쓰는 TS 문법(Generics/Union) 예제를 정리하기',
      'TS 도입 이유와 효과를 이력서 bullet로 추가하기',
    ],
    '테스트 코드 작성 경험': [
      '핵심 로직 3개에 단위 테스트(Jest) 작성하기',
      '테스트 커버리지 목표(예: 60%)를 잡고 개선하기',
      '테스트 전략(단위/통합)을 README에 간단히 정리하기',
    ],
    '관련 자격증': [
      '지원 직무에 맞는 자격증 1~2개 후보를 선정하기',
      '시험 일정과 준비 계획(주차별)을 작성하기',
      '학습 결과물(요약 노트)을 포트폴리오에 링크로 추가하기',
    ],
    '조건 자체가 리스크': [
      '필수 조건을 충족/미충족으로 나눠 대응 전략 세우기',
      '미충족 조건을 대체할 근거(프로젝트/학습) 마련하기',
      '지원서에서 리스크를 보완하는 강점을 전면 배치하기',
    ],
    '경력 3년이상': [
      '실무형 사이드 프로젝트 1개를 추가해 경력 대체 근거 만들기',
      '성과 중심으로 경험을 재구성(문제-해결-지표)하기',
      '요구 경력과 유사한 업무를 했다는 근거를 강조하기',
    ],
    '복수전공자 우대': [
      '연관 분야 수업/프로젝트 경험을 전공처럼 보이게 정리하기',
      '직무와 연결되는 교차 역량(기획/디자인 등)을 강조하기',
      '우대요건에 대응하는 학습 계획을 한 줄로 포함하기',
    ],
  };

  // checklistId는 보기 좋게 101부터 증가
  let checklistIdSeq = 101;

  const matchResults = base.map((r) => {
    const texts = textByComment[r.comment] || [
      `${r.comment} 관련 액션 1`,
      `${r.comment} 관련 액션 2`,
      `${r.comment} 관련 액션 3`,
    ];

    return {
      matchResultId: r.matchResultId,
      cardStatus: r.cardStatus,
      comment: r.comment,
      ...(r.cardStatus === 'GAP' ? { isRequired: r.isRequired } : {}),
      checklists: texts.map((t, idx) => ({
        checklistId: checklistIdSeq++,
        checkListText: t,
        isButtonActive: idx === 0 ? false : false, // 원하는대로 바꿔도 됨
      })),
    };
  });

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: {
      matchId,
      createdAt,
      matchResults,
    },
  };
}

// ✅ X-USER-ID 헤더에서 userId 받는 버전 (네 프로젝트 스타일에 맞게 조정 가능)
function getUserId(req) {
  const v = req.header('X-USER-ID');
  return v ? Number(v) : NaN;
}



// GET /api/matches/:matchId/checklists
router.get('/matches/:matchId/checklists', async (req, res, next) => {
    console.log('[checklists] USE_MOCK=', process.env.USE_MOCK);
    console.log('[checklists] path=', req.originalUrl);

  try {
    const matchId = Number(req.params.matchId);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({
        isSuccess: false,
        code: 'BAD_REQUEST',
        message: 'matchId must be integer',
      });
    }

    // ✅ MOCK 모드면 DB 안 타고 바로 응답
    if (process.env.USE_MOCK === 'true') {
      return res.json(buildMockChecklistsResponse(matchId));
    }

    // 1) match_percent (createdAt 얻기용)
    const match = await db.match_percent.findByPk(matchId);
    if (!match) {
      return res.status(404).json({
        isSuccess: false,
        code: 'MATCH-404',
        message: 'match not found',
      });
    }

    // 2) match_result 9개
    const results = await db.match_result.findAll({
      where: { matchId },
      order: [['id', 'ASC']],
    });

    const matchResultIds = results.map(r => r.id);

    // 3) checklist 27개
    const checklists = await db.improve_checklist.findAll({
      where: { matchResultId: matchResultIds },
      order: [
        ['matchResultId', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    // 4) matchResultId 기준 그룹핑
    const map = new Map();
    for (const c of checklists) {
      if (!map.has(c.matchResultId)) map.set(c.matchResultId, []);
      map.get(c.matchResultId).push({
        checklistId: c.id,
        checkListText: c.checkListText,
        isButtonActive: Boolean(c.isButtonActive),
      });
    }

    // 5) 응답 조립
    const matchResults = results.map(r => ({
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
      isRequired: r.cardStatus === 'GAP' ? Boolean(r.isRequired) : undefined,
      checklists: map.get(r.id) || [],
    }));

    return res.json({
      isSuccess: true,
      code: 'SUCCESS-200',
      message: 'OK',
      data: {
        matchId,
        createdAt: match.createdAt, // ✅ 여기 하나만
        matchResults,
      },
    });
  } catch (err) {
    next(err);
  }
});


/**
 * PATCH /api/checklists/:checklistId/toggle
 * - isButtonActive 토글
 * - 소유자 검증: improve_checklist -> match_result.userId === X-USER-ID
 */
router.patch('/checklists/:checklistId/toggle', async (req, res, next) => {
  try {
    // ✅ 0) checklistId를 제일 먼저 만든다
    const checklistId = Number(req.params.checklistId);
    if (!Number.isInteger(checklistId)) {
      return res.status(400).json({
        isSuccess: false,
        code: 'BAD_REQUEST',
        message: 'checklistId must be integer',
      });
    }

    // ✅ 1) MOCK 모드면 DB 없이 메모리에서 토글
    if (process.env.USE_MOCK === 'true') {
      const current = mockActiveMap.get(checklistId) ?? false;
      const nextValue = !current;
      mockActiveMap.set(checklistId, nextValue);

      return res.json({
        isSuccess: true,
        code: 'SUCCESS-200',
        message: 'OK',
        data: {
          checklistId,
          isButtonActive: nextValue,
        },
      });
    }

    // ✅ 2) MOCK 아니면 DB 토글 (기존 로직)
    const userId = getUserId(req);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({
        isSuccess: false,
        code: 'AUTH-401',
        message: 'X-USER-ID header required',
      });
    }

    const checklist = await db.improve_checklist.findByPk(checklistId);
    if (!checklist) {
      return res.status(404).json({
        isSuccess: false,
        code: 'CHECKLIST-404',
        message: 'Checklist not found',
      });
    }

    const mr = await db.match_result.findByPk(checklist.matchResultId);
    if (!mr) {
      return res.status(404).json({
        isSuccess: false,
        code: 'MATCH_RESULT-404',
        message: 'match_result not found',
      });
    }

    if (Number(mr.userId) !== Number(userId)) {
      return res.status(403).json({
        isSuccess: false,
        code: 'AUTH-403',
        message: 'Forbidden: checklist owner mismatch',
      });
    }

    const nextValue = !Boolean(checklist.isButtonActive);
    await checklist.update({ isButtonActive: nextValue });

    return res.json({
      isSuccess: true,
      code: 'SUCCESS-200',
      message: 'OK',
      data: {
        checklistId: checklist.id,
        matchResultId: checklist.matchResultId,
        isButtonActive: nextValue,
      },
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
