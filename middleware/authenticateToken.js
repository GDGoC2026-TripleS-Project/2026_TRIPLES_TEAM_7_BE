const jwt = require('jsonwebtoken');
const { sequelize } = require('../src/models');
const { QueryTypes } = require('sequelize');

const authenticateJWTtoken = async (req, res, next) => {
  const jwtToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!jwtToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedUID = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
    console.log(`[JWT Middleware] 토큰에서 추출된 UID:`, decodedUID.firebase_uid);
    const [user] = await sequelize.query(
        `SELECT *
        FROM users
        WHERE firebase_uid = :firebase_uid
        LIMIT 1`,
        {
          replacements: { firebase_uid: decodedUID.firebase_uid },
          type: QueryTypes.SELECT
        }
    );

    console.log(user.firebase_uid);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('user');

    req.user = user;

    res.setHeader('Authorization', 'Bearer ' + jwtToken);
    console.log(`[JWT Middleware] 사용자 정보 설정 완료:`, req.user);
    next();
  } catch (error) {
    console.error(error);
    return res.status(403).json({ error: 'Invalid token' });
  }
  console.log(`[JWT Middleware] 토큰 검증 완료, 사용자 정보:`, req.user);
};

module.exports = authenticateJWTtoken;