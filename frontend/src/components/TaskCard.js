import { formatDate, formatRelativeTime, getPriorityColor } from '../utils/dateHelpers';

const TaskCard = ({ task, onComplete, onDelete }) => {
  const colors = getPriorityColor(task.priority);
  const isOverdue = new Date(task.deadline) < new Date() && task.status === 'pending';

  return (
    <div className={`bg-white rounded-xl border ${isOverdue ? 'border-red-300' : 'border-gray-200'} p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {task.priority}
            </span>
            {task.source === 'email' && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                Email
              </span>
            )}
            {isOverdue && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 font-medium">
                Overdue
              </span>
            )}
          </div>

          <h3 className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(task.deadline)}
            </span>
            <span className={`font-medium ${isOverdue ? 'text-red-600' : colors.text}`}>
              {formatRelativeTime(task.deadline)}
            </span>
          </div>

          {task.sourceEmail?.from && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              From: {task.sourceEmail.from}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {task.status === 'pending' && (
            <button
              onClick={() => onComplete(task._id)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Mark complete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(task._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
