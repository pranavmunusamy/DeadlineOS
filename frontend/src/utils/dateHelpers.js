export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatRelativeTime(dateStr) {
  const now = new Date();
  const deadline = new Date(dateStr);
  const diffMs = deadline - now;
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMs < 0) return 'Overdue';
  if (diffH < 1) return '< 1h';
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return '1 day';
  return `${diffD}d`;
}

export function getPriorityMeta(priority) {
  const map = {
    HIGH: { label: 'Urgent', color: 'var(--accent-red)', dim: 'var(--accent-red-dim)', glow: 'glow-red', dot: 'bg-[#f55b5b]', text: 'text-[#f55b5b]', bg: 'bg-[rgba(245,91,91,0.1)]' },
    MEDIUM: { label: 'Soon', color: 'var(--accent-amber)', dim: 'var(--accent-amber-dim)', glow: 'glow-amber', dot: 'bg-[#f5a623]', text: 'text-[#f5a623]', bg: 'bg-[rgba(245,166,35,0.1)]' },
    LOW: { label: 'Upcoming', color: 'var(--accent-green)', dim: 'var(--accent-green-dim)', glow: 'glow-green', dot: 'bg-[#3dd68c]', text: 'text-[#3dd68c]', bg: 'bg-[rgba(61,214,140,0.1)]' },
  };
  return map[priority] || map.LOW;
}

export function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
export function getMonthStartDay(y, m) { return new Date(y, m, 1).getDay(); }
