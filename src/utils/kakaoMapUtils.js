const axios = require('axios');

const getCoordsFromAddress = async (address) => {
    const KAKAO_KEY = process.env.KAKAO_REST_API_KEY;
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    try {    
            const response = await axios.get(url, {params: { query: address },
            headers: { Authorization: `KakaoAK ${KAKAO_KEY}` }
        });

        if (!response.data.documents[0]) {
            console.log("카카오 지도 API 응답에 문서가 없습니다:", response.data);
            return null;
        }

        const location = response.data.documents[0];
        if (location) {
            return {
                longitude: parseFloat(location.x), // 경도
                latitude: parseFloat(location.y)   // 위도
            };
        }
        return null;
    } catch (error) {
        console.error("카카오 지도 API 호출 오류:", error);
        return null;
    }
};

module.exports = { getCoordsFromAddress };