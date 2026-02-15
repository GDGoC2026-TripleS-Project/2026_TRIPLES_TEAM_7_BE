const myPageService = require('../services/myPageService');

exports.updateAddress = async (req, res, next) => {
    try {
        const userId = Number(req.header('X-USER-ID'));
        console.log(userId);
        const { address } = req.body;
        
        if (!address) {
            throw new Error("도로명 주소가 제공되지 않았습니다.");
        }

        const result = await myPageService.setUserAddress(userId, address);

        return res.status(200).json({
            success: true,
            message: "주소가 성공적으로 설정되었습니다.",
            result : result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};