// services/interviewService.js
const db = require('../models');
const { generateInterviewQuestions } = require('./geminiService');

/**
 * 카드 소유권 체크
 */
async function requireOwnedCard(cardId, userId, t) {
  const card = await db.job_cards.findByPk(cardId, { transaction: t });
  if (!card) return { ok: false, res: { isSuccess: false, code: 'CARD-404', message: 'card not found' } };

  if (Number(card.userId) !== Number(userId)) {
    return { ok: false, res: { isSuccess: false, code: 'AUTH-403', message: 'Forbidden' } };
  }
  return { ok: true, card };
}

/**
 * AI 응답을 안전하게 정규화
 * - 기대 구조:
 *   { items: [ { questionText: "...", keywords: ["k1","k2"] }, ... ] }
 * - 결과: 정확히 3개로 자르고, keywords 2개 보장
 */
function normalizeAiItems(ai) {
  const items = Array.isArray(ai?.items) ? ai.items : [];

  const normalized = items
    .map((it) => {
      const questionText = String(it?.questionText ?? '').trim();

      const keywordsRaw = Array.isArray(it?.keywords) ? it.keywords : [];
      const keywords = keywordsRaw
        .map((k) => String(k ?? '').trim())
        .filter(Boolean)
        .slice(0, 2);

      return { questionText, keywords };
    })
    .filter((it) => it.questionText.length > 0)
    .slice(0, 3);

  return normalized;
}

/**
 * 내부 유틸: 이전 질문 “사라짐” 처리
 * - 요구사항상 화면에서 안 보이면 되므로 isActive=false만으로 충분
 * - 진짜로 DB에서도 "사라짐" 느낌을 원하면 hardDeleteQuestions=true 옵션 사용
 */
async function deactivateActiveSets(cardId, t, { hardDeleteQuestions = true } = {}) {
  const activeSets = await db.interview_question_sets.findAll({
    where: { cardId, isActive: true },
    attributes: ['id'],
    transaction: t,
  });

  const activeSetIds = activeSets.map((s) => s.id);

  // 1) 활성 세트 비활성화
  await db.interview_question_sets.update(
    { isActive: false },
    { where: { cardId, isActive: true }, transaction: t }
  );

  // 2) (선택) 기존 질문 hard delete => 진짜 "사라짐"
  if (hardDeleteQuestions && activeSetIds.length > 0) {
    await db.interview_questions.destroy({
      where: { setId: activeSetIds },
      force: true, // paranoid 무시하고 실제 삭제
      transaction: t,
    });
  }
}

/**
 * 4.1 내 카드 전부 INTERVIEW로 상태 전환
 */
async function setAllCardsToInterview(userId) {
  try {
    const [updatedCount] = await db.job_cards.update(
      { cardStatus: 'INTERVIEW' },
      { where: { userId } }
    );

    return {
      isSuccess: true,
      code: 'SUCCESS-200',
      data: { userId, updatedCount },
    };
  } catch (error) {
    console.error('카드 상태 일괄 전환 실패:', error);
    throw error;
  }
}

/**
 * 4.2 선택한 카드 1개에 대해 AI 질문 3개 생성 (+키워드 2개씩)
 * - reset=true면 기존 질문은 사라짐(비활성화 + hard delete)
 * - DB 전제: interview_questions에 keywords(JSON) 컬럼 존재
 */
async function generateInterviewQuestionsForCard(cardId, userId, { reset = true } = {}) {
  const t = await db.sequelize.transaction();
  try {
    const owned = await requireOwnedCard(cardId, userId, t);
    if (!owned.ok) {
      await t.rollback();
      return owned.res;
    }
    const card = owned.card;

    // 카드가 INTERVIEW가 아니면 충돌로 막기
    if (card.cardStatus !== 'INTERVIEW') {
      await t.rollback();
      return { isSuccess: false, code: 'INVALID_STATE', message: 'card is not INTERVIEW status' };
    }

    // ✅ 무조건 기존 질문 제거
    await deactivateActiveSets(card.id, t, { hardDeleteQuestions: true });


    const aiInput = {
      jobTitle: card.jobTitle,
      companyName: card.companyName,
      roleText: card.roleText,
      necessaryStack: card.necessaryStack,
      preferStack: card.preferStack,
    };

    // ✅ geminiService는 { items: [{questionText, keywords:[k1,k2]} ...] } 를 반환해야 함
    const ai = await generateInterviewQuestions(aiInput);

    const items = normalizeAiItems(ai);

    // ✅ 검증: 3개 + 각 키워드 2개
    if (items.length !== 3 || items.some((it) => it.keywords.length !== 2)) {
      await t.rollback();
      return {
        isSuccess: false,
        code: 'AI-502',
        message: 'AI did not return 3 items with 2 keywords each',
      };
    }

    const set = await db.interview_question_sets.create(
      { cardId: card.id, isActive: true },
      { transaction: t }
    );

    await db.interview_questions.bulkCreate(
      items.map((it, idx) => ({
        setId: set.id,
        questionText: it.questionText,
        keywords: it.keywords, // ✅ 저장
        orderNo: idx + 1,
      })),
      { transaction: t }
    );

    const savedQuestions = await db.interview_questions.findAll({
      where: { setId: set.id },
      order: [['orderNo', 'ASC']],
      transaction: t,
    });

    await t.commit();

    return {
      isSuccess: true,
      code: 'SUCCESS-201',
      data: {
        cardId: card.id,
        setId: set.id,
        generatedAt: set.generatedAt,
        questions: savedQuestions.map((q) => ({
          questionId: q.id,
          orderNo: q.orderNo,
          questionText: q.questionText,
          keywords: Array.isArray(q.keywords) ? q.keywords : [], // ✅ 응답
        })),
      },
    };
  } catch (error) {
    await t.rollback();
    console.error('AI 면접 질문 생성 실패:', error);
    throw error;
  }
}

/**
 * 4.3 활성 질문 조회 (+키워드 포함)
 */
async function getActiveInterviewQuestions(cardId, userId) {
  try {
    const owned = await requireOwnedCard(cardId, userId);
    if (!owned.ok) return owned.res;

    const card = owned.card;

    const set = await db.interview_question_sets.findOne({
      where: { cardId: card.id, isActive: true },
      order: [['generatedAt', 'DESC']],
    });

    if (!set) {
      return {
        isSuccess: true,
        code: 'SUCCESS-200',
        data: { cardId: card.id, setId: null, questions: [] },
      };
    }

    const questions = await db.interview_questions.findAll({
      where: { setId: set.id },
      order: [['orderNo', 'ASC']],
    });

    return {
      isSuccess: true,
      code: 'SUCCESS-200',
      data: {
        cardId: card.id,
        setId: set.id,
        generatedAt: set.generatedAt,
        questions: questions.map((q) => ({
          questionId: q.id,
          orderNo: q.orderNo,
          questionText: q.questionText,
          keywords: Array.isArray(q.keywords) ? q.keywords : [], // ✅ 추가
        })),
      },
    };
  } catch (error) {
    console.error('면접 질문 조회 실패:', error);
    throw error;
  }
}

module.exports = {
  setAllCardsToInterview,
  generateInterviewQuestionsForCard,
  getActiveInterviewQuestions,
};