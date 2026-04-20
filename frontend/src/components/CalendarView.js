import { useState } from 'react';
import { getDaysInMonth, getMonthStartDay, formatShortDate, getPriorityColor } from '../utils/dateHelpers';

const CalendarView = ({ tasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getMonthStartDay(year, month);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const tasksByDate = {};
  pendingTasks.forEach((task) => {
    const d = new Date(task.deadline);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{monthName}</h2>
        <button onClick={next} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="min-h-[72px]" />;
          const key = `${year}-${month}-${day}`;
          const dayTasks = tasksByDate[key] || [];

          return (
            <div key={day} className={`min-h-[72px] p-1 rounded-lg border transition-colors ${
              isToday(day) ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}>
              <span className={`text-xs font-medium ${isToday(day) ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 2).map((t) => {
                  const c = getPriorityColor(t.priority);
                  return (
                    <div key={t._id} className={`text-[10px] leading-tight px-1 py-0.5 rounded ${c.bg} ${c.text} truncate`}>
                      {t.title.substring(0, 20)}
                    </div>
                  );
                })}
                {dayTasks.length > 2 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">+{dayTasks.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
