const canvasService = require('../services/canvasService');

exports.getCanvasItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const canvasItems = await canvasService.getCanvasItems(userId);

    res.status(200).json(canvasItems);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '캔버스 카드 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// exports.getSortedCanvasItems = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const sort = req.query.sort;
//     let sortedCanvasItems;

//     const result = User.findByPk(userId, {
//             // 요청하신 3가지 정보만 선택하여 리턴
//             attributes: ['address', 'resumeUrl']
//         });
//         if(job_cards.findByUserId(userId) === null) {
//           return res.status(204).json({
//             success: true,
//             message: '필터링 할 카드가 없습니다.',
//             data: []
//           });
//         }

//     switch (sort) {
//       case 'deadline':
//          sortedCanvasItems = await canvasService.getSortedCanvasItemsbyDeadline(userId);
//         break;
//       case 'salary':
//         sortedCanvasItems = await canvasService.getSortedCanvasItemsbySalary(userId);
//         break;
//       case 'distance':
//         sortedCanvasItems = await canvasService.getSortedCanvasItemsbyDistance(userId);
//         break;
//       case 'matchedPercent':
//         sortedCanvasItems = await canvasService.getSortedCanvasItemsbyMatchedPercent(userId);
//         break;
//     }       

//     res.status(200).json(sortedCanvasItems);

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       sort: req.query.sort,
//       error: error.message
//     });
//   }
// };