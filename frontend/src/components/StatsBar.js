const ProgressRing = ({ value, max, color, size = 52 }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-gray-200 dark:text-gray-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
};

const StatsBar = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="relative">
          <ProgressRing value={stats.completed} max={stats.total} color="#10b981" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
        <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800/50 p-4">
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.highPriority}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Urgent</p>
        {stats.highPriority > 0 && <span className="inline-block mt-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.mediumPriority}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Medium</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800/50 p-4">
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
      </div>
    </div>
  );
};

export default StatsBar;
