const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createSession,
  discoverSessions,
  getSession,
  joinSession,
  leaveSession,
  getMySessions,
} = require('../controllers/sessionController');

router.use(authenticate);

router.get('/', discoverSessions);
router.get('/my', getMySessions);
router.get('/:id', getSession);
router.post('/', createSession);
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);

module.exports = router;
