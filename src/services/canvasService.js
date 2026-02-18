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

exports.getSortedCanvasItemsbyDeadline = async (userId) => {
  // 모든 canvas_items 조회
  const items = await CanvasItem.findAll({
    where: { userId }
  });

  const today = new Date();
  console.log('Today:', today.toISOString());

  // 각 canvas_item에 해당하는 job_card 내용 합치기
  const processed = items.map((item) => {
    const deadline = new Date(item.deadlineAt);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      cardId: item.cardId,
      daysLeft: diffDays < 0 ? -1 : diffDays
    };
  });

  const groups = {};
  processed.forEach(card => {
    const key = card.daysLeft < 0 ? 'expired' : card.daysLeft;
    if(!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(card.cardId);
  })

  const sortedKeys = Object.keys(groups)
    .filter(key => key !== 'expired')
    .map(k => parseInt(k, 10))
    .sort((a, b) => a - b);

  const result = [];

  sortedKeys.forEach((days, index) => {
    result.push({
      priorityLevel: index + 1,
      daysLeft: days,
      cardIds: groups[days]
    });
  });

  if(groups.expired && groups.expired.length > 0) {
    result.push({
      priorityLevel: sortedKeys.length + 1,
      daysLeft: null,
      cardIds: groups.expired
    });
  }

  return result;
}