const Task = require('../models/Task');
const { calculatePriority, categorizeTasks } = require('../services/priorityEngine');

const getDashboard = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ deadline: 1 })
      .lean();

    // Recalculate priorities on every fetch (keeps them fresh)
    const enriched = tasks.map((task) => {
      if (task.status === 'pending') {
        const { priority, priorityScore } = calculatePriority(task.deadline);
        return { ...task, priority, priorityScore };
      }
      return task;
    });

    const categorized = categorizeTasks(enriched);
    res.json(categorized);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { status, sort = 'deadline' } = req.query;
    const query = { userId: req.user._id };
    if (status && ['pending', 'completed'].includes(status)) {
      query.status = status;
    }

    const tasks = await Task.find(query).sort({ [sort]: 1 }).lean();

    const enriched = tasks.map((task) => {
      if (task.status === 'pending') {
        const { priority, priorityScore } = calculatePriority(task.deadline);
        return { ...task, priority, priorityScore };
      }
      return task;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, deadline } = req.body;
    const { priority, priorityScore } = calculatePriority(new Date(deadline));

    const task = await Task.create({
      userId: req.user._id,
      title,
      deadline: new Date(deadline),
      source: 'manual',
      priority,
      priorityScore,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending or completed' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = {
  getDashboard,
  getAllTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
};
