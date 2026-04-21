import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import StatsBar from './StatsBar';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import CalendarView from './CalendarView';
import TimetableView from './TimetableView';
import RoomBooking from './RoomBooking';
import StudySessions from './StudySessions';
import RoomAnalytics from './RoomAnalytics';
import CourseList from './CourseList';
import AnalyticsView from './AnalyticsView';
import OfficeHours from './OfficeHours';
import AISuggestions from './AISuggestions';
import useNotifications from '../hooks/useNotifications';
import {
  getDashboard,
  createTask,
  updateTaskStatus,
  deleteTask,
  syncEmails,
} from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCompleted, setShowCompleted] = useState(false);

  useNotifications(data?.upcoming || []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: d } = await getDashboard();
      setData(d);
    } catch {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: result } = await syncEmails(50);
      showToast(result.message);
      await fetchDashboard();
    } catch (err) {
      showToast(err.response?.data?.error || 'Email sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await createTask(taskData);
      showToast('Task added');
      await fetchDashboard();
    } catch { showToast('Failed to add task', 'error'); }
  };

  const handleComplete = async (id) => {
    try {
      await updateTaskStatus(id, 'completed');
      await fetchDashboard();
    } catch { showToast('Failed to update', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      showToast('Task deleted');
      await fetchDashboard();
    } catch { showToast('Failed to delete', 'error'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[var(--accent-blue-dim)] animate-pulse">
            <svg className="w-6 h-6 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-mono text-[var(--text-muted)]">Loading DeadlineOS...</p>
        </div>
      </div>
    );
  }

  const { todaysFocus = [], upcoming = [], completed = [], stats } = data || {};
  const allTasks = [...upcoming, ...completed];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] bg-grid">
      <Header onSync={handleSync} syncing={syncing} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsBar stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Focus */}
                <section className="animate-fade-up stagger-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--accent-red)] rounded-full animate-pulse" />
                      Today's Focus
                    </h2>
                    <button onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-blue)] text-white text-xs font-mono font-bold rounded-lg hover:opacity-90 transition-opacity">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Task
                    </button>
                  </div>
                  {todaysFocus.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <span className="text-3xl mb-3 block">&#10003;</span>
                      <p className="text-sm text-[var(--text-muted)]">No urgent tasks. You're all caught up.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysFocus.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} />)}
                    </div>
                  )}
                </section>

                {/* Upcoming */}
                <section className="animate-fade-up stagger-2">
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)] mb-3">Upcoming</h2>
                  {upcoming.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <p className="text-sm text-[var(--text-muted)]">No upcoming deadlines. Sync your emails to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} compact />)}
                    </div>
                  )}
                </section>

                {/* Completed */}
                {completed.length > 0 && (
                  <section className="animate-fade-up stagger-3">
                    <button onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-3 transition-colors">
                      <svg className={`w-3.5 h-3.5 transition-transform ${showCompleted ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      COMPLETED ({completed.length})
                    </button>
                    {showCompleted && (
                      <div className="space-y-2 opacity-50">
                        {completed.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} compact />)}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <AISuggestions />

                {/* Quick view */}
                <div className="glass rounded-xl p-4 animate-fade-up stagger-5">
                  <h3 className="text-xs font-mono font-semibold text-[var(--text-muted)] mb-3">QUICK VIEW</h3>
                  <div className="space-y-2">
                    {upcoming.slice(0, 5).map((t) => (
                      <div key={t._id} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          t.priority === 'HIGH' ? 'bg-[var(--accent-red)]' : t.priority === 'MEDIUM' ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-green)]'
                        }`} />
                        <span className="truncate text-[var(--text-secondary)] flex-1">{t.title}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] flex-shrink-0">
                          {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                    {upcoming.length === 0 && (
                      <p className="text-[10px] text-[var(--text-muted)] text-center py-2">No tasks yet</p>
                    )}
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="glass rounded-xl p-4 text-center animate-fade-up stagger-6" style={{ background: 'var(--accent-amber-dim)', border: '1px solid rgba(245,166,35,0.15)' }}>
                  <span className="text-2xl block">&#9889;</span>
                  <p className="font-display text-xl font-bold text-[var(--accent-amber)] mt-1">
                    {stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">Completion rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && <CalendarView tasks={allTasks} />}
        {activeTab === 'timetable' && <TimetableView />}
        {activeTab === 'rooms' && <RoomBooking />}
        {activeTab === 'study-groups' && <StudySessions />}
        {activeTab === 'courses' && <CourseList tasks={allTasks} />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'room-analytics' && <RoomAnalytics />}
        {activeTab === 'office-hours' && <OfficeHours />}
      </main>

      {/* Floating Add Button */}
      <button onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[var(--accent-blue)] text-white rounded-full shadow-lg hover:opacity-90 flex items-center justify-center transition-all hover:scale-110 z-20"
        style={{ boxShadow: '0 4px 24px rgba(91,138,245,0.3)' }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <AddTaskModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-xs font-mono font-bold z-50 animate-fade-up ${
          toast.type === 'error'
            ? 'bg-[var(--accent-red)] text-white'
            : 'glass text-[var(--text-primary)]'
        }`} style={{ boxShadow: 'var(--shadow-lg)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
