const express = require('express');
const router = express.Router();
const { getGoogleLoginUrl, handleGoogleCallback, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.get('/google', getGoogleLoginUrl);
router.get('/google/callback', handleGoogleCallback);
router.get('/profile', authenticate, getProfile);

module.exports = router;
