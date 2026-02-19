const job_cards = require('../models/job_cards/job_cards');
const canvas_items = require('../models/job_cards/canvas_items');
const match_percent = require('../models/matching/match_percent');

exports.getCanvasItems = async (userId) => {
  const items = await findItemsByUserId(userId);

  const result = [];
  for(const item of items) {
      console.log('item.id:', item.id);

      const [canvasRows] = await canvas_items.sequelize.query(
        `SELECT canvas_x, canvas_y FROM canvas_items WHERE cardId = ${item.id}`
      );

      const [matchPercentRows] = await match_percent.sequelize.query(
        `SELECT matchPercent FROM match_percent WHERE cardId = ${item.id}`
      );

      if(matchPercentRows.length > 0) {
        item.dataValues.matchPercent = matchPercentRows[0].matchPercent;
      }


      match_percent
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
              isAnalyzed: item.dataValues.matchPercent !== undefined ? item.dataValues.matchPercent > 0 : false
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

  return {
    success: true, 
    message: '캔버스 카드 위치가 성공적으로 업데이트되었습니다.',
    data: {
      cardId,
      x: x,
      y: y
    }
  };
};

async function findItemsByUserId(userId) {
  return await job_cards.findAll({
    where: {
      userId: userId
    }
  });
}
