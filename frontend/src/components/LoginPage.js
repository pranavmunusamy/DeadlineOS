import { useState } from 'react';
import { getLoginUrl } from '../services/api';

const FEATURES = [
  { icon: '📧', title: 'Email Scanning', desc: 'Auto-extract deadlines from Gmail' },
  { icon: '🎯', title: 'Smart Priority', desc: 'AI ranks what to work on first' },
  { icon: '📅', title: 'Calendar View', desc: 'See all deadlines at a glance' },
  { icon: '📊', title: 'Analytics', desc: 'Track progress and workload' },
  { icon: '🏫', title: 'Office Hours', desc: 'Book professor appointments' },
  { icon: '🏆', title: 'Achievements', desc: 'Earn badges for staying on track' },
];

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getLoginUrl();
      window.location.href = data.url;
    } catch {
      setError('Failed to connect. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Info */}
          <div className="text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">DeadlineOS</h1>
                <p className="text-blue-300 text-sm">Smart Student Deadline Manager</p>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Never miss a deadline
              <span className="text-blue-400"> again.</span>
            </h2>
            <p className="text-blue-200/80 text-lg mb-8">
              Automatically extracts deadlines from your emails, prioritizes tasks, and tells you exactly what to work on right now.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-2.5 bg-white/5 rounded-lg p-3 border border-white/10">
                  <span className="text-lg">{f.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-blue-300/70">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-auto w-full">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Get Started</h3>
              <p className="text-gray-500 text-sm mt-1">Sign in with your university Google account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <button onClick={handleLogin} disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200 disabled:opacity-50">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-gray-700 font-medium">{loading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Read-only email access. No data stored permanently.
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-4 text-blue-300/50 text-xs">
        DeadlineOS - Academic Deadline & Office Hours App
      </footer>
    </div>
  );
};

export default LoginPage;
