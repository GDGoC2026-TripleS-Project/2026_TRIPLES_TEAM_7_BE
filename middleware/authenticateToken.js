const jwt = require('jsonwebtoken');

const authenticateJWTtoken = async (req, res, next) => {
  const jwtToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!jwtToken) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedUID = jwt.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET);
    console.log(`[JWT Middleware] 토큰에서 추출된 UID:`, decodedUID);
    req.user = await User.findOne({
            where: { firebase_uid: decodedUID.firebase_uid }
         });
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  console.log(`[JWT Middleware] 토큰 검증 완료, 사용자 정보:`, req.user);
};

module.exports = authenticateJWTtoken;