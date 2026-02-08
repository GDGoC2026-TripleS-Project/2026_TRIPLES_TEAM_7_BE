var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.status(200).json({ ok: true, message: 'API server is running' });
});

module.exports = router;
