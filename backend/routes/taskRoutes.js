const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateTask } = require('../middleware/validate');
const {
  getDashboard,
  getAllTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/', getAllTasks);
router.post('/', validateTask, createTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;
