const User = require('../models/users/user');
const convertAndProcessLocation = require('./mapService');

const updateUserAddress = async (userId, address) => {
    try {
        // 3. DB 업데이트 실행
        const addressPoint = await convertAndProcessLocation(address);
        if (!addressPoint) {
            throw new Error('주소 변환 실패');
        }

        await User.update(
            { 
                address: address,       // 도로명 주소 (String)
                addressPoint: addressPoint, // 지리 정보 (Point)
            },{ 
                where: { id: userId } // req.user.id에서 넘어온 값
            }
        );
        
        return { address };
    } catch (error) {
        console.error("주소 업데이트 중 오류 발생:", error.message);
        throw error;
    }
};

/**
 * 유저 이력서 URL 업데이트
 * @param {string} userId - 유저 고유 ID
 * @param {string} resumeUrl - PDF 파일이 저장된 URL 경로
 */
const updateUserResume = async (userId, resumeUrl) => {
    try {
        if (!resumeUrl) {
            throw new Error("이력서 URL이 유효하지 않습니다.");
        }
        
        await User.update(
            { resumeUrl: resumeUrl },
            { where: { id: userId } }
        );
        return { resumeUrl };
    } catch (error) {
        console.error("이력서 URL 업데이트 중 오류 발생:", error.message);
        throw error;
    }
};


module.exports = { updateUserAddress, updateUserResume };