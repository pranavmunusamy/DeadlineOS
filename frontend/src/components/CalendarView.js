import { useState } from 'react';
import { getDaysInMonth, getMonthStartDay, getPriorityMeta } from '../utils/dateHelpers';

const CalendarView = ({ tasks = [] }) => {
  const [cur, setCur] = useState(new Date());
  const y = cur.getFullYear(), m = cur.getMonth();
  const days = getDaysInMonth(y, m);
  const start = getMonthStartDay(y, m);
  const name = cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  const taskMap = {};
  tasks.filter((t) => t.status === 'pending').forEach((t) => {
    const d = new Date(t.deadline);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (taskMap[k] = taskMap[k] || []).push(t);
  });

  const cells = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const isToday = (d) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCur(new Date(y, m - 1, 1))} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{name}</h2>
          <button onClick={() => setCur(new Date(y, m + 1, 1))} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-mono text-[var(--text-muted)] py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="aspect-square" />;
            const k = `${y}-${m}-${day}`;
            const dt = taskMap[k] || [];
            const it = isToday(day);

            return (
              <div key={day} className={`aspect-square p-1 rounded-lg flex flex-col items-center transition-all ${
                it ? 'bg-[var(--accent-blue-dim)] ring-1 ring-[var(--accent-blue)]' : 'hover:bg-[var(--bg-hover)]'
              }`}>
                <span className={`text-[11px] font-mono ${it ? 'text-[var(--accent-blue)] font-bold' : 'text-[var(--text-secondary)]'}`}>{day}</span>
                {dt.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dt.slice(0, 3).map((t) => {
                      const p = getPriorityMeta(t.priority);
                      return <span key={t._id} className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deadline list below calendar */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-xs font-mono font-semibold text-[var(--text-muted)] mb-3">ALL DEADLINES THIS MONTH</h3>
        <div className="space-y-2">
          {tasks.filter((t) => {
            const d = new Date(t.deadline);
            return d.getMonth() === m && d.getFullYear() === y && t.status === 'pending';
          }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).map((t) => {
            const p = getPriorityMeta(t.priority);
            return (
              <div key={t._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.dot}`} />
                <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{t.title}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
          {tasks.filter((t) => { const d = new Date(t.deadline); return d.getMonth() === m && t.status === 'pending'; }).length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">No deadlines this month</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
