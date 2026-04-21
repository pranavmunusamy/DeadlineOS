const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getStudentAnalytics } = require('../controllers/studentAnalyticsController');

router.use(authenticate);
router.get('/', getStudentAnalytics);

module.exports = router;
