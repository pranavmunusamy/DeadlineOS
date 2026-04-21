const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getSuggestions } = require('../controllers/suggestionController');

router.use(authenticate);
router.get('/', getSuggestions);

module.exports = router;
