const myPageService = require('../services/myPageService');

exports.updateAddress = async (req, res, next) => {
    try {
        const userId = Number(req.header('X-USER-ID'));
        console.log(userId);
        const { address } = req.body;
        
        if (!address) {
            throw new Error("도로명 주소가 제공되지 않았습니다.");
        }

        const result = await myPageService.updateUserAddress(userId, address);

        return res.status(200).json({
            success: true,
            message: "주소가 성공적으로 설정되었습니다.",
            result : result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateResume = async (req, res) => {
    try {
        const userId = Number(req.header('X-USER-ID'));
        // multer-s3가 생성한 S3 파일 URL은 req.file.location에 담겨 있습니다.
        const resumeUrl = req.file?.location;

        if (!resumeUrl) {
            return res.status(400).json({ success: false, message: "파일 업로드에 실패했습니다." });
        }

        const result = await myPageService.updateUserResume(userId, resumeUrl);

        return res.status(200).json({
            success: true,
            message: "이력서가 S3에 저장되고 RDS 업데이트가 완료되었습니다.",
            resumeUrl: result.resumeUrl
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.userInfo = async (req, res, next) => {
    try {
        const userId = Number(req.header('X-USER-ID'));

        const result = User.findByPk(userId, {
            // 요청하신 3가지 정보만 선택하여 리턴
            attributes: ['username', 'email', 'address']
        });
        
        if (!result) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        
        return res.status(200).json({
            success: true,
            message: "사용자 정보 조회 성공",
            data: result
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};