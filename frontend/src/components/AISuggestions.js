import { AI_SUGGESTIONS } from '../utils/mockData';

const AISuggestions = () => {
  const iconMap = {
    study: { icon: '📖', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    break: { icon: '☕', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    warning: { icon: '⚠️', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤖</span>
        <h3 className="font-bold text-gray-900 dark:text-white">AI Study Suggestions</h3>
        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md">SMART</span>
      </div>
      <div className="space-y-2">
        {AI_SUGGESTIONS.map((s) => {
          const style = iconMap[s.type];
          return (
            <div key={s.id} className={`${style.bg} border ${style.border} rounded-lg p-3 flex items-start gap-3`}>
              <span className="text-lg mt-0.5">{style.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.reason}</p>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                s.urgency === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : s.urgency === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {s.urgency}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AISuggestions;
