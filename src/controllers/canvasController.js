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
//     // const sortedCanvasItems = await canvasService.getSortedCanvasItems(userId, sort);

//     res.status(200).json(sort);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       sort: req.query.sort,
//       error: error.message
//     });
//   }
// };