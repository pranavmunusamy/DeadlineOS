import { useState } from 'react';
import { getLoginUrl } from '../services/api';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data } = await getLoginUrl();
      window.location.href = data.url;
    } catch { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] bg-grid flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent-blue)] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />

      <div className="animate-fade-up text-center max-w-lg relative z-10">
        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-8 animate-fade-up stagger-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
            <span className="font-mono font-bold text-white text-sm">DO</span>
          </div>
          <span className="font-display text-xl font-bold text-[var(--text-primary)]">DeadlineOS</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-4 animate-fade-up stagger-2">
          Your academic
          <br />
          <span className="text-[var(--accent-blue)]">command center.</span>
        </h1>

        <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed animate-fade-up stagger-3">
          Deadlines from email. Priority at a glance.
          <br className="hidden sm:block" />
          Know exactly what to do next.
        </p>

        <button onClick={handleLogin} disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 glass glass-hover rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] animate-fade-up stagger-4 group">
          <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24">
            <path fill="#e8e6e3" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#e8e6e3" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          </svg>
          <span className="font-display font-semibold text-[var(--text-primary)]">
            {loading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10 animate-fade-up stagger-5">
          {['Email Parsing', 'Smart Priority', 'Calendar', 'Analytics', 'Office Hours'].map((f) => (
            <span key={f} className="px-3 py-1 text-xs font-mono text-[var(--text-muted)] border border-[var(--border)] rounded-full">
              {f}
            </span>
          ))}
        </div>

        <p className="text-[var(--text-muted)] text-xs mt-8 animate-fade-up stagger-6">
          Read-only Gmail access · No data stored permanently
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
