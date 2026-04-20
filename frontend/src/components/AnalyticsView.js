import { WORKLOAD_DATA, BADGES } from '../utils/mockData';

const BarChart = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.assignments + d.quizzes + d.projects + d.papers));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Workload Distribution</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const total = d.assignments + d.quizzes + d.projects + d.papers;
          const pct = maxVal > 0 ? (total / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{total}</span>
              <div className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(pct, 5)}%` }}>
                <div className="bg-blue-500" style={{ height: `${(d.assignments / total) * 100}%`, minHeight: '2px' }} />
                <div className="bg-purple-500" style={{ height: `${(d.quizzes / total) * 100}%`, minHeight: d.quizzes ? '2px' : 0 }} />
                <div className="bg-teal-500" style={{ height: `${(d.projects / total) * 100}%`, minHeight: d.projects ? '2px' : 0 }} />
                <div className="bg-orange-500" style={{ height: `${(d.papers / total) * 100}%`, minHeight: d.papers ? '2px' : 0 }} />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{d.week.replace('Week ', 'W')}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[{ label: 'Assignments', color: 'bg-blue-500' }, { label: 'Quizzes', color: 'bg-purple-500' }, { label: 'Projects', color: 'bg-teal-500' }, { label: 'Papers', color: 'bg-orange-500' }].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StressIndicator = ({ stats }) => {
  const pending = stats?.pending || 0;
  const high = stats?.highPriority || 0;
  const stressLevel = Math.min(100, high * 20 + pending * 5);
  const stressLabel = stressLevel > 70 ? 'High' : stressLevel > 40 ? 'Moderate' : 'Low';
  const stressColor = stressLevel > 70 ? 'text-red-500' : stressLevel > 40 ? 'text-amber-500' : 'text-emerald-500';
  const stressBg = stressLevel > 70 ? 'bg-red-500' : stressLevel > 40 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">Academic Stress Level</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - stressLevel / 100)} strokeLinecap="round" className={stressColor} stroke="currentColor" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${stressColor}`}>{stressLevel}%</span>
        </div>
        <div>
          <p className={`text-lg font-bold ${stressColor}`}>{stressLabel} Stress</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{high} urgent, {pending} pending tasks</p>
          {stressLevel > 60 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Consider booking office hours for help</p>}
        </div>
      </div>
    </div>
  );
};

const BadgesSection = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Achievements</h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {BADGES.map((badge) => (
        <div key={badge.id} className={`p-3 rounded-xl text-center transition-all ${badge.earned ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 opacity-60'}`}>
          <span className="text-2xl">{badge.icon}</span>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{badge.name}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{badge.desc}</p>
          {!badge.earned && badge.progress && (
            <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${badge.progress}%` }} />
            </div>
          )}
          {badge.earned && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Earned!</span>}
        </div>
      ))}
    </div>
  </div>
);

const GradeEstimator = () => {
  const courses = [
    { name: 'CS301', completion: 85, estimate: 'A-' },
    { name: 'ENG201', completion: 72, estimate: 'B+' },
    { name: 'MATH205', completion: 91, estimate: 'A' },
    { name: 'PHYS101', completion: 58, estimate: 'B-' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">Grade Estimator</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Based on deadline completion rate</p>
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">{c.name}</span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.completion}%` }} />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white w-8">{c.estimate}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsView = ({ stats }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Analytics & Insights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={WORKLOAD_DATA} />
        <StressIndicator stats={stats} />
        <BadgesSection />
        <GradeEstimator />
      </div>
    </div>
  );
};

export default AnalyticsView;
