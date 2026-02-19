const cardService = require('../services/cardService');

exports.analyzeJobPosting = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "url은 필수입니다." });
    }

    const result = await cardService.analyzeJob(url);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI 분석 중 오류 발생" });
  }
};

exports.createCard = async (req, res) => {
  try{
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ isSuccess: false, code: 'CARD-401', message: 'url은 필수입니다.' });
    }

    const userId = req.user.id;
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'token required' });
    }
      
    const result = await cardService.createCard({userId, url});
      
    return res.status(200).json({
      isSuccess: true,
      code: 'SUCCESS-200',
      message: '카드를 성공적으로 생성했습니다.',
      data: result,
    });

  }catch(error){
    console.error(error);
    return res.status(400).json({ isSuccess: false, code: 'CARD-402', message: '카드 생성 중 문제가 발생하였습니다.' });
  }
};

exports.deleteCard = async(req, res) => {
  try{
    const userId = req.user.id;
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'JWT token required' });
    }
    
    const cardId = Number(req.params.cardId);

    if (!cardId) {
      return res.status(400).json({ isSuccess: false, code: 'CARD-403', message: 'cardId는 필수입니다.' });
    }

    const result = await cardService.deleteCard({userId, cardId});

    return res.status(200).json({
      isSuccess: true,
      code: 'SUCCESS-200',
      message: result.message,
      data: result.data
    });
  }catch(error){
    console.error(error);
    return res.status(400).json({ isSuccess: false, code: 'CARD-404', message: '카드 삭제 중 문제가 발생하였습니다.' });
  }
};

exports.getCard = async(req, res) => {
  try{
    const userId = req.user.id;
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'JWT token required' });
    }
    
    const cardId = Number(req.params.cardId);

    if (!cardId) {
      return res.status(400).json({ isSuccess: false, code: 'CARD-403', message: 'cardId는 필수입니다.' });
    }

    const result = await cardService.getCard({userId, cardId});

    return res.status(200).json({
      isSuccess: true,
      code: 'SUCCESS-200',
      message: "정상적으로 카드 세부정보를 반환했습니다.",
      data: result
    });
    
  } catch(error){
    return res.status(error.status || 500).json({
        isSuccess: false,
        code: error.code || 'SERVER-500',
        message: error.message || '카드 세부 정보를 가져오는 중에 에러가 발생했습니다.'
    });
  }

}