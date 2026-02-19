const job_cards = require('../models/job_cards/job_cards');
const canvas_items = require('../models/job_cards/canvas_items');

exports.getCanvasItems = async (userId) => {
  const items = await findItemsByUserId(userId);

  const result = [];
  for(const item of items) {
      console.log('item.id:', item.id);

      const [canvasRows] = await canvas_items.sequelize.query(
        `SELECT canvas_x, canvas_y FROM canvas_items WHERE cardId = ${item.id}`
      );

      result.push({ 
        cardId: item.id,
        canvasX: canvasRows[0]?.canvas_x || 0,
        canvasY: canvasRows[0]?.canvas_y || 0,
        cardContent: item ? {
              jobPostId: item.jobPostId,
              deadlineAt: item.deadlineAt,
              jobTitle: item.jobTitle,
              companyName: item.companyName,
              employmentType: item.employmentType,
              roleText: item.roleText,
              necessaryStack: item.necessaryStack,
              isAnalyzed: item.isAnalyzed
            }
          : null,
      });
  }
  return result;
};
exports.setCanvasItems = async (userId, cardId, x, y) => {
  const [card] = await job_cards.sequelize.query(
    `SELECT * FROM job_cards WHERE id = ${cardId} AND userId = ${userId}`
  );
  if (!card) {
    return { success: false, message: '카드를 찾을 수 없습니다.' };
  }
  
  // 좌표 업데이트
  await canvas_items.sequelize.query(
    `UPDATE canvas_items SET canvas_x = ${x}, canvas_y = ${y} WHERE cardId = ${cardId}`
  );

  return { success: true, cardId };
};

async function findItemsByUserId(userId) {
  return await job_cards.findAll({
    where: {
      userId: userId
    }
  });
}
