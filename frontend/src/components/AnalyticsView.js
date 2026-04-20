import { WORKLOAD_DATA, BADGES } from '../utils/mockData';

const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.assignments + d.quizzes + d.projects + d.papers));
  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-1">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Workload</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Weekly distribution by type</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => {
          const t = d.assignments + d.quizzes + d.projects + d.papers;
          const pct = max > 0 ? (t / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">{t}</span>
              <div className="w-full rounded-t overflow-hidden transition-all" style={{ height: `${Math.max(pct, 4)}%` }}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-[var(--accent-blue)] opacity-90" style={{ flex: d.assignments }} />
                  <div className="flex-1 bg-[var(--accent-purple)] opacity-80" style={{ flex: d.quizzes || 0.001 }} />
                  <div className="flex-1 bg-[var(--accent-green)] opacity-80" style={{ flex: d.projects || 0.001 }} />
                  <div className="flex-1 bg-[var(--accent-amber)] opacity-80" style={{ flex: d.papers || 0.001 }} />
                </div>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">{d.week}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4">
        {[{ l: 'Assign', c: 'bg-[var(--accent-blue)]' }, { l: 'Quiz', c: 'bg-[var(--accent-purple)]' }, { l: 'Project', c: 'bg-[var(--accent-green)]' }, { l: 'Paper', c: 'bg-[var(--accent-amber)]' }].map((x) => (
          <div key={x.l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-sm ${x.c}`} /><span className="text-[10px] text-[var(--text-muted)]">{x.l}</span></div>
        ))}
      </div>
    </div>
  );
};

const StressGauge = ({ stats }) => {
  const level = Math.min(100, (stats?.highPriority || 0) * 20 + (stats?.pending || 0) * 5);
  const label = level > 70 ? 'High' : level > 40 ? 'Moderate' : 'Low';
  const color = level > 70 ? 'var(--accent-red)' : level > 40 ? 'var(--accent-amber)' : 'var(--accent-green)';

  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-2">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Stress Level</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Based on workload analysis</p>
      <div className="flex items-center gap-5">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-tertiary)" strokeWidth="5" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - level / 100)} strokeLinecap="round"
              className="transition-all duration-1000" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold" style={{ color }}>{level}</span>
        </div>
        <div>
          <p className="font-display font-bold" style={{ color }}>{label}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{stats?.highPriority || 0} urgent · {stats?.pending || 0} pending</p>
        </div>
      </div>
    </div>
  );
};

const Achievements = () => (
  <div className="glass rounded-xl p-5 animate-fade-up stagger-3">
    <h3 className="font-display font-bold text-[var(--text-primary)] mb-3">Achievements</h3>
    <div className="grid grid-cols-3 gap-2">
      {BADGES.map((b) => (
        <div key={b.id} className={`text-center p-3 rounded-xl transition-all ${b.earned ? 'bg-[var(--accent-amber-dim)] border border-[rgba(245,166,35,0.2)]' : 'bg-[var(--bg-tertiary)] opacity-40'}`}>
          <span className="text-xl">{b.icon}</span>
          <p className="text-[10px] font-semibold text-[var(--text-primary)] mt-1">{b.name}</p>
          {!b.earned && b.progress && (
            <div className="progress-bar mt-1.5"><div className="progress-bar-fill bg-[var(--accent-blue)]" style={{ width: `${b.progress}%` }} /></div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const GradeEstimator = () => {
  const data = [
    { code: 'CS301', pct: 85, grade: 'A-' },
    { code: 'ENG201', pct: 72, grade: 'B+' },
    { code: 'MATH205', pct: 91, grade: 'A' },
    { code: 'PHYS101', pct: 58, grade: 'B-' },
  ];
  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-4">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Grade Forecast</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Based on deadline completion</p>
      <div className="space-y-3">
        {data.map((c) => (
          <div key={c.code} className="flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-secondary)] w-14">{c.code}</span>
            <div className="flex-1 progress-bar"><div className="progress-bar-fill bg-[var(--accent-blue)]" style={{ width: `${c.pct}%` }} /></div>
            <span className="text-xs font-display font-bold text-[var(--text-primary)] w-6 text-right">{c.grade}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsView = ({ stats }) => (
  <div className="space-y-4">
    <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Analytics</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BarChart data={WORKLOAD_DATA} />
      <StressGauge stats={stats} />
      <Achievements />
      <GradeEstimator />
    </div>
  </div>
);

export default AnalyticsView;
