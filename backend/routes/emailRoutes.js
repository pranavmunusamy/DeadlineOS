const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { syncEmails } = require('../controllers/emailController');

router.use(authenticate);

router.post('/sync', syncEmails);

module.exports = router;
