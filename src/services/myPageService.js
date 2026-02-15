const User = require('../models/users/user');
const convertAndProcessLocation = require('./mapService');

const setUserAddress = async (userId, address) => {
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

module.exports = { setUserAddress };