import { useState, useEffect } from 'react';
import api from '../services/api';

const BarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="glass rounded-xl p-5"><p className="text-xs text-[var(--text-muted)]">No workload data yet. Add tasks to see trends.</p></div>;

  const max = Math.max(...data.map((d) => d.total || (d.assignments + d.quizzes + d.projects + d.papers)), 1);
  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-1">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Workload</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Weekly distribution by type</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => {
          const t = d.total || (d.assignments + d.quizzes + d.projects + d.papers);
          const pct = max > 0 ? (t / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">{t}</span>
              <div className="w-full rounded-t overflow-hidden transition-all" style={{ height: `${Math.max(pct, 4)}%` }}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-[var(--accent-blue)] opacity-90" style={{ flex: d.assignments || 0.001 }} />
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

const StressGauge = ({ stress }) => {
  const level = stress?.score || 0;
  const label = stress?.label || 'Low';
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
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {stress?.overdue || 0} overdue · {stress?.highPriority || 0} urgent · {stress?.next3Days || 0} due soon
          </p>
        </div>
      </div>
    </div>
  );
};

const Achievements = ({ achievements }) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-3">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-3">Achievements</h3>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((b) => {
          const pct = b.target > 0 ? Math.round((b.current / b.target) * 100) : 0;
          return (
            <div key={b.id} className={`text-center p-3 rounded-xl transition-all ${b.earned ? 'bg-[var(--accent-amber-dim)] border border-[rgba(245,166,35,0.2)]' : 'bg-[var(--bg-tertiary)] opacity-60'}`}>
              <span className="text-xl">{b.icon}</span>
              <p className="text-[10px] font-semibold text-[var(--text-primary)] mt-1">{b.name}</p>
              <p className="text-[8px] text-[var(--text-muted)] mt-0.5">{b.desc}</p>
              {!b.earned && (
                <div className="progress-bar mt-1.5"><div className="progress-bar-fill bg-[var(--accent-blue)]" style={{ width: `${pct}%` }} /></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GradeEstimator = ({ coursePerformance }) => {
  if (!coursePerformance || coursePerformance.length === 0) {
    return (
      <div className="glass rounded-xl p-5 animate-fade-up stagger-4">
        <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Grade Forecast</h3>
        <p className="text-[10px] font-mono text-[var(--text-muted)]">Add courses and link tasks to see grade estimates.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-4">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Grade Forecast</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Based on task completion rates</p>
      <div className="space-y-3">
        {coursePerformance.map((c) => (
          <div key={c.code} className="flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-secondary)] w-16 truncate" title={c.name}>{c.code}</span>
            <div className="flex-1 progress-bar">
              <div className="progress-bar-fill transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color || 'var(--accent-blue)' }} />
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right">{c.done}/{c.total}</span>
            <span className="text-xs font-display font-bold text-[var(--text-primary)] w-6 text-right">{c.grade}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyDensity = ({ density }) => {
  if (!density || density.length === 0) return null;
  const max = Math.max(...density.map((d) => d.count), 1);

  return (
    <div className="glass rounded-xl p-5 animate-fade-up stagger-5">
      <h3 className="font-display font-bold text-[var(--text-primary)] mb-1">Upcoming Density</h3>
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-4">Tasks due per day (next 14 days)</p>
      <div className="flex items-end gap-1 h-20">
        {density.map((d, i) => {
          const pct = max > 0 ? (d.count / max) * 100 : 0;
          const isToday = i === 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[8px] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
              <div className={`w-full rounded-t transition-all ${isToday ? 'bg-[var(--accent-blue)]' : d.count > 2 ? 'bg-[var(--accent-red)] opacity-70' : 'bg-[var(--accent-green)] opacity-50'}`}
                style={{ height: `${Math.max(pct, 6)}%` }} />
              <span className="text-[7px] font-mono text-[var(--text-muted)] truncate w-full text-center">{d.label?.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SummaryCards = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    { label: 'Total Tasks', value: summary.totalTasks, color: 'var(--accent-blue)' },
    { label: 'Completed', value: summary.completed, color: 'var(--accent-green)' },
    { label: 'Pending', value: summary.pending, color: 'var(--accent-amber)' },
    { label: 'Overdue', value: summary.overdue, color: 'var(--accent-red)' },
    { label: 'Completion', value: `${summary.completionRate}%`, color: 'var(--accent-purple)' },
    { label: 'Courses', value: summary.activeCourses, color: 'var(--accent-blue)' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 animate-fade-up">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl p-3 text-center">
          <p className="font-display text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
          <p className="text-[9px] font-mono text-[var(--text-muted)]">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

const AnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/student-analytics');
        setAnalytics(data);
      } catch { /* ok */ }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm font-mono text-[var(--text-muted)]">Loading analytics...</p></div>;

  if (!analytics) return <div className="glass rounded-xl p-8 text-center"><p className="text-sm text-[var(--text-muted)]">Could not load analytics. Try again later.</p></div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Analytics</h2>
      <SummaryCards summary={analytics.summary} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={analytics.workload} />
        <StressGauge stress={analytics.stress} />
        <Achievements achievements={analytics.achievements} />
        <GradeEstimator coursePerformance={analytics.coursePerformance} />
        <DailyDensity density={analytics.dailyDensity} />
      </div>
    </div>
  );
};

export default AnalyticsView;
