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

    const userId = Number(req.header('X-USER-ID'));
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ isSuccess: false, code: 'AUTH-401', message: 'X-USER-ID required' });
    }
      
    const result = await cardService.createCard({userId, url});
      
    res.status(200).json({
    isSuccess: true,
    code: 'SUCCESS-200',
    message: '카드를 성공적으로 생성했습니다.',
    data: result,
  });

  }catch(error){
    console.error(error);
    res.status(500).json({ isSuccess: false, code: 'CARD-402', message: '카드 생성 중 문제가 발생하였습니다.' });
  }
};