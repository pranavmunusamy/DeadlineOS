import { formatDate, formatRelativeTime, getPriorityColor, getCategoryIcon } from '../utils/dateHelpers';

const TaskCard = ({ task, onComplete, onDelete, compact = false }) => {
  const colors = getPriorityColor(task.priority);
  const isOverdue = new Date(task.deadline) < new Date() && task.status === 'pending';
  const category = task.category || 'assignment';

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${isOverdue ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'} transition-all hover:shadow-sm`}>
        {task.status === 'pending' && (
          <button onClick={() => onComplete(task._id)} className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors" />
        )}
        {task.status === 'completed' && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        )}
        <span className="text-sm mr-1">{getCategoryIcon(category)}</span>
        <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{task.title}</span>
        <span className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : colors.text}`}>{formatRelativeTime(task.deadline)}</span>
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${isOverdue ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'} p-4 transition-all duration-200 hover:shadow-md group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {task.priority}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {getCategoryIcon(category)} {category}
            </span>
            {task.source === 'email' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <svg className="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Email
              </span>
            )}
            {isOverdue && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium animate-pulse">Overdue</span>}
          </div>

          <h3 className={`font-semibold text-gray-900 dark:text-white ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
            {task.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(task.deadline)}
            </span>
            <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : colors.text}`}>
              {formatRelativeTime(task.deadline)}
            </span>
          </div>

          {task.sourceEmail?.from && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">From: {task.sourceEmail.from}</p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status === 'pending' && (
            <button onClick={() => onComplete(task._id)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Complete">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          )}
          <button onClick={() => onDelete(task._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
