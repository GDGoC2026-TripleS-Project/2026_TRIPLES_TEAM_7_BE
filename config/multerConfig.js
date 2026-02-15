const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const s3 = require('./s3Config'); // S3 클라이언트 불러오기

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            // profiles/ 디렉토리 밑으로 저장
            // 루트에 저장하거나, 다른 디렉토리에 저장해야 할 경우에는 적절히 코드를 수정하세요.
            cb(null, `profiles/${uniqueSuffix}${path.extname(file.originalname)}`); // S3에 저장될 파일 경로와 이름
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
});

module.exports = upload;
