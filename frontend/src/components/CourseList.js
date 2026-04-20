import { COURSES } from '../utils/mockData';

const CourseList = ({ tasks = [] }) => {
  const courseTaskCounts = {};
  tasks.forEach((t) => {
    const course = t.title?.split(' - ')[0] || 'Other';
    if (!courseTaskCounts[course]) courseTaskCounts[course] = { total: 0, completed: 0 };
    courseTaskCounts[course].total++;
    if (t.status === 'completed') courseTaskCounts[course].completed++;
  });

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">My Courses</h2>
        <span className="text-xs font-mono text-[var(--text-muted)]">{COURSES.length} enrolled</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COURSES.map((course, i) => {
          const pending = Math.floor(Math.random() * 5) + 2;
          return (
            <div key={course.id}
              className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all animate-fade-up group"
              style={{ animationDelay: `${i * 60}ms` }}>
              {/* Color accent bar */}
              <div className="h-1 opacity-80" style={{ background: course.color }} />

              <div className="p-4">
                {/* Course code badge + name */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: `${course.color}18`, color: course.color }}>
                      {course.code}
                    </span>
                    <h3 className="font-display font-bold text-[var(--text-primary)] text-sm mt-2">{course.name}</h3>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{course.professor}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                    {course.credits} cr
                  </span>
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-1.5 mb-3">
                  <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{course.schedule}</span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">Progress</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: course.color }}>{course.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill transition-all duration-700"
                      style={{ width: `${course.progress}%`, background: course.color }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {pending} pending
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-green-dim)] text-[var(--accent-green)]">
                    Active
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseList;
