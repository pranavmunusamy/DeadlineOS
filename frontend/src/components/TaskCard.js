import { useState } from 'react';
import { formatDate, formatRelativeTime, getPriorityMeta } from '../utils/dateHelpers';

const TaskCard = ({ task, onComplete, onDelete, index = 0 }) => {
  const [completing, setCompleting] = useState(false);
  const p = getPriorityMeta(task.priority);
  const isOverdue = new Date(task.deadline) < new Date() && task.status === 'pending';
  const isCompleted = task.status === 'completed';

  const handleComplete = () => {
    setCompleting(true);
    setTimeout(() => onComplete(task._id), 400);
  };

  return (
    <div className={`glass glass-hover rounded-xl p-4 transition-all duration-300 animate-fade-up group ${
      isOverdue ? 'glow-red border-[rgba(245,91,91,0.2)]' : ''
    } ${completing ? 'animate-complete' : ''}`}
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {!isCompleted ? (
          <button onClick={handleComplete}
            className="mt-0.5 w-5 h-5 rounded-full border-2 border-[var(--text-muted)] hover:border-[var(--accent-green)] hover:bg-[var(--accent-green-dim)] transition-all flex-shrink-0 flex items-center justify-center group/check">
            <svg className="w-3 h-3 text-[var(--accent-green)] opacity-0 group-hover/check:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--accent-green)] flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${p.bg} ${p.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot} ${task.priority === 'HIGH' ? 'animate-pulse-soft' : ''}`} />
              {p.label}
            </span>
            {task.source === 'email' && (
              <span className="text-[10px] font-mono text-[var(--accent-blue)] bg-[var(--accent-blue-dim)] px-1.5 py-0.5 rounded">email</span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-mono text-[var(--accent-red)] animate-pulse-soft">OVERDUE</span>
            )}
          </div>

          <h3 className={`text-sm font-semibold leading-tight ${isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
            {task.title}
          </h3>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] font-mono text-[var(--text-muted)]">{formatDate(task.deadline)}</span>
            <span className={`text-[11px] font-mono font-semibold ${isOverdue ? 'text-[var(--accent-red)]' : p.text}`}>
              {formatRelativeTime(task.deadline)}
            </span>
          </div>

          {task.sourceEmail?.from && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate opacity-60">via {task.sourceEmail.from}</p>
          )}
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(task._id)}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red-dim)] rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
