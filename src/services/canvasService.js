const job_cards = require('../models/job_cards/job_cards');
const canvas_items = require('../models/job_cards/canvas_items');
const match_percent = require('../models/matching/match_percent');
const User = require('../models/users/user');
const dayjs = require('dayjs');
const geolib = require('geolib');

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

exports.getSortedCanvasItemsbyDeadline = async (userId) => {
  const items = await findItemsByUserId(userId);

  console.log('userid: ', userId);

  const sorted = items.sort((a, b) => {
    if (!a.deadlineAt && !b.deadlineAt) return 0;
    if (!a.deadlineAt) return 1;
    if (!b.deadlineAt) return -1;
    return new Date(a.deadlineAt) - new Date(b.deadlineAt);
  });
  
  // 같은 deadlineAt끼리 묶기
  const grouped = {};
  sorted.forEach((item) => {
    const deadline = item.deadlineAt ? dayjs(item.deadlineAt).format('YYYY-MM-DD') : 'null';
    if (!grouped[deadline]) grouped[deadline] = [];
    grouped[deadline].push(item);
  });
  
  // 결과 변환
  const result = Object.entries(grouped).map(([deadline, cards], idx) => {
    return {
      priorityLevel: idx + 1,
      cardIds: cards.map((c) => c.id)
    };
  });
  console.log("result: ", result);
  return result;

};

exports.getSortedCanvasItemsbySalary = async (userId) => {
  const items = await job_cards.findAll({
    where: { userId }, attributes: ['id', 'salaryText']
  });
  
  // salaryText 파싱 함수
  const parseSalary = (text) => {
    if (!text || text.trim() === "") {
      return { priority: 20, minSalary: null };
    }
    if (text.startsWith('연봉')) {
      const match = text.match(/연봉\s*([\d,]+)/);
      if (match) {
        const minSalary = parseInt(match[1].replace(/,/g, ''), 10);
        return { priority: 1, minSalary };
      }
    }
    return { priority: 19, minSalary: null};
  }; // 각 아이템에 우선순위와 최소 연봉 추가
  const withSalary = items.map(item => {
    const { priority, minSalary } = parseSalary(item.salaryText);
    return { id: item.id, salaryText: item.salaryText, priority, minSalary };
  });
  const sorted = withSalary.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // priority 낮은 게 먼저
    }
    else {
      return b.minSalary - a.minSalary; // 최소 연봉 높은 순
    }
  });
  
  const grouped = {};
  sorted.forEach(item => {
    let key;
    if (item.priority === 1) {
      key = item.minSalary?.toString() ?? 'null';
    } else {
      key = `priority-${item.priority}`;
    }
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item.id);
  });
  
  const result = Object.entries(grouped).map(([key, cardIds], idx) => ({
    priorityLevel: idx + 1,
    cardIds
  }));

  return result;
};

exports.getSortedCanvasItemsbyDistance = async (userId) => {
  const user = await User.findOne({
    where: { id: userId },
    attributes: ['addressPoint']
  });

  if (!user || !user.addressPoint) {
    throw new Error('유저 주소 좌표가 없습니다.');
  }

  const [homeX, homeY] = user.addressPoint.coordinates;

  console.log('homeX:', homeX, 'homeY:', homeY);


  if (!user || user.homeX === null || user.homeY === null) {
    throw new Error('유저 집 위치가 없습니다.');
  }
  
  // 유저의 모든 카드 가져오기
  const items = await job_cards.findAll({
    where: { userId },
    attributes: ['id', 'addressPoint']
  });

  // 좌표 추출
  const formattedItems = items.map(item => {
    if (!item.addressPoint) {
      return { id: item.id, companyX: null, companyY: null };
    }
    const [companyX, companyY] = item.addressPoint.coordinates;
    return { id: item.id, companyX, companyY };
  });

  console.log(formattedItems);

  const withDistance = formattedItems.map(item => {
    if (item.companyX === null || item.companyY === null) {
      return { id: item.id, distance: Infinity};
    }
    const distance = geolib.getDistance(
      { latitude: homeY, longitude: homeX },
      { latitude: item.companyY, longitude: item.companyX }
    ); 
    return { id: item.id, distance };
  });

  // 거리 계산 함수 (단순 좌표계 기준)
  withDistance.sort((a, b) => a.distance - b.distance);
  
  // 같은 거리끼리 묶기
  const grouped = {};
  withDistance.forEach((item) => {
    const key = item.distance === Infinity ? 'null' :
    item.distance != null ? item.distance.toFixed(0) : 'null'; // 소수점 정리
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item.id);
  });
  
  // 결과 변환
  const result = Object.entries(grouped).map(([distance, cardIds], idx) => ({
    priorityLevel: idx + 1,
    cardIds
  }));
  console.log("result: ", result);
  return result;
}

exports.getSortedCanvasItemsbyMatchedPercent = async (userId) => {

  const cards = await job_cards.findAll({
    where: { userId },
    attributes: ['id']
  }); 
  
  const withMatch = await Promise.all(
    cards.map(async (card) => {
      const match = await match_percent.findOne({
        where: { cardId: card.id },
        attributes: ['matchPercent']
      });
      
      if (!match) {
        return { id: card.id, matchPercent: null, priority: 20 };
      }
      return { id: card.id, matchPercent: match.matchPercent, priority: 1 };
    })
  ); 
  
  const sorted = withMatch.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    else return b.matchPercent - a.matchPercent; 
  });

   const grouped = {};
   sorted.forEach(item => {
    let key;
    if (item.priority === 1) {
      key = item.matchPercent?.toString() ?? 'null';
    } else {
      key = `priority-${item.priority}`;
    }
  if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item.id);
  });

  const result = Object.entries(grouped).map(([cardIds], idx) => ({
    priorityLevel: idx + 1,
    cardIds
  }));

  return result;
};

async function findItemsByUserId(userId) {
  return await job_cards.findAll({
    where: {
      userId: userId
    }
  });
}

