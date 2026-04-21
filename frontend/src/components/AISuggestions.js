import { useState, useEffect } from 'react';
import api from '../services/api';

const typeStyles = {
  start_now: { icon: '!', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
  start_soon: { icon: '>', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
  conflict: { icon: '!!', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
  free_time: { icon: '+', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  low_workload: { icon: '~', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  high_workload: { icon: '!', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
  overdue: { icon: 'x', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
  study: { icon: '>', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
  break: { icon: '+', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  warning: { icon: '!', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
};

const AISuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get('/suggestions');
        setSuggestions(data);
      } catch { /* ok */ }
      setLoading(false);
    };
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 animate-fade-up stagger-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-[var(--accent-purple)] bg-[var(--accent-purple-dim)] px-2 py-0.5 rounded">AI</span>
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Suggestions</span>
        </div>
        <p className="text-[10px] font-mono text-[var(--text-muted)] text-center py-3">Analyzing your schedule...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 animate-fade-up stagger-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs font-bold text-[var(--accent-purple)] bg-[var(--accent-purple-dim)] px-2 py-0.5 rounded">AI</span>
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Suggestions</span>
        {suggestions.length > 0 && (
          <span className="text-[9px] font-mono text-[var(--text-muted)] ml-auto">{suggestions.length} tips</span>
        )}
      </div>
      {suggestions.length === 0 ? (
        <p className="text-[10px] text-[var(--text-muted)] text-center py-3">Add tasks and courses to get personalized suggestions.</p>
      ) : (
        <div className="space-y-2">
          {suggestions.slice(0, 5).map((s, i) => {
            const st = typeStyles[s.type] || typeStyles.study;
            return (
              <div key={s.id || i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group">
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5"
                  style={{ background: st.bg, color: st.color }}>{st.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{s.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{s.reason}</p>
                </div>
                {s.urgency && (
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                    s.urgency === 'high' ? 'text-[var(--accent-red)] bg-[var(--accent-red-dim)]' :
                    s.urgency === 'medium' ? 'text-[var(--accent-amber)] bg-[var(--accent-amber-dim)]' :
                    'text-[var(--accent-green)] bg-[var(--accent-green-dim)]'
                  }`}>
                    {s.urgency}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AISuggestions;
