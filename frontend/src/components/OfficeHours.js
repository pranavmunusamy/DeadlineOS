import { useState } from 'react';
import { OFFICE_HOURS } from '../utils/mockData';

const OfficeHours = () => {
  const [search, setSearch] = useState('');
  const [booked, setBooked] = useState({});

  const filtered = OFFICE_HOURS.filter((oh) =>
    oh.professor.toLowerCase().includes(search.toLowerCase()) ||
    oh.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleBook = (id) => {
    setBooked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Office Hours</h2>
        <div className="relative">
          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search professor or course..."
            className="pl-9 pr-4 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none transition-colors w-64 font-mono text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((oh, i) => (
          <div key={oh.id}
            className="glass rounded-xl p-4 hover:scale-[1.01] transition-all animate-fade-up"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display font-bold text-[var(--text-primary)] text-sm">{oh.professor}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-1 inline-block"
                  style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>
                  {oh.course}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-[var(--accent-amber-dim)] px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 text-[var(--accent-amber)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)]">{oh.rating}</span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">{oh.day}, {oh.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">{oh.room}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                oh.available
                  ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}>
                {oh.available ? `${oh.slots} slots open` : 'Full'}
              </span>
              <button
                onClick={() => handleBook(oh.id)}
                disabled={!oh.available}
                className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                  booked[oh.id]
                    ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[rgba(61,214,140,0.2)]'
                    : oh.available
                    ? 'bg-[var(--accent-blue)] text-white hover:opacity-90'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
                }`}
              >
                {booked[oh.id] ? 'Booked' : 'Book Slot'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No office hours found for "{search}"</p>
        </div>
      )}
    </div>
  );
};

export default OfficeHours;
