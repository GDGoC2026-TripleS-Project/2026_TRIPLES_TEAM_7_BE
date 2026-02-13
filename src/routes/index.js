const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const router = express.Router();

router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
  res.status(200).json({ ok: true, message: 'server is running' });
});

module.exports = router;
