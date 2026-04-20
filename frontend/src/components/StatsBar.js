const StatCard = ({ value, label, color, sub, delay }) => (
  <div className={`glass rounded-xl p-4 animate-fade-up ${delay}`}>
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-2xl font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs font-mono text-[var(--text-muted)]">{sub}</span>}
    </div>
    <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
  </div>
);

const StatsBar = ({ stats }) => {
  if (!stats) return null;
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <StatCard value={stats.total} label="Total" color="var(--text-primary)" sub={`${pct}% done`} delay="stagger-1" />
      <StatCard value={stats.pending} label="Pending" color="var(--accent-blue)" delay="stagger-2" />
      <StatCard value={stats.highPriority} label="Urgent" color="var(--accent-red)" delay="stagger-3" />
      <StatCard value={stats.mediumPriority} label="Soon" color="var(--accent-amber)" delay="stagger-4" />
      <StatCard value={stats.completed} label="Done" color="var(--accent-green)" delay="stagger-5" />
    </div>
  );
};

export default StatsBar;
