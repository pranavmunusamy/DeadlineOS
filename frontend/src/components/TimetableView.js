import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8);
const COLORS = ['#5b8af5', '#a78bfa', '#3dd68c', '#f5a623', '#f55b5b', '#ec4899', '#14b8a6', '#f97316'];

const TimetableView = () => {
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ courseName: '', courseId: '', day: 'Mon', startTime: '09:00', endTime: '10:30', location: '', professor: '', color: '#5b8af5' });
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([api.get('/timetable'), api.get('/courses')]);
      setEntries(t.data);
      setCourses(c.data);
    } catch { /* ok */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSlot = (day, hour) => entries.filter((e) => {
    const h = parseInt(e.startTime.split(':')[0]);
    return e.day === day && h === hour;
  });

  const openAdd = () => {
    setForm({ courseName: '', courseId: '', day: 'Mon', startTime: '09:00', endTime: '10:30', location: '', professor: '', color: COLORS[entries.length % COLORS.length] });
    setModal('add');
  };

  const openEdit = (entry) => {
    setForm({
      courseName: entry.courseName,
      courseId: entry.courseId?._id || entry.courseId || '',
      day: entry.day, startTime: entry.startTime, endTime: entry.endTime,
      location: entry.location || '', professor: entry.professor || '', color: entry.color || '#5b8af5',
    });
    setModal(entry);
  };

  const handleCourseSelect = (courseId) => {
    if (courseId) {
      const c = courses.find((x) => x._id === courseId);
      if (c) { setForm({ ...form, courseId, courseName: `${c.code} - ${c.name}`, professor: c.professor || form.professor, color: c.color || form.color }); return; }
    }
    setForm({ ...form, courseId: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.courseName.trim()) return showToast('Course name required');
    try {
      if (modal === 'add') { await api.post('/timetable', form); showToast('Class added'); }
      else { await api.put(`/timetable/${modal._id}`, form); showToast('Class updated'); }
      setModal(null); fetchData();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/timetable/${id}`); showToast('Class removed'); setModal(null); fetchData(); }
    catch { showToast('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm font-mono text-[var(--text-muted)]">Loading timetable...</p></div>;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Weekly Timetable</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)]">{entries.length} classes</span>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Class
          </button>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)]">
              <div className="p-2" />
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-mono font-semibold text-[var(--text-secondary)] border-l border-[var(--border)]">{d}</div>
              ))}
            </div>
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-[var(--border)] last:border-0">
                <div className="p-2 text-[10px] font-mono text-[var(--text-muted)] text-right pr-3 pt-3">
                  {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                </div>
                {DAYS.map((day) => {
                  const slots = getSlot(day, hour);
                  return (
                    <div key={day} className="border-l border-[var(--border)] min-h-[56px] p-1 relative">
                      {slots.map((slot) => (
                        <button key={slot._id} onClick={() => openEdit(slot)}
                          className="w-full text-left p-2 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{ background: `${slot.color}18`, borderLeft: `3px solid ${slot.color}` }}>
                          <p className="text-[11px] font-bold" style={{ color: slot.color }}>{slot.courseName}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">{slot.startTime}–{slot.endTime}</p>
                          {slot.location && <p className="text-[9px] text-[var(--text-muted)]">{slot.location}</p>}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No classes yet. Add your weekly schedule above.</p>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">{modal === 'add' ? 'Add Class' : 'Edit Class'}</h2>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {courses.length > 0 && (
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">LINK TO COURSE</label>
                  <select value={form.courseId} onChange={(e) => handleCourseSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none">
                    <option value="">Custom / None</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">CLASS NAME *</label>
                <input type="text" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  placeholder="e.g., CS301 - Data Structures" maxLength={100}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">DAY</label>
                  <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">START</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">END</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">LOCATION</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 201"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">PROFESSOR</label>
                  <input type="text" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} placeholder="Dr. Smith"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">COLOR</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {modal !== 'add' && (
                  <button type="button" onClick={() => handleDelete(modal._id)}
                    className="px-4 py-2.5 text-sm font-medium text-[var(--accent-red)] bg-[var(--accent-red-dim)] border border-[rgba(245,91,91,0.2)] rounded-lg hover:opacity-90">Delete</button>
                )}
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90">{modal === 'add' ? 'Add' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up glass text-[var(--text-primary)]" style={{ boxShadow: 'var(--shadow-lg)' }}>{toast}</div>}
    </div>
  );
};

export default TimetableView;
