import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const StudySessions = () => {
  const [tab, setTab] = useState('discover'); // discover | my | create
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Create form
  const [form, setForm] = useState({
    bookingId: '',
    title: '',
    description: '',
    type: 'OPEN',
    courseTag: '',
    topicTags: '',
    maxParticipants: 6,
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchSessions = useCallback(async () => {
    try {
      const params = {};
      if (courseFilter) params.courseTag = courseFilter;
      const { data } = await api.get('/sessions', { params });
      setSessions(data);
    } catch { /* ok */ }
    setLoading(false);
  }, [courseFilter]);

  const fetchMySessions = useCallback(async () => {
    try {
      const { data } = await api.get('/sessions/my');
      setMySessions(data);
    } catch { /* ok */ }
  }, []);

  const fetchMyBookings = useCallback(async () => {
    try {
      const { data } = await api.get('/rooms/my-bookings');
      setMyBookings(data);
    } catch { /* ok */ }
  }, []);

  useEffect(() => { fetchSessions(); fetchMySessions(); fetchMyBookings(); }, [fetchSessions, fetchMySessions, fetchMyBookings]);

  const handleJoin = async (id) => {
    try {
      await api.post(`/sessions/${id}/join`);
      showToast('Joined session!');
      fetchSessions();
      fetchMySessions();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to join');
    }
  };

  const handleLeave = async (id) => {
    try {
      await api.post(`/sessions/${id}/leave`);
      showToast('Left session');
      fetchSessions();
      fetchMySessions();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to leave');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.bookingId) return showToast('Select a booking first');
    if (!form.title.trim()) return showToast('Title required');

    try {
      await api.post('/sessions', {
        bookingId: form.bookingId,
        title: form.title,
        description: form.description,
        type: form.type,
        courseTag: form.courseTag,
        topicTags: form.topicTags.split(',').map((t) => t.trim()).filter(Boolean),
        maxParticipants: form.maxParticipants,
      });
      showToast('Session created!');
      setTab('discover');
      setForm({ bookingId: '', title: '', description: '', type: 'OPEN', courseTag: '', topicTags: '', maxParticipants: 6 });
      fetchSessions();
      fetchMySessions();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create session');
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Study Sessions</h2>
        <div className="flex gap-1">
          {[
            { id: 'discover', label: 'Discover' },
            { id: 'my', label: 'My Sessions' },
            { id: 'create', label: '+ Create' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-[var(--accent-blue)] text-white font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* === DISCOVER TAB === */}
      {tab === 'discover' && (
        <div className="space-y-3">
          {/* Course filter */}
          <input type="text" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
            placeholder="Filter by course (e.g., CS301)..."
            className="w-full sm:w-64 px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />

          {loading ? (
            <p className="text-sm font-mono text-[var(--text-muted)] text-center py-8">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <span className="text-2xl block mb-2">&#128218;</span>
              <p className="text-sm text-[var(--text-muted)]">No open study sessions right now.</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Book a room and create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sessions.map((s, i) => (
                <div key={s._id} className="glass rounded-xl p-4 animate-fade-up hover:scale-[1.01] transition-all"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{s.title}</h3>
                      {s.courseTag && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-1 inline-block bg-[var(--accent-purple-dim)] text-[var(--accent-purple)]">
                          {s.courseTag}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      s.isFull ? 'bg-[var(--accent-red-dim)] text-[var(--accent-red)]' : 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]'
                    }`}>
                      {s.participantCount}/{s.maxParticipants}
                    </span>
                  </div>

                  {s.description && (
                    <p className="text-[11px] text-[var(--text-muted)] mb-2 line-clamp-2">{s.description}</p>
                  )}

                  {/* Topic tags */}
                  {s.topicTags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {s.topicTags.map((t) => (
                        <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Booking info */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)] mb-3">
                    <span>{s.bookingId?.roomId?.name} · {s.bookingId?.roomId?.building}</span>
                    <span>{formatDate(s.bookingId?.startTime)}</span>
                    <span>{formatTime(s.bookingId?.startTime)} – {formatTime(s.bookingId?.endTime)}</span>
                  </div>

                  {/* Host + action */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      {s.hostUserId?.picture ? (
                        <img src={s.hostUserId.picture} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)]">
                          {s.hostUserId?.name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">{s.hostUserId?.name}</span>
                    </div>

                    {s.isHost ? (
                      <span className="text-[10px] font-mono text-[var(--accent-amber)]">Host</span>
                    ) : s.isJoined ? (
                      <button onClick={() => handleLeave(s._id)}
                        className="text-[10px] font-mono text-[var(--accent-red)] hover:underline">
                        Leave
                      </button>
                    ) : s.isFull ? (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">Full</span>
                    ) : (
                      <button onClick={() => handleJoin(s._id)}
                        className="px-3 py-1 text-[10px] font-mono font-bold bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity">
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === MY SESSIONS TAB === */}
      {tab === 'my' && (
        <div className="space-y-2">
          {mySessions.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">You haven't joined any sessions yet.</p>
            </div>
          ) : (
            mySessions.map((s) => (
              <div key={s._id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{s.title}</h3>
                    {s.isHost && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent-amber-dim)] text-[var(--accent-amber)]">HOST</span>}
                  </div>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">
                    {s.bookingId?.roomId?.name} · {formatDate(s.bookingId?.startTime)} · {formatTime(s.bookingId?.startTime)}
                  </p>
                </div>
                {!s.isHost && (
                  <button onClick={() => handleLeave(s._id)}
                    className="text-[10px] font-mono text-[var(--accent-red)] hover:underline">
                    Leave
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* === CREATE TAB === */}
      {tab === 'create' && (
        <div className="glass rounded-xl p-5 max-w-lg">
          <h3 className="font-display font-bold text-[var(--text-primary)] mb-4">Create Study Session</h3>

          {myBookings.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">You need an active room booking first. Go to Room Booking to reserve one.</p>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">BOOKING *</label>
                <select value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
                  <option value="">Select a booking...</option>
                  {myBookings.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.roomId?.name} · {formatDate(b.startTime)} {formatTime(b.startTime)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">TITLE *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., CS301 Exam Prep" maxLength={200}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">DESCRIPTION</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What will you study?" rows={2} maxLength={1000}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">TYPE</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
                    <option value="OPEN">Open (anyone can join)</option>
                    <option value="PRIVATE">Private (invite only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">MAX PARTICIPANTS</label>
                  <input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 2 })}
                    min={2} max={50}
                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">COURSE TAG</label>
                  <input type="text" value={form.courseTag} onChange={(e) => setForm({ ...form, courseTag: e.target.value })}
                    placeholder="CS301"
                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">TOPICS (comma sep)</label>
                  <input type="text" value={form.topicTags} onChange={(e) => setForm({ ...form, topicTags: e.target.value })}
                    placeholder="arrays, trees"
                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
                </div>
              </div>

              <button type="submit"
                className="w-full px-4 py-2.5 text-sm font-mono font-bold text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity mt-2">
                Create Session
              </button>
            </form>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up glass text-[var(--text-primary)]"
          style={{ boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default StudySessions;
