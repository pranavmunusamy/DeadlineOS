import useAuth from '../hooks/useAuth';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', key: 'D' },
  { id: 'calendar', label: 'Calendar', key: 'C' },
  { id: 'timetable', label: 'Timetable', key: 'T' },
  { id: 'rooms', label: 'Rooms', key: 'B' },
  { id: 'study-groups', label: 'Study Groups', key: 'G' },
  { id: 'courses', label: 'Courses', key: 'R' },
  { id: 'analytics', label: 'Analytics', key: 'A' },
  { id: 'room-analytics', label: 'Room Stats', key: 'S' },
  { id: 'office-hours', label: 'Office Hours', key: 'O' },
];

const Header = ({ onSync, syncing, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)]" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center">
              <span className="font-mono font-bold text-white text-[10px]">DO</span>
            </div>
            <span className="font-display text-sm font-bold text-[var(--text-primary)] hidden sm:block">DeadlineOS</span>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}>
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[var(--accent-blue)] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={onSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-[var(--accent-blue)] bg-[var(--accent-blue-dim)] rounded-lg hover:bg-[rgba(91,138,245,0.25)] transition-all disabled:opacity-40">
              <svg className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing' : 'Sync'}
            </button>

            <button onClick={logout} className="flex items-center gap-2 group">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-6 h-6 rounded-full ring-1 ring-[var(--border)] group-hover:ring-[var(--border-hover)] transition-all" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                  {user?.name?.charAt(0)}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
