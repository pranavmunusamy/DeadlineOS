const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getTimetable, addEntry, updateEntry, deleteEntry } = require('../controllers/timetableController');

router.use(authenticate);

router.get('/', getTimetable);
router.post('/', addEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
