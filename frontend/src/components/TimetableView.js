import { useState } from 'react';
import { TIMETABLE } from '../utils/mockData';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 8AM to 5PM

const TimetableView = () => {
  const [entries, setEntries] = useState(TIMETABLE);
  const [editing, setEditing] = useState(null);

  const getSlot = (day, hour) => entries.filter((e) => {
    const h = parseInt(e.start.split(':')[0]);
    return e.day === day && h === hour;
  });

  const deleteEntry = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
    setEditing(null);
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Weekly Timetable</h2>
        <span className="text-xs font-mono text-[var(--text-muted)]">{entries.length} classes</span>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)]">
              <div className="p-2" />
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-mono font-semibold text-[var(--text-secondary)] border-l border-[var(--border)]">
                  {d}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)] last:border-0">
                <div className="p-2 text-[10px] font-mono text-[var(--text-muted)] text-right pr-3 pt-3">
                  {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                </div>
                {DAYS.map((day) => {
                  const slots = getSlot(day, hour);
                  return (
                    <div key={day} className="border-l border-[var(--border)] min-h-[56px] p-1 relative">
                      {slots.map((slot) => (
                        <button key={slot.id} onClick={() => setEditing(editing === slot.id ? null : slot.id)}
                          className="w-full text-left p-2 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{ background: `${slot.color}18`, borderLeft: `3px solid ${slot.color}` }}>
                          <p className="text-[11px] font-bold" style={{ color: slot.color }}>{slot.course}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{slot.start}–{slot.end}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{slot.room}</p>

                          {editing === slot.id && (
                            <div className="mt-1.5 pt-1.5 border-t border-[var(--border)] flex gap-1">
                              <span className="text-[9px] font-mono text-[var(--accent-red)] cursor-pointer hover:underline"
                                onClick={(e) => { e.stopPropagation(); deleteEntry(slot.id); }}>
                                remove
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
