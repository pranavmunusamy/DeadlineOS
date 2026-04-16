/**
 * DeadlineOS - Smart Prioritization Engine
 * Calculates priority scores and assigns urgency levels.
 *
 * Formula: priority_score = (days_to_deadline * weight1) + (urgency_flag * weight2)
 * Rules:
 *   < 24 hours  → HIGH (red)
 *   < 3 days    → MEDIUM (yellow)
 *   >= 3 days   → LOW (green)
 */

const WEIGHT_DAYS = 10;
const WEIGHT_URGENCY = 50;

function calculatePriority(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const msUntilDeadline = deadlineDate.getTime() - now.getTime();
  const hoursUntilDeadline = msUntilDeadline / (1000 * 60 * 60);
  const daysUntilDeadline = hoursUntilDeadline / 24;

  let priority, urgencyFlag;

  if (hoursUntilDeadline <= 24) {
    priority = 'HIGH';
    urgencyFlag = 3;
  } else if (daysUntilDeadline <= 3) {
    priority = 'MEDIUM';
    urgencyFlag = 2;
  } else {
    priority = 'LOW';
    urgencyFlag = 1;
  }

  // Lower score = more urgent (sorts ascending)
  const priorityScore = Math.max(0, daysUntilDeadline) * WEIGHT_DAYS
    - urgencyFlag * WEIGHT_URGENCY;

  return { priority, priorityScore: Math.round(priorityScore * 100) / 100 };
}

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => a.priorityScore - b.priorityScore);
}

function getTopUrgentTasks(tasks, count = 3) {
  const pending = tasks.filter((t) => t.status === 'pending');
  const sorted = sortByPriority(pending);
  return sorted.slice(0, count);
}

function categorizeTasks(tasks) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const pending = tasks.filter((t) => t.status === 'pending');
  const completed = tasks.filter((t) => t.status === 'completed');

  // Recalculate priorities for all pending tasks
  const withPriority = pending.map((task) => {
    const { priority, priorityScore } = calculatePriority(task.deadline);
    return { ...task, priority, priorityScore };
  });

  const sorted = sortByPriority(withPriority);

  return {
    todaysFocus: sorted.slice(0, 3),
    upcoming: sorted,
    completed,
    stats: {
      total: tasks.length,
      pending: pending.length,
      completed: completed.length,
      highPriority: withPriority.filter((t) => t.priority === 'HIGH').length,
      mediumPriority: withPriority.filter((t) => t.priority === 'MEDIUM').length,
      lowPriority: withPriority.filter((t) => t.priority === 'LOW').length,
    },
  };
}

module.exports = {
  calculatePriority,
  sortByPriority,
  getTopUrgentTasks,
  categorizeTasks,
};
