const canvasService = require('../services/canvasService');
const job_cards = require('../models/job_cards/job_cards');

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

exports.setCanvasItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId, x, y } = req.body;

    const canvasItems = await canvasService.setCanvasItems(userId, cardId, x, y);

    res.status(200).json(canvasItems);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '캔버스 카드 설정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

exports.getSortedCanvasItems = async (req, res) => {
  try {
    const userId = 1;
    const sort = req.query.sort;
    let sortedCanvasItems;

    if (!job_cards.findAll({ where: { userId: userId }})) {
      return res.status(500).json({ 
        success: false,
        message: '조회할 카드가 없습니다.',
        error: error.message
      })
    }

    switch (sort) {
      case 'deadline':
         sortedCanvasItems = await canvasService.getSortedCanvasItemsbyDeadline(userId);
        break;
      case 'salary':
        sortedCanvasItems = await canvasService.getSortedCanvasItemsbySalary(userId);
        break;
      case 'distance':
        sortedCanvasItems = await canvasService.getSortedCanvasItemsbyDistance(userId);
        break;
      case 'matchedPercent':
        sortedCanvasItems = await canvasService.getSortedCanvasItemsbyMatchedPercent(userId);
        break;
    }       

    res.status(200).json({
      success: true,
      sort: req.query.sort,
      message: '우선순위별 카드 조회 성공',
      data: sortedCanvasItems
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      sort: req.query.sort,
      error: error.message
    });
  }
};