// services/matchService.js
const db = require('../models');
const { sequelize } = db;
const checklistService = require('./checklistService'); // ✅ 자동 체크리스트 생성 호출용

// TODO: 실제 AI 호출로 교체
async function runMatchAI(payload) {
  // return await realRunMatchAI(payload);
  return {
    matchPercent: 72,
    strengthTop3: [
      { comment: 'React실무 경험' },
      { comment: '협업 기반 개발 경험' },
      { comment: '포트폴리오 완성도 높음' },
    ],
    gapTop3: [
      { comment: 'TypeScript 사용경험', isRequired: true },
      { comment: '테스트 코드 작성 경험', isRequired: false },
      { comment: '관련 자격증', isRequired: false },
    ],
    riskTop3: [
      { comment: '조건 자체가 리스크' },
      { comment: '경력 3년이상' },
      { comment: '복수전공자 우대' },
    ],
  };
}

function assertJobInfoShape(jobInfo) {
  if (!jobInfo || typeof jobInfo !== 'object') return 'jobInfo is required';
  if (typeof jobInfo.jobTitle !== 'string') return 'jobInfo.jobTitle is required';
  if (typeof jobInfo.companyName !== 'string') return 'jobInfo.companyName is required';
  if (!Array.isArray(jobInfo.employmentType)) return 'jobInfo.employmentType must be array';
  if (!Array.isArray(jobInfo.roleText)) return 'jobInfo.roleText must be array';
  if (!Array.isArray(jobInfo.necessaryStack)) return 'jobInfo.necessaryStack must be array';
  if (!Array.isArray(jobInfo.preferStack)) return 'jobInfo.preferStack must be array';
  if (!Array.isArray(jobInfo.experienceLevel)) return 'jobInfo.experienceLevel must be array';
  if (typeof jobInfo.salaryText !== 'string') return 'jobInfo.salaryText must be string';
  if (typeof jobInfo.workDay !== 'string') return 'jobInfo.workDay must be string';
  if (typeof jobInfo.locationText !== 'string') return 'jobInfo.locationText must be string';
  if (typeof jobInfo.deadlineAt !== 'string') return 'jobInfo.deadlineAt must be string';
  return null;
}

function computeCanCreateChecklist(gapTop3) {
  return Array.isArray(gapTop3) && gapTop3.some(g => g?.isRequired === true);
}

// ✅ DB NOT NULL 대응: isRequired 항상 boolean, title/comment 정리
function buildMatchResultRows(matchId, userId, fileUrl, list, cardStatus) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((it, idx) => ({
    matchId,
    userId,
    fileUrl,
    cardStatus,
    matchResultComment: it?.comment ?? null, // nullable이면 null OK
    matchResultTitle: (it?.title && String(it.title).trim())
      ? String(it.title).trim()
      : `${cardStatus} ${idx + 1}`,
    isRequired: cardStatus === 'GAP' ? !!it?.isRequired : false,
  }));
}

/**
 * 카드 1개에 대해
 * 1) 매치 AI 실행
 * 2) match_percent 1row 저장
 * 3) match_result 9row 저장
 * 4) (옵션) canCreateChecklist면 improve_checklist 9row 자동 생성 (Gemini)
 */
exports.createMatchAndSave = async ({ userId, cardId, fileUrl, jobInfo }) => {
  // 0) 입력 검증
  if (!Number.isInteger(userId)) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(cardId)) {
    const err = new Error('cardId is invalid');
    err.status = 400;
    throw err;
  }
  if (!fileUrl || typeof fileUrl !== 'string') {
    const err = new Error('fileUrl is required');
    err.status = 400;
    throw err;
  }

  const shapeError = assertJobInfoShape(jobInfo);
  if (shapeError) {
    const err = new Error(shapeError);
    err.status = 400;
    throw err;
  }

  // 0-1) 카드 소유권 체크
  const card = await db.job_cards.findOne({ where: { id: cardId, userId } });
  if (!card) {
    const err = new Error('카드가 존재하지 않습니다.');
    err.status = 404;
    err.code = 'CARD-404';
    throw err;
  }

  // 1) AI 호출
  const ai = await runMatchAI({ fileUrl, jobInfo });

  // 2) 저장 + 응답 조립 (트랜잭션)
  const matchResult = await sequelize.transaction(async (t) => {
    // (A) match_percent 저장
    const matchRow = await db.match_percent.create(
      {
        cardId,
        matchPercent: ai.matchPercent,
        // sourceFileUrl 컬럼이 DB에 실제로 있으면 추가 가능:
        // sourceFileUrl: fileUrl,
      },
      { transaction: t }
    );

    // (B) match_result 저장
    const strengthRows = buildMatchResultRows(matchRow.id, userId, fileUrl, ai.strengthTop3, 'STRENGTH');
    const gapRows      = buildMatchResultRows(matchRow.id, userId, fileUrl, ai.gapTop3,      'GAP');
    const riskRows     = buildMatchResultRows(matchRow.id, userId, fileUrl, ai.riskTop3,     'RISK');

    const fields = [
      'matchId', 'userId', 'fileUrl', 'cardStatus',
      'matchResultComment', 'matchResultTitle', 'isRequired',
    ];

    await db.match_result.bulkCreate(strengthRows, { transaction: t, fields });
    await db.match_result.bulkCreate(gapRows,      { transaction: t, fields });
    await db.match_result.bulkCreate(riskRows,     { transaction: t, fields });

    // ✅ (C) id 포함 row 재조회 (MySQL에서도 matchResultId 100% 보장)
    const saved = await db.match_result.findAll({
      where: { matchId: matchRow.id, userId },
      order: [['id', 'ASC']],
      transaction: t,
    });

    const strengthTop3 = [];
    const gapTop3 = [];
    const riskTop3 = [];

    for (const r of saved) {
      const comment = r.matchResultComment ?? r.matchResultTitle;
      if (r.cardStatus === 'STRENGTH') strengthTop3.push({ matchResultId: r.id, comment });
      if (r.cardStatus === 'GAP')      gapTop3.push({ matchResultId: r.id, comment, isRequired: !!r.isRequired });
      if (r.cardStatus === 'RISK')     riskTop3.push({ matchResultId: r.id, comment });
    }

    return {
      matchId: matchRow.id,
      matchPercent: matchRow.matchPercent,
      createdAt: matchRow.createdAt,
      sourceFileUrl: fileUrl,
      strengthTop3: strengthTop3.slice(0, 3),
      gapTop3: gapTop3.slice(0, 3),
      riskTop3: riskTop3.slice(0, 3),
      canCreateChecklist: computeCanCreateChecklist(gapTop3),
    };
  });

  // 3) ✅ 트랜잭션 커밋 후: 체크리스트 자동 생성 (Gemini)
  // - 오래 걸리는 외부 호출을 트랜잭션 안에 넣으면 락/타임아웃 위험 ↑
  if (matchResult.canCreateChecklist) {
    try {
      // reset: true면 같은 matchId GAP(3개)에 대해 기존 체크리스트를 지우고 새로 생성
      await checklistService.generateChecklistsForMatch(matchResult.matchId, userId, { reset: true });
    } catch (e) {
      // 정책: 매치는 성공시키고 체크리스트만 실패할 수 있음 (로그로만)
      console.error('[checklist auto-gen failed]', e);
    }
  }

  return matchResult;
};

/**
 * 최신 매칭 조회 (이미 너가 쓰고 있다면 그대로 유지하면 됨)
 * - match_percent: cardId별 최신 1개
 * - match_result: 해당 matchId 9개
 * - improve_checklist는 별도 API(/matches/:matchId/checklists)로 조회하는 구조라면 여기서는 생략 가능
 */
exports.getLatestMatch = async ({ userId, cardId }) => {
  if (!Number.isInteger(userId)) {
    return { isSuccess: false, code: 'AUTH-401', message: 'token required' };
  }
  if (!Number.isInteger(cardId)) {
    return { isSuccess: false, code: 'BAD_REQUEST', message: 'cardId must be integer' };
  }

  // 카드 소유권 체크
  const card = await db.job_cards.findOne({ where: { id: cardId, userId } });
  if (!card) {
    return { isSuccess: false, code: 'CARD-404', message: 'card not found' };
  }

  // 최신 match_percent
  const latest = await db.match_percent.findOne({
    where: { cardId },
    order: [['createdAt', 'DESC']],
  });
  if (!latest) {
    return { isSuccess: true, code: 'SUCCESS-200', data: null };
  }

  // match_result 9개
  const results = await db.match_result.findAll({
    where: { matchId: latest.id, userId },
    order: [['id', 'ASC']],
  });

  // 응답 모양을 createMatchAndSave와 유사하게 맞춤
  const strengthTop3 = [];
  const gapTop3 = [];
  const riskTop3 = [];

  for (const r of results) {
    const comment = r.matchResultComment ?? r.matchResultTitle;
    if (r.cardStatus === 'STRENGTH') {
      strengthTop3.push({ matchResultId: r.id, comment });
    } else if (r.cardStatus === 'GAP') {
      gapTop3.push({ matchResultId: r.id, comment, isRequired: !!r.isRequired });
    } else if (r.cardStatus === 'RISK') {
      riskTop3.push({ matchResultId: r.id, comment });
    }
  }

  const sourceFileUrl =
    results.length > 0
      ? results[0].fileUrl   // ✅ match_result에 저장된 fileUrl 사용
      : null;

  return {
    matchId: latest.id,
    matchPercent: latest.matchPercent,
    createdAt: latest.createdAt,
    sourceFileUrl,
    strengthTop3: strengthTop3.slice(0, 3),
    gapTop3: gapTop3.slice(0, 3),
    riskTop3: riskTop3.slice(0, 3),
    canCreateChecklist: computeCanCreateChecklist(gapTop3),
  };
};