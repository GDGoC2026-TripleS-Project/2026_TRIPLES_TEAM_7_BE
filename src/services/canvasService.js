const JobCard = require('../models/job_cards/job_cards');
const CanvasItem = require('../models/job_cards/canvas_items');

exports.getCanvasItems = async (userId) => {
  // 모든 canvas_items 조회
  const items = await CanvasItem.findAll({
    where: {
      userId: userId
    }
  });

  // 각 canvas_item에 해당하는 job_card 내용 합치기
  const result = await Promise.all(
    items.map(async (item) => {
      const jobCard = await JobCard.findByPk(item.cardId);

      return {
        cardId: item.cardId,
        cardContent: jobCard
          ? {
              jobPostId: jobCard.jobPostId,
              deadlineAt: jobCard.deadlineAt,
              jobTitle: jobCard.jobTitle,
              companyName: jobCard.companyName,
              employmentType: jobCard.employmentType,
              roleText: jobCard.roleText,
              necessaryStack: jobCard.necessaryStack,
              isAnalyzed: jobCard.isAnalyzed
            }
          : null,
        x: item.x,
        y: item.y
      };
    })
  );

  return result;
};
