// services/checklistService.js
const db = require('../models');
const { Op } = require('sequelize');
const { generateChecklists } = require('./geminiService');

/**
 * ✅ 정책
 * - seenAt/isNew는 match_percent 단위(=matchId)로만 관리
 * - match_result / improve_checklist 단위 seenAt/isNew는 아예 내려주지 않음
 */

/**
 * 사용자의 모든 GAP 체크리스트 조회 (match 단위 그룹)
 * 반환:
 * [
 *   {
 *     matchId,
 *     createdAt,
 *     seenAt,
 *     isNew,
 *     gapResults: [
 *       { matchResultId, cardStatus:'GAP', comment, isRequired, checklists:[...] }
 *     ]
 *   }
 * ]
 */
async function getAllGapChecklistsByUser(userId) {
  const gapResults = await db.match_result.findAll({
    where: { userId, cardStatus: 'GAP' },
    order: [['matchId', 'DESC'], ['id', 'ASC']],
  });
  if (gapResults.length === 0) return [];

  const matchResultIds = gapResults.map(r => r.id);
  const matchIds = [...new Set(gapResults.map(r => r.matchId))];

  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: { [Op.in]: matchResultIds } },
    order: [['matchResultId', 'ASC'], ['id', 'ASC']],
  });

  // match_percent 메타(createdAt, seenAt)
  const matches = await db.match_percent.findAll({
    where: { id: { [Op.in]: matchIds } },
    attributes: ['id', 'createdAt', 'seenAt'],
    order: [['createdAt', 'DESC']],
  });

  const matchMetaById = new Map(
    matches.map(m => [Number(m.id), { createdAt: m.createdAt ?? null, seenAt: m.seenAt ?? null }])
  );

  // checklist를 matchResultId로 묶기
  const checklistByResultId = new Map();
  for (const c of checklists) {
    if (!checklistByResultId.has(c.matchResultId)) checklistByResultId.set(c.matchResultId, []);
    checklistByResultId.get(c.matchResultId).push({
      checklistId: c.id,
      checkListText: c.checkListText,
      isButtonActive: Boolean(c.isButtonActive),
    });
  }

  // matchId 단위로 묶기
  const resultByMatchId = new Map();

  for (const r of gapResults) {
    const meta = matchMetaById.get(Number(r.matchId)) ?? { createdAt: null, seenAt: null };

    if (!resultByMatchId.has(r.matchId)) {
      resultByMatchId.set(r.matchId, {
        matchId: r.matchId,
        createdAt: meta.createdAt,
        seenAt: meta.seenAt,
        isNew: !meta.seenAt,
        gapResults: [],
      });
    }

    resultByMatchId.get(r.matchId).gapResults.push({
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
      isRequired: Boolean(r.isRequired),
      keywords: Array.isArray(r.gapKeywords) ? r.gapKeywords : [],
      checklists: checklistByResultId.get(r.id) || [],
    });
  }

  return Array.from(resultByMatchId.values()).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

/**
 * 특정 매치(matchId)의 체크리스트 상세 조회
 * - seenAt/isNew는 match 단위로만 반환
 * - GAP/checklist 단위 seenAt/isNew 없음
 */
async function getMatchChecklists(matchId, userId) {
  const match = await db.match_percent.findByPk(matchId);
  if (!match) return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };

  // ✅ 소유권 체크: match_percent.cardId -> job_cards.userId
  const card = await db.job_cards.findOne({ where: { id: match.cardId, userId } });
  if (!card) return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };

  const results = await db.match_result.findAll({
    where: { matchId, userId },
    order: [['id', 'ASC']],
  });

  const gapResultIds = results.filter(r => r.cardStatus === 'GAP').map(r => r.id);

  const checklists = gapResultIds.length === 0
    ? []
    : await db.improve_checklist.findAll({
        where: { matchResultId: { [Op.in]: gapResultIds } },
        order: [['matchResultId', 'ASC'], ['id', 'ASC']],
      });

  // checklist를 matchResultId로 묶기
  const map = new Map();
  for (const c of checklists) {
    if (!map.has(c.matchResultId)) map.set(c.matchResultId, []);
    map.get(c.matchResultId).push({
      checklistId: c.id,
      checkListText: c.checkListText,
      isButtonActive: Boolean(c.isButtonActive),
    });
  }

  const matchResults = results.map(r => {
    const base = {
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
    };

    if (r.cardStatus === 'GAP') {
      return {
        ...base,
        isRequired: Boolean(r.isRequired),
        keywords: Array.isArray(r.gapKeywords) ? r.gapKeywords : [],
        checklists: map.get(r.id) || [],
      };
    }
    return base;
  });

  const seenAt = match.seenAt ?? null;

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: {
      matchId,
      createdAt: match.createdAt,
      seenAt,
      isNew: !seenAt,
      matchResults,
    },
  };
}

/**
 * ✅ 매치 1개(matchId)에 대해 GAP 3개 체크리스트 9개 생성
 * - seenAt 관련 없음
 */
async function generateChecklistsForMatch(matchId, userId, { reset = false } = {}) {
  const match = await db.match_percent.findByPk(matchId);
  if (!match) return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };

  const card = await db.job_cards.findOne({ where: { id: match.cardId, userId } });
  if (!card) return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };

  const gapResults = await db.match_result.findAll({
    where: { matchId, userId, cardStatus: 'GAP' },
    order: [['id', 'ASC']],
    limit: 3,
  });

  if (gapResults.length === 0) return { isSuccess: true, code: 'SUCCESS-200', data: { created: 0 } };

  const aiInputs = gapResults.map(r => ({
    id: r.id,
    comment: r.matchResultComment ?? r.matchResultTitle,
  }));

  const aiResponse = await generateChecklists(aiInputs);
  console.log('[gemini checklist raw]', JSON.stringify(aiResponse));

  const results = Array.isArray(aiResponse?.results) ? aiResponse.results : [];
  if (results.length !== aiInputs.length) {
    throw new Error(`AI response invalid: results length ${results.length}, expected ${aiInputs.length}`);
  }

  const normalized = results.map(item => ({
    matchResultId: Number(item.matchResultId ?? item.id),
    keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 1) : [], // ✅ 1개로 자르기
    tasks: Array.isArray(item.tasks) ? item.tasks : [],
  }));

  const validIdSet = new Set(gapResults.map(r => Number(r.id)));

  for (const item of normalized) {
    if (!Number.isInteger(item.matchResultId) || !validIdSet.has(item.matchResultId)) {
      throw new Error(`AI response invalid matchResultId: ${item.matchResultId}`);
    }
    if (item.tasks.length !== 3) {
      throw new Error(`AI response tasks length must be 3 for ${item.matchResultId}`);
    }
    if (item.keywords.length !== 1) {
      throw new Error(`AI response keywords length must be 1 for ${item.matchResultId}`);
    }
  }

  // ✅ GAP 키워드 저장 (match_result 테이블에)
  await Promise.all(
    normalized.map(item =>
      db.match_result.update(
        { gapKeywords: item.keywords },
        { where: { id: item.matchResultId, userId, cardStatus: 'GAP' } }
      )
    )
  );

  if (reset) {
    await db.improve_checklist.destroy({
      where: { matchResultId: { [Op.in]: [...validIdSet] } },
    });
  }

  const rowsToInsert = [];
  for (const item of normalized) {
    for (const taskText of item.tasks) {
      rowsToInsert.push({
        matchResultId: item.matchResultId,
        checkListText: taskText,
        isButtonActive: false,
      });
    }
  }

  await db.improve_checklist.bulkCreate(rowsToInsert);
  return { isSuccess: true, code: 'SUCCESS-201', data: { created: rowsToInsert.length } };
}

/**
 * 체크리스트 완료 여부 토글
 */
async function toggleChecklist(checklistId, userId) {
  const checklist = await db.improve_checklist.findByPk(checklistId);
  if (!checklist) return { isSuccess: false, code: 'CHECKLIST-404', message: 'Not found' };

  const mr = await db.match_result.findByPk(checklist.matchResultId);
  if (!mr || Number(mr.userId) !== Number(userId)) {
    return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };
  }

  const nextValue = !Boolean(checklist.isButtonActive);
  await checklist.update({ isButtonActive: nextValue });

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: { checklistId: checklist.id, isButtonActive: nextValue },
  };
}

/**
 * 팝업 트리거 (전체 체크리스트 완료 여부)
 */
async function getResumePopupTrigger(matchId, userId) {
  const match = await db.match_percent.findByPk(matchId);
  if (!match) return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };

  const card = await db.job_cards.findOne({ where: { id: match.cardId, userId } });
  if (!card) return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };

  const gapResults = await db.match_result.findAll({
    where: { matchId, userId, cardStatus: 'GAP' },
    attributes: ['id'],
  });

  if (gapResults.length === 0) {
    return {
      isSuccess: true,
      code: 'SUCCESS-200',
      message: 'OK',
      data: { matchId, totalChecklists: 0, completedChecklists: 0, shouldShowPopup: false },
    };
  }

  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: { [Op.in]: gapResults.map(r => r.id) } },
    attributes: ['isButtonActive'],
  });

  const total = checklists.length;
  const completed = checklists.filter(c => Boolean(c.isButtonActive)).length;

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: {
      matchId,
      totalChecklists: total,
      completedChecklists: completed,
      shouldShowPopup: total > 0 && completed === total,
    },
  };
}

/**
 * ✅ 노란점 제거: matchId의 match_percent.seenAt 갱신
 * - updated: 1(이번에 갱신) / 0(이미 읽음)
 */
async function markMatchChecklistsSeen(matchId, userId) {
  const match = await db.match_percent.findByPk(matchId);
  if (!match) return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };

  const card = await db.job_cards.findOne({ where: { id: match.cardId, userId } });
  if (!card) return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };

  if (match.seenAt) {
    return { isSuccess: true, code: 'SUCCESS-200', message: 'OK', data: { updated: 0 } };
  }

  await match.update({ seenAt: new Date() });
  return { isSuccess: true, code: 'SUCCESS-200', message: 'OK', data: { updated: 1 } };
}

/**
 * cardSummary 포맷 통일
 */
// services/checklistService.js

function buildCardSummary({ matchRow, cardRow }) {
  return {
    cardId: matchRow?.cardId ?? null,
    jobTitle: cardRow?.jobTitle ?? null,
    companyName: cardRow?.companyName ?? null,
    employmentType: cardRow?.employmentType ?? null,
    matchPercent: matchRow?.matchPercent ?? null,
    deadlineAt: cardRow?.deadlineAt ?? null,
  };
}

function toTime(v) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

async function getAllGapChecklistsByUserWithCardSummary(userId, { sort = 'recent', order = '' } = {}) {
  const gapResults = await db.match_result.findAll({
    where: { userId, cardStatus: 'GAP' },
    order: [['matchId', 'DESC'], ['id', 'ASC']],
  });
  if (gapResults.length === 0) return [];

  const matchResultIds = gapResults.map(r => r.id);
  const matchIds = [...new Set(gapResults.map(r => r.matchId))];

  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: { [Op.in]: matchResultIds } },
    order: [['matchResultId', 'ASC'], ['id', 'ASC']],
  });

  const matches = await db.match_percent.findAll({
    where: { id: { [Op.in]: matchIds } },
    attributes: ['id', 'cardId', 'matchPercent', 'createdAt', 'seenAt'],
    order: [['createdAt', 'DESC']],
  });

  const matchById = new Map(matches.map(m => [Number(m.id), m]));
  const cardIds = [...new Set(matches.map(m => Number(m.cardId)).filter(Boolean))];

  // ✅ job_cards에서 공고요약 + jobPostId까지 가져오기(가정)
  const cards = cardIds.length === 0
    ? []
    : await db.job_cards.findAll({
        where: { id: { [Op.in]: cardIds }, userId },
        attributes: ['id', 'jobTitle', 'companyName', 'employmentType', 'deadlineAt']
      });

  const cardById = new Map(cards.map(c => [Number(c.id), c]));

  // checklist를 matchResultId로 묶기
  const checklistByResultId = new Map();
  for (const c of checklists) {
    if (!checklistByResultId.has(c.matchResultId)) checklistByResultId.set(c.matchResultId, []);
    checklistByResultId.get(c.matchResultId).push({
      checklistId: c.id,
      checkListText: c.checkListText,
      isButtonActive: Boolean(c.isButtonActive),
    });
  }

  // matchId 단위로 묶기
  const resultByMatchId = new Map();

  for (const r of gapResults) {
    const matchRow = matchById.get(Number(r.matchId)) || null;
    const cardRow = matchRow ? (cardById.get(Number(matchRow.cardId)) || null) : null;

    if (!resultByMatchId.has(r.matchId)) {
      const seenAt = matchRow?.seenAt ?? null;
      resultByMatchId.set(r.matchId, {
        matchId: r.matchId,
        createdAt: matchRow?.createdAt ?? null,
        seenAt,
        isNew: !seenAt,
        totalChecklists: 0,
        completedChecklists: 0,
        cardSummary: buildCardSummary({ matchRow, cardRow }),
        gapResults: [],
      });
    }

    const group = resultByMatchId.get(r.matchId);
    const list = checklistByResultId.get(r.id) || [];
    group.totalChecklists += list.length;
    group.completedChecklists += list.filter(x => x.isButtonActive).length;

    group.gapResults.push({
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
      isRequired: Boolean(r.isRequired),
      keywords: Array.isArray(r.gapKeywords) ? r.gapKeywords : [],
      checklists: list,
    });
  }

  const rows = Array.from(resultByMatchId.values());

  // ✅ 정렬
  const normalizedSort = (sort || 'recent').toLowerCase();
  const normalizedOrder = (order || '').toLowerCase();

  if (normalizedSort === 'deadline') {
    // 기본: 마감 가까운 순(asc). deadline 없는 건 맨 뒤.
    const dir = normalizedOrder === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const ta = toTime(a.cardSummary?.deadlineAt);
      const tb = toTime(b.cardSummary?.deadlineAt);

      // deadline 없는 경우 뒤로
      const aHas = Boolean(a.cardSummary?.deadlineAt);
      const bHas = Boolean(b.cardSummary?.deadlineAt);
      if (aHas !== bHas) return aHas ? -1 : 1;

      if (ta !== tb) return (ta - tb) * dir;

      // tie-breaker: 최근순
      return toTime(b.createdAt) - toTime(a.createdAt);
    });
  } else if (normalizedSort === 'incomplete') {
    // 기본: 미완료(남은 개수) 많은 순 desc
    const dir = normalizedOrder === 'asc' ? 1 : -1; // asc면 남은 적은 순
    rows.sort((a, b) => {
      const ra = (a.totalChecklists || 0) - (a.completedChecklists || 0);
      const rb = (b.totalChecklists || 0) - (b.completedChecklists || 0);

      if (ra !== rb) return (ra - rb) * dir;

      // tie-breaker: 최근순
      return toTime(b.createdAt) - toTime(a.createdAt);
    });
  } else {
    const dir = normalizedOrder === 'asc' ? 1 : -1; // 기본 desc
    rows.sort((a, b) => (toTime(a.createdAt) - toTime(b.createdAt)) * dir);
  }

  return rows;
}

// ✅ matchId 1개에 대한 all-with-card "단일 그룹" 반환
async function getGapChecklistsByMatchIdWithCardSummary(matchId, userId) {
  // 1) match 존재 + 소유권 체크
  const matchRow = await db.match_percent.findByPk(matchId, {
    attributes: ['id', 'cardId', 'matchPercent', 'createdAt', 'seenAt'],
  });
  if (!matchRow) return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };

  const cardRow = await db.job_cards.findOne({
    where: { id: matchRow.cardId, userId },
    attributes: ['id', 'jobTitle', 'companyName', 'employmentType', 'deadlineAt'],
  });
  if (!cardRow) return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };

  // 2) 해당 matchId의 GAP 결과만
  const gapResults = await db.match_result.findAll({
    where: { matchId, userId, cardStatus: 'GAP' },
    order: [['id', 'ASC']],
  });
  if (gapResults.length === 0) {
    // 정책 선택:
    // - 404로 할지
    // - 200 + 빈 gapResults로 할지
    return { isSuccess: false, code: 'GAP-404', message: 'gap results not found' };
  }

  const gapResultIds = gapResults.map(r => r.id);

  // 3) checklist들
  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: { [Op.in]: gapResultIds } },
    order: [['matchResultId', 'ASC'], ['id', 'ASC']],
  });

  const checklistByResultId = new Map();
  for (const c of checklists) {
    if (!checklistByResultId.has(c.matchResultId)) checklistByResultId.set(c.matchResultId, []);
    checklistByResultId.get(c.matchResultId).push({
      checklistId: c.id,
      checkListText: c.checkListText,
      isButtonActive: Boolean(c.isButtonActive),
    });
  }

  // 4) 응답 조립 (정렬 없음: DB order 그대로)
  const seenAt = matchRow.seenAt ?? null;

  let totalChecklists = 0;
  let completedChecklists = 0;

  const gapResultsPayload = gapResults.map(r => {
    const list = checklistByResultId.get(r.id) || [];
    totalChecklists += list.length;
    completedChecklists += list.filter(x => x.isButtonActive).length;

    return {
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
      isRequired: Boolean(r.isRequired),
      keywords: Array.isArray(r.gapKeywords) ? r.gapKeywords : [],
      checklists: list,
    };
  });

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: {
      matchId: matchRow.id,
      createdAt: matchRow.createdAt ?? null,
      seenAt,
      isNew: !seenAt,
      totalChecklists,
      completedChecklists,
      cardSummary: {
        cardId: matchRow.cardId ?? null,
        jobTitle: cardRow.jobTitle ?? null,
        companyName: cardRow.companyName ?? null,
        employmentType: cardRow.employmentType ?? null,
        matchPercent: matchRow.matchPercent ?? null,
        deadlineAt: cardRow.deadlineAt ?? null,
      },
      gapResults: gapResultsPayload,
    },
  };
}




module.exports = {
  getAllGapChecklistsByUser,
  getMatchChecklists,
  generateChecklistsForMatch,
  toggleChecklist,
  getResumePopupTrigger,
  markMatchChecklistsSeen,
  getAllGapChecklistsByUserWithCardSummary,
  getGapChecklistsByMatchIdWithCardSummary,
};