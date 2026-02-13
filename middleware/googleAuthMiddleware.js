const admin = require('../config/firebaseConfig');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if(token == 'admin') {
    req.user = {
      uid: "admin-test-id",
      email: "admin@test.com",
      name: "관리자테스트",
    };
    return next(); // Firebase 검증을 건너뛰고 바로 다음 컨트롤러로 이동
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = verifyToken;