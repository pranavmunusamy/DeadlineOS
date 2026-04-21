import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const COLORS = ['#5b8af5', '#a78bfa', '#3dd68c', '#f5a623', '#f55b5b', '#ec4899', '#14b8a6', '#f97316'];

const CourseList = ({ tasks = [] }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add'
  const [form, setForm] = useState({ name: '', code: '', professor: '', color: '#5b8af5', credits: 3 });
  const [toast, setToast] = useState('');
  const [linkModal, setLinkModal] = useState(null); // courseId to link tasks to

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch { /* ok */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return showToast('Name and code required');
    try {
      await api.post('/courses', form);
      showToast('Course created');
      setModal(null);
      setForm({ name: '', code: '', professor: '', color: '#5b8af5', credits: 3 });
      fetchCourses();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to create'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/courses/${id}`);
      showToast('Course deleted');
      fetchCourses();
    } catch { showToast('Failed to delete'); }
  };

  const handleLinkTask = async (courseId, taskId) => {
    try {
      await api.post(`/courses/${courseId}/link-task/${taskId}`);
      showToast('Task linked');
      setLinkModal(null);
      fetchCourses();
    } catch { showToast('Failed to link'); }
  };

  // Get unlinked tasks for the link modal
  const unlinkedTasks = tasks.filter((t) => !t.courseId && t.status === 'pending');

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm font-mono text-[var(--text-muted)]">Loading courses...</p></div>;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">My Courses</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)]">{courses.length} enrolled</span>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[var(--accent-blue)] text-white rounded-lg hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Course
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No courses yet. Add your courses to start tracking progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <div key={course._id} className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all animate-fade-up group"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-1 opacity-80" style={{ background: course.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ background: `${course.color}18`, color: course.color }}>{course.code}</span>
                    <h3 className="font-display font-bold text-[var(--text-primary)] text-sm mt-2">{course.name}</h3>
                    {course.professor && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{course.professor}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setLinkModal(course._id)}
                      className="text-[9px] font-mono text-[var(--accent-blue)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline" title="Link tasks">
                      +link
                    </button>
                    <button onClick={() => handleDelete(course._id)}
                      className="text-[9px] font-mono text-[var(--accent-red)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline ml-2">
                      del
                    </button>
                  </div>
                </div>

                {/* Schedule slots */}
                {course.schedule?.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {course.schedule.map((s) => `${s.day} ${s.startTime}`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Real progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {course.stats.completed}/{course.stats.total} tasks
                    </span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: course.color }}>
                      {course.stats.progress}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill transition-all duration-700"
                      style={{ width: `${course.stats.progress}%`, background: course.color }} />
                  </div>
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{course.stats.pending} pending</span>
                    {course.stats.overdue > 0 && (
                      <span className="text-[10px] font-mono text-[var(--accent-red)]">{course.stats.overdue} overdue</span>
                    )}
                  </div>
                  {course.nextDeadline && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      next: {new Date(course.nextDeadline.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="glass rounded-2xl w-full max-w-md p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-5">Add Course</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">COURSE CODE *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS301" maxLength={20}
                  className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">COURSE NAME *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Data Structures" maxLength={200}
                  className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:border-[var(--accent-blue)] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">PROFESSOR</label>
                  <input type="text" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })}
                    placeholder="Dr. Smith"
                    className="w-full px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">CREDITS</label>
                  <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: parseInt(e.target.value) || 3 })}
                    min={1} max={10}
                    className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg focus:outline-none" />
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
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)]">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Task Modal */}
      {linkModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4" onClick={() => setLinkModal(null)}>
          <div className="glass rounded-2xl w-full max-w-sm p-6 animate-fade-up" style={{ background: 'var(--bg-elevated)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-4">Link Tasks to Course</h2>
            {unlinkedTasks.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">All pending tasks are already linked to courses.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unlinkedTasks.map((t) => (
                  <button key={t._id} onClick={() => handleLinkTask(linkModal, t._id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" />
                    <span className="text-xs text-[var(--text-primary)] truncate">{t.title}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setLinkModal(null)}
              className="w-full mt-3 px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)]">Close</button>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up glass text-[var(--text-primary)]" style={{ boxShadow: 'var(--shadow-lg)' }}>{toast}</div>}
    </div>
  );
};

export default CourseList;
