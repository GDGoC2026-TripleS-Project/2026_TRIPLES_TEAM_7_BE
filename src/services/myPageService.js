const User = require('../models/users/user');
const resumes = require('../models/users/resumes');
const convertAndProcessLocation = require('./mapService');

const updateUserAddress = async (userId, address) => {
    try {
        // 3. DB 업데이트 실행
        const addressPoint = await convertAndProcessLocation(address);
        if (!addressPoint) {
            throw new Error('주소 변환 실패');
        }

        const [addressRecord, created] = await User.findOrCreate({ 
            // 1. 찾기 위한 조건
            where: { id: userId }, 

            // 2. 만약 데이터가 없어서 새로 만들 때 넣을 기본값
            defaults: { 
                address: address, 
                addressPoint: addressPoint 
            } 
        });

        if(!created) {
            // 이미 존재한다면 업데이트
            await addressRecord.update({ address: address, addressPoint: addressPoint  });
        }


        return { address };
    } catch (error) {
        console.error("주소 업데이트 중 오류 발생:", error.message);
        throw error;
    }
};

/**
 * 유저 이력서 URL 업데이트
 * @param {integer} userId - 유저 고유 ID
 * @param {string} resumeUrl - PDF 파일이 저장된 URL 경로
 */
const updateUserResume = async (userid, resumeUrl) => {
    try {
        if (!resumeUrl) {
            throw new Error("이력서 URL이 유효하지 않습니다.");
        }
        const userId = Number(userid);
        
        if (!userId) {
            throw new Error("userId이 유효하지 않습니다.");
        }
        
        const [resumeRecord, created] = await resumes.findOrCreate({
            where: { userId: userId }, // 이 값이 undefined면 에러 발생!
            defaults: { 
                fileUrl: resumeUrl,
                userId: userId // 새로 생성될 때 들어갈 값
            }
        });

        if(!created) {
            // 이미 존재한다면 업데이트
            await resumeRecord.update({ fileUrl: resumeUrl });
        }
        return { resumeUrl };
    } catch (error) {
        console.error("이력서 URL 업데이트 중 오류 발생:", error.message);
        throw error;
    }
};


module.exports = { updateUserAddress, updateUserResume };