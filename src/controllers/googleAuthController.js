const User = require('../models/users/user');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

exports.login = async (req, res, next) => {

    try {
        const { uid, email, name } = req.user;

        let user = await User.findOne({ email: email });
        if (!user) {
            user = new User({
                firebase_uid: uid,
                email: email,
                username: name
            });
            await user.save();
            console.log('New user');
        } else {
            console.log('Existing user');
        }

        const customToken = jwt.sign({ firebase_uid: user.firebase_uid }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        const refreshCustomToken = jwt.sign({ firebase_uid: user.firebase_uid }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        res.setHeader('Authorization', 'Bearer ' + customToken);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            refreshToken: refreshCustomToken
        });

    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    try {
        // 서버 측에서는 refreshToken을 관리하는 저장소(DB, Redis 등)에서 제거하거나 블랙리스트 처리 // 예: DB에 저장된 refreshToken을 삭제 
        // 클라이언트 측에서는 accessToken/refreshToken을 삭제하도록 안내
        res.status(200).json({
            success: true,
            message: 'AccessToken과 refreshToken을 클라이언트 내에서 삭제해 주세요.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        // 1. 요청 헤더에서 리프레시 토큰 추출
        const refreshToken = req.body.refreshToken; // 클라이언트가 리프레시 토큰을 바디에 담아 전송한다고 가정
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh Token이 필요합니다.' });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // 3. 새로운 토큰 세트 생성
        // decoded에 담긴 유저 정보(예: id, email)를 바탕으로 생성합니다.
        const newAccessToken = jwt.sign(
            { firebase_uid: decoded.firebase_uid },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '1d' } // Access Token은 짧게 (예: 1시간)
        );

        const newRefreshToken = jwt.sign(
            { firebase_uid: decoded.firebase_uid },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' } // Refresh Token은 길게 (예: 14일)
        );

        res.setHeader('Authorization', `Bearer ${newAccessToken}`);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            refreshToken: newRefreshToken // 새로운 리프레시 토큰은 바디에 전송
        });

    } catch (error) {
        console.error('Refresh Token Error:', error.message);
        
        // 토큰이 만료되었거나 변조된 경우
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ success: false, message: 'Refresh Token이 만료되었습니다. 다시 로그인하세요.' });
        }
        return res.status(403).json({ success: false, message: '유효하지 않은 Refresh Token입니다.' });
    }
};