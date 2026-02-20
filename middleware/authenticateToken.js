const jwt = require('jsonwebtoken');

const authenticateJWTtoken = async (req, res, next) => {
  const jwtToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!jwtToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedUID = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
    console.log(`[JWT Middleware] 토큰에서 추출된 UID:`, decodedUID);

    const [user] = await User.sequelize.query(
        `SELECT *
        FROM users
        WHERE firebase_uid = :firebase_uid
        LIMIT 1`,
      {
        replacements: { firebase_uid: decodedUID },
        type: User.sequelize.QueryTypes.SELECT
      }
    );

    console.log(user);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('user');

    req.user = user;

    res.setHeader('Authorization', 'Bearer ' + jwtToken);
    console.log(`[JWT Middleware] 사용자 정보 설정 완료:`, req.user);
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  console.log(`[JWT Middleware] 토큰 검증 완료, 사용자 정보:`, req.user);
};

module.exports = authenticateJWTtoken;