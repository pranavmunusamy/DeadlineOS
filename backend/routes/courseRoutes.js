const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getCourses, createCourse, updateCourse, deleteCourse, linkTask } = require('../controllers/courseController');

router.use(authenticate);

router.get('/', getCourses);
router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.post('/:id/link-task/:taskId', linkTask);

module.exports = router;
