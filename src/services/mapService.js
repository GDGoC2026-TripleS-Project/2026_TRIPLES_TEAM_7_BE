// services/mapService.js (혹은 userService.js)
const { getCoordsFromAddress } = require('../utils/kakaoMapUtils');

const convertAndProcessLocation = async (address) => {
    const coords = await getCoordsFromAddress(address);
    if (!coords) throw new Error("좌표를 찾을 수 없는 주소입니다.");
    
    // 여기서 좌표 가공 (Point 객체화 등)
    return {
        type: 'Point',
        coordinates: [parseFloat(coords.longitude), parseFloat(coords.latitude)]
    };
};

module.exports = convertAndProcessLocation;