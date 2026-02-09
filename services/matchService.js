// services/matchService.js
const { sequelize, job_cards, match_percent, match_result } = require('../models');
const checklistService = require('./checklistService');

/**
 * ✅ 실제 AI 연동 시 여기만 교체하면 됨
 */
async function callAIForMatch({ jobCard, resumeFileUrl }) {
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

/**
 * match_result 저장 rows 생성
 * - matchResultTitle은 NOT NULL이라 title 항상 채움
 */
function buildMatchResultRows({ userId, matchId, fileUrl, ai }) {
  const rows = [];

  const pushItems = (items, cardStatus) => {
    (items || []).slice(0, 3).forEach((it, idx) => {
      const comment = String(it.comment || '').trim();
      const title = comment ? comment.slice(0, 100) : `${cardStatus} ${idx + 1}`;

      rows.push({
        userId,
        matchId,
        fileUrl,
        cardStatus, // STRENGTH | GAP | RISK
        matchResultTitle: title,
        matchResultComment: comment || null,
        isRequired: cardStatus === 'GAP' ? Boolean(it.isRequired) : false,
      });
    });
  };

  pushItems(ai.strengthTop3, 'STRENGTH');
  pushItems(ai.gapTop3, 'GAP');
  pushItems(ai.riskTop3, 'RISK');

  return rows;
}

// (이미 있는 함수들: toTop3Response 등 재사용)
function toTop3Response(matchResults) {
  const strengthTop3 = [];
  const gapTop3 = [];
  const riskTop3 = [];

  for (const r of matchResults) {
    const comment = r.matchResultComment ?? r.matchResultTitle;

    if (r.cardStatus === 'STRENGTH') {
      strengthTop3.push({ matchResultId: r.id, comment });
    } else if (r.cardStatus === 'GAP') {
      gapTop3.push({ matchResultId: r.id, comment, isRequired: Boolean(r.isRequired) });
    } else if (r.cardStatus === 'RISK') {
      riskTop3.push({ matchResultId: r.id, comment });
    }
  }

  return {
    strengthTop3: strengthTop3.slice(0, 3),
    gapTop3: gapTop3.slice(0, 3),
    riskTop3: riskTop3.slice(0, 3),
  };
}


async function createMatchAndSave({ userId, cardId, fileUrl }) {
  const result = await sequelize.transaction(async (t) => {
  
    // 1) 카드 존재 확인
    const jobCard = await job_cards.findByPk(cardId, { transaction: t });
    if (!jobCard) {
      const err = new Error('Job card not found');
      err.status = 404;
      err.code = 'CARD-404';
      throw err;
    }

    // 2) 소유자 검증 (원하면 제거 가능)
    if (Number(jobCard.userId) !== Number(userId)) {
      const err = new Error('Forbidden: card owner mismatch');
      err.status = 403;
      err.code = 'AUTH-403';
      throw err;
    }

    // 3) AI 호출
    const ai = await callAIForMatch({ jobCard, resumeFileUrl: fileUrl });

    // 4) match_percent 저장
    const mp = await match_percent.create(
      { cardId, matchPercent: ai.matchPercent },
      { transaction: t }
    );

    // 5) match_result 저장
    const rows = buildMatchResultRows({
      userId,
      matchId: mp.id,
      fileUrl, // sourceFileUrl
      ai,
    });

    if (rows.length > 0) {
      await match_result.bulkCreate(rows, { transaction: t });
    }

    // 6) 방금 생성한 match_result 다시 조회 (id 필요)
    const createdResults = await match_result.findAll({
      where: { matchId: mp.id },
      order: [['id', 'ASC']],
      transaction: t,
    });

    const top3 = toTop3Response(createdResults);

    // 7) canCreateChecklist
    const canCreateChecklist = top3.gapTop3.some((g) => g.isRequired === true);

    // ✅ 최종 응답
    return {
      matchId: mp.id,
      matchPercent: mp.matchPercent,
      createdAt: mp.createdAt,
      sourceFileUrl: fileUrl,
      ...top3,
      canCreateChecklist,
    };
  });

  // ✅ 트랜잭션 밖에서 체크리스트 생성(시중 AI 호출 포함)
  if (result.canCreateChecklist) {
    await checklistService.generateChecklistsForMatch(result.matchId, { reset: true });
  }

  return result;
}


async function getLatestMatch({ userId, cardId }) {
  return await sequelize.transaction(async (t) => {
    // 1) 카드 존재 확인
    const jobCard = await job_cards.findByPk(cardId, { transaction: t });
    if (!jobCard) {
      const err = new Error('Job card not found');
      err.status = 404;
      err.code = 'CARD-404';
      throw err;
    }

    // 2) 소유자 검증 (POST랑 정책 맞춤)
    if (Number(jobCard.userId) !== Number(userId)) {
      const err = new Error('Forbidden: card owner mismatch');
      err.status = 403;
      err.code = 'AUTH-403';
      throw err;
    }

    // 3) 최신 match_percent 조회 (createdAt 내림차순)
    const latest = await match_percent.findOne({
      where: { cardId },
      order: [['createdAt', 'DESC']],
      transaction: t,
    });

    if (!latest) {
      const err = new Error('Match not found');
      err.status = 404;
      err.code = 'MATCH-404';
      throw err;
    }

    // 4) 해당 matchId의 match_result 조회
    const results = await match_result.findAll({
      where: { matchId: latest.id },
      order: [['id', 'ASC']],
      transaction: t,
    });

    const top3 = toTop3Response(results);
    const canCreateChecklist = top3.gapTop3.some((g) => g.isRequired === true);

    // 5) 응답 (POST랑 동일 포맷)
    return {
      matchId: latest.id,
      matchPercent: latest.matchPercent,
      createdAt: latest.createdAt,
      // sourceFileUrl은 match_percent에 없어서, match_result 첫 row의 fileUrl을 사용
      sourceFileUrl: results[0]?.fileUrl ?? null,
      ...top3,
      canCreateChecklist,
    };
  });
}

module.exports = {
  createMatchAndSave,
  getLatestMatch,
};
