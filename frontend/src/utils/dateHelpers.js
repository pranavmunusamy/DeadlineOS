export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatRelativeTime(dateStr) {
  const now = new Date();
  const deadline = new Date(dateStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return 'Overdue';
  if (diffHours < 1) return 'Less than 1 hour';
  if (diffHours < 24) return `${diffHours}h left`;
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'HIGH': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700', dot: 'bg-red-500', ring: '#ef4444' };
    case 'MEDIUM': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700', dot: 'bg-amber-500', ring: '#f59e0b' };
    case 'LOW': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500', ring: '#10b981' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-700', dot: 'bg-gray-500', ring: '#6b7280' };
  }
}

export function getCategoryIcon(category) {
  const icons = {
    assignment: '📝', quiz: '📋', project: '🔬', paper: '📄',
    reading: '📚', exam: '🎓', lab: '🧪', other: '📌',
  };
  return icons[category] || icons.other;
}

export function getCategoryColor(category) {
  const colors = {
    assignment: 'bg-blue-500', quiz: 'bg-purple-500', project: 'bg-teal-500',
    paper: 'bg-orange-500', reading: 'bg-indigo-500', exam: 'bg-red-500',
    lab: 'bg-cyan-500', other: 'bg-gray-500',
  };
  return colors[category] || colors.other;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthStartDay(year, month) {
  return new Date(year, month, 1).getDay();
}
