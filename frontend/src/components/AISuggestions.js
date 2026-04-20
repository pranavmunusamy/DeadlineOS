import { AI_SUGGESTIONS } from '../utils/mockData';

const typeStyles = {
  study: { icon: '→', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
  break: { icon: '◇', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
  warning: { icon: '!', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
};

const AISuggestions = () => (
  <div className="glass rounded-xl p-4 animate-fade-up stagger-4">
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-xs font-bold text-[var(--accent-purple)] bg-[var(--accent-purple-dim)] px-2 py-0.5 rounded">AI</span>
      <span className="text-xs font-semibold text-[var(--text-secondary)]">Suggestions</span>
    </div>
    <div className="space-y-2">
      {AI_SUGGESTIONS.map((s) => {
        const st = typeStyles[s.type];
        return (
          <div key={s.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group">
            <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5"
              style={{ background: st.bg, color: st.color }}>{st.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{s.title}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{s.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default AISuggestions;
