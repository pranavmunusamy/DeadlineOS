const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getHeatmap,
  getRoomStats,
  getBestTimes,
} = require('../controllers/analyticsController');

router.use(authenticate);

router.get('/heatmap', getHeatmap);
router.get('/rooms', getRoomStats);
router.get('/best-times', getBestTimes);

module.exports = router;
