import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const OfficeHours = () => {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | slot object (for booking)
  const [form, setForm] = useState({ professorName: '', professorEmail: '', courseName: '', courseId: '', day: 'Monday', startTime: '14:00', endTime: '16:00', location: '', capacity: 3 });
  const [bookForm, setBookForm] = useState({ bookingDate: '', message: '' });
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('slots'); // 'slots' | 'bookings'

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [s, b, c] = await Promise.all([
        api.get('/office-hours'),
        api.get('/office-hours/my-bookings'),
        api.get('/courses'),
      ]);
      setSlots(s.data);
      setBookings(b.data);
      setCourses(c.data);
    } catch { /* ok */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = slots.filter((s) =>
    s.professorName.toLowerCase().includes(search.toLowerCase()) ||
    (s.courseName || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ professorName: '', professorEmail: '', courseName: '', courseId: '', day: 'Monday', startTime: '14:00', endTime: '16:00', location: '', capacity: 3 });
    setModal('add');
  };

  const openBook = (slot) => {
    const dayIdx = DAYS.indexOf(slot.day);
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7;
    let diff = dayIdx - currentDay;
    if (diff <= 0) diff += 7;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + diff);
    setBookForm({ bookingDate: nextDate.toISOString().split('T')[0], message: '' });
    setModal(slot);
  };

  const handleCourseSelect = (courseId) => {
    if (courseId) {
      const c = courses.find((x) => x._id === courseId);
      if (c) {
        setForm({ ...form, courseId, courseName: `${c.code} - ${c.name}`, professorName: c.professor || form.professorName });
        return;
      }
    }
    setForm({ ...form, courseId: '' });
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!form.professorName.trim() || !form.day || !form.startTime || !form.endTime) return showToast('Professor, day, and times required');
    try {
      await api.post('/office-hours', form);
      showToast('Office hour slot added');
      setModal(null);
      fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to add'); }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await api.delete(`/office-hours/${id}`);
      showToast('Slot deleted');
      fetchData();
    } catch { showToast('Failed to delete'); }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookForm.bookingDate) return showToast('Select a date');
    try {
      const { data } = await api.post(`/office-hours/${modal._id}/book`, bookForm);
      showToast(data.message || 'Booked!');
      setModal(null);
      fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to book'); }
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.delete(`/office-hours/booking/${id}`);
      showToast('Booking cancelled');
      fetchData();
    } catch { showToast('Failed to cancel'); }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm font-mono text-[var(--text-muted)]">Loading office hours...</p></div>;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Office Hours</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
            {['slots', 'bookings'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition-all ${tab === t ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                {t === 'slots' ? `Slots (${slots.length})` : `Bookings (${bookings.length})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search professor or course..."
              className="pl-9 pr-4 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none transition-colors w-52 font-mono text-xs" />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Slot
          </button>
        </div>
      </div>

      {tab === 'slots' && (
        <>
          {filtered.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">{search ? `No office hours found for "${search}"` : 'No office hour slots yet. Add your professors\' office hours to start booking.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((slot, i) => (
                <div key={slot._id} className="glass rounded-xl p-4 hover:scale-[1.01] transition-all animate-fade-up group"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-[var(--text-primary)] text-sm">{slot.professorName}</h3>
                      {slot.courseName && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-1 inline-block"
                          style={{ background: slot.courseId?.color ? `${slot.courseId.color}18` : 'var(--accent-blue-dim)', color: slot.courseId?.color || 'var(--accent-blue)' }}>
                          {slot.courseId?.code || slot.courseName}
                        </span>
                      )}
                    </div>
                    <button onClick={() => handleDeleteSlot(slot._id)}
                      className="text-[9px] font-mono text-[var(--accent-red)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                      del
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">{slot.day}, {formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                    </div>
                    {slot.location && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[11px] font-mono text-[var(--text-secondary)]">{slot.location}</span>
                      </div>
                    )}
                    {slot.professorEmail && (
                      <div className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">{slot.professorEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      slot.available
                        ? 'bg-[var(--accent-green-dim)] text-[var(--accent-green)]'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {slot.available ? `${slot.capacity - slot.bookedCount} / ${slot.capacity} open` : 'Full'}
                    </span>
                    <button onClick={() => openBook(slot)} disabled={!slot.available}
                      className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                        slot.available
                          ? 'bg-[var(--accent-blue)] text-white hover:opacity-90'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}>
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'bookings' && (
        <>
          {bookings.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No upcoming bookings. Book an office hour slot to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b, i) => (
                <div key={b._id} className="glass rounded-xl p-4 animate-fade-up flex items-center justify-between"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{b.slotId?.professorName || 'Professor'}</p>
                      <p className="text-[11px] font-mono text-[var(--text-muted)]">
                        {new Date(b.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {b.slotId && ` · ${formatTime(b.slotId.startTime)} - ${formatTime(b.slotId.endTime)}`}
                      </p>
                      {b.slotId?.courseId && <span className="text-[10px] font-mono text-[var(--accent-blue)]">{b.slotId.courseId.code} - {b.slotId.courseId.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.emailSent && (
                      <span className="text-[9px] font-mono text-[var(--accent-green)] bg-[var(--accent-green-dim)] px-2 py-0.5 rounded-full">email sent</span>
                    )}
                    <button onClick={() => handleCancelBooking(b._id)}
                      className="text-[10px] font-mono text-[var(--accent-red)] hover:underline">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Slot Modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-5">Add Office Hour Slot</h2>
            <form onSubmit={handleCreateSlot} className="space-y-3">
              {courses.length > 0 && (
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">LINK TO COURSE</label>
                  <select value={form.courseId} onChange={(e) => handleCourseSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
                    <option value="">None</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">PROFESSOR NAME *</label>
                  <input type="text" value={form.professorName} onChange={(e) => setForm({ ...form, professorName: e.target.value })}
                    placeholder="Dr. Smith"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">PROFESSOR EMAIL</label>
                  <input type="email" value={form.professorEmail} onChange={(e) => setForm({ ...form, professorEmail: e.target.value })}
                    placeholder="smith@uni.edu"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">DAY *</label>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none">
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">START *</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">END *</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">LOCATION</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="CS 302"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">CAPACITY</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                    min={1} max={20}
                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Slot Modal */}
      {modal && modal !== 'add' && modal._id && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl w-full max-w-sm p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-1">Book Office Hours</h2>
            <p className="text-xs text-[var(--text-muted)] mb-5">{modal.professorName} · {modal.day} {formatTime(modal.startTime)} - {formatTime(modal.endTime)}</p>
            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">DATE *</label>
                <input type="date" value={bookForm.bookingDate} onChange={(e) => setBookForm({ ...bookForm, bookingDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">MESSAGE (OPTIONAL)</label>
                <textarea value={bookForm.message} onChange={(e) => setBookForm({ ...bookForm, message: e.target.value })}
                  placeholder="Reason for visit..." rows={3}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none resize-none" />
              </div>
              {modal.professorEmail && (
                <p className="text-[10px] font-mono text-[var(--accent-green)]">
                  A confirmation email will be sent to {modal.professorEmail}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up glass text-[var(--text-primary)]" style={{ boxShadow: 'var(--shadow-lg)' }}>{toast}</div>}
    </div>
  );
};

export default OfficeHours;
