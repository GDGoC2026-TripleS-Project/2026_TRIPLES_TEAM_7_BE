const db = require('../models');
const { generateChecklists } = require('./geminiService'); 

// 사용자의 모든 GAP 체크리스트 조회 (DB 기반)
async function getAllGapChecklistsByUser(userId) {
  const gapResults = await db.match_result.findAll({
    where: { userId, cardStatus: 'GAP' },
    order: [['matchId', 'DESC'], ['id', 'ASC']],
  });

  if (gapResults.length === 0) return [];

  const matchResultIds = gapResults.map(r => r.id);
  const matchIds = [...new Set(gapResults.map(r => r.matchId))];

  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: matchResultIds },
    order: [['matchResultId', 'ASC'], ['id', 'ASC']],
  });

  const matches = await db.match_percent.findAll({
    where: { id: matchIds },
    attributes: ['id', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });

  const createdAtByMatchId = new Map(matches.map(m => [m.id, m.createdAt]));
  const checklistByResultId = new Map();
  for (const c of checklists) {
    if (!checklistByResultId.has(c.matchResultId)) checklistByResultId.set(c.matchResultId, []);
    checklistByResultId.get(c.matchResultId).push({
      checklistId: c.id,
      checkListText: c.checkListText,
      isButtonActive: Boolean(c.isButtonActive),
    });
  }

  const resultByMatchId = new Map();
  for (const r of gapResults) {
    if (!resultByMatchId.has(r.matchId)) {
      resultByMatchId.set(r.matchId, {
        matchId: r.matchId,
        createdAt: createdAtByMatchId.get(r.matchId) ?? null,
        gapResults: [],
      });
    }

    resultByMatchId.get(r.matchId).gapResults.push({
      matchResultId: r.id,
      cardStatus: r.cardStatus,
      comment: r.matchResultComment ?? r.matchResultTitle,
      isRequired: Boolean(r.isRequired),
      checklists: checklistByResultId.get(r.id) || [],
    });
  }

  return Array.from(resultByMatchId.values()).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

// 특정 매치의 체크리스트 상세 조회 (DB 기반)
async function getMatchChecklists(matchId) {
  const match = await db.match_percent.findByPk(matchId);
  if (!match) {
    return { isSuccess: false, code: 'MATCH-404', message: 'match not found' };
  }

  const results = await db.match_result.findAll({
    where: { matchId },
    order: [['id', 'ASC']],
  });

  const gapResultIds = results.filter(r => r.cardStatus === 'GAP').map(r => r.id);
  let checklists = [];
  if (gapResultIds.length > 0) {
    checklists = await db.improve_checklist.findAll({
      where: { matchResultId: gapResultIds },
      order: [['matchResultId', 'ASC'], ['id', 'ASC']],
    });
  }

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
      return { ...base, isRequired: Boolean(r.isRequired), checklists: map.get(r.id) || [] };
    }
    return base;
  });

  return {
    isSuccess: true,
    code: 'SUCCESS-200',
    message: 'OK',
    data: { matchId, createdAt: match.createdAt, matchResults },
  };
}

// ✅ [중요] Gemini 연동 체크리스트 생성 함수
async function generateChecklistsForMatch(matchId, { reset = false } = {}) {
  try {
    const gapResults = await db.match_result.findAll({
      where: { matchId, cardStatus: 'GAP' },
      order: [['id', 'ASC']],
      limit: 3
    });

    if (gapResults.length === 0) return { isSuccess: true, message: 'no gap found' };

    // Gemini 호출용 데이터 준비
    const aiInputs = gapResults.map(r => ({
      id: r.id,
      comment: r.matchResultComment ?? r.matchResultTitle
    }));

    // AI 서비스 호출 (GAP당 3개, 총 9개 생성)
    const aiResponse = await generateChecklists(aiInputs);

    if (reset) {
      await db.improve_checklist.destroy({
        where: { matchResultId: gapResults.map(r => r.id) }
      });
    }

    const rowsToInsert = [];
    aiResponse.results.forEach(item => {
      item.tasks.forEach(taskText => {
        rowsToInsert.push({
          matchResultId: item.matchResultId,
          checkListText: taskText,
          isButtonActive: false
        });
      });
    });

    await db.improve_checklist.bulkCreate(rowsToInsert);
    return { isSuccess: true, code: 'SUCCESS-201', data: { created: rowsToInsert.length } };
  } catch (error) {
    console.error("AI 체크리스트 생성 실패:", error);
    throw error;
  }
}

// 체크리스트 토글 로직 (DB 기반)
async function toggleChecklist(checklistId, userId) {
  const checklist = await db.improve_checklist.findByPk(checklistId);
  if (!checklist) return { isSuccess: false, code: 'CHECKLIST-404', message: 'Not found' };

  const mr = await db.match_result.findByPk(checklist.matchResultId);
  if (!mr || Number(mr.userId) !== Number(userId)) {
    return { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' };
  }

  const nextValue = !Boolean(checklist.isButtonActive);
  await checklist.update({ isButtonActive: nextValue });

  return { isSuccess: true, code: 'SUCCESS-200', data: { checklistId: checklist.id, isButtonActive: nextValue } };
}

// 팝업 트리거 체크 (DB 기반)
async function getResumePopupTrigger(matchId, userId) {
  const gapResults = await db.match_result.findAll({
    where: { matchId, userId, cardStatus: 'GAP' },
    attributes: ['id']
  });

  if (gapResults.length === 0) return { matchId, shouldShowPopup: false };

  const checklists = await db.improve_checklist.findAll({
    where: { matchResultId: gapResults.map(r => r.id) },
    attributes: ['isButtonActive']
  });

  const total = checklists.length;
  const completed = checklists.filter(c => Boolean(c.isButtonActive)).length;
  return { matchId, totalChecklists: total, completedChecklists: completed, shouldShowPopup: total > 0 && completed === total };
}

module.exports = {
  getAllGapChecklistsByUser,
  getMatchChecklists,
  toggleChecklist,
  getResumePopupTrigger,
  generateChecklistsForMatch,
};