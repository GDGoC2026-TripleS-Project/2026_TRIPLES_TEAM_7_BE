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

        res.setHeader('Authorization', 'Bearer ' + customToken);

        res.status(200).json({
            success: true,
            message: 'Login successful'
        });

    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
  // 클라이언트 측에서 토큰을 삭제하도록 안내
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};