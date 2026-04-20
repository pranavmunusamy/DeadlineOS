import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import StatsBar from './StatsBar';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import CalendarView from './CalendarView';
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('deadlineos_dark') === 'true');
  const [showCompleted, setShowCompleted] = useState(false);

  useNotifications(data?.upcoming || []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('deadlineos_dark', darkMode);
  }, [darkMode]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading DeadlineOS...</p>
        </div>
      </div>
    );
  }

  const { todaysFocus = [], upcoming = [], completed = [], stats } = data || {};
  const allTasks = [...upcoming, ...completed];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header onSync={handleSync} syncing={syncing} darkMode={darkMode} setDarkMode={setDarkMode} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsBar stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content - 2 cols */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Focus */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Today's Focus
                    </h2>
                    <button onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Task
                    </button>
                  </div>
                  {todaysFocus.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <span className="text-4xl mb-3 block">🎉</span>
                      <p className="text-gray-500 dark:text-gray-400">No urgent tasks! You're all caught up.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysFocus.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} />)}
                    </div>
                  )}
                </section>

                {/* Upcoming */}
                <section>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Upcoming Deadlines</h2>
                  {upcoming.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No upcoming deadlines. Sync your emails to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} compact />)}
                    </div>
                  )}
                </section>

                {/* Completed */}
                {completed.length > 0 && (
                  <section>
                    <button onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3">
                      <svg className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Completed ({completed.length})
                    </button>
                    {showCompleted && (
                      <div className="space-y-2 opacity-60">
                        {completed.map((t) => <TaskCard key={t._id} task={t} onComplete={handleComplete} onDelete={handleDelete} compact />)}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Sidebar - 1 col */}
              <div className="space-y-4">
                <AISuggestions />

                {/* Mini calendar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Quick View</h3>
                  <div className="space-y-2">
                    {upcoming.slice(0, 5).map((t) => (
                      <div key={t._id} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          t.priority === 'HIGH' ? 'bg-red-500' : t.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="truncate text-gray-700 dark:text-gray-300 flex-1">{t.title}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4 text-center">
                  <span className="text-3xl">🔥</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">7 Days</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current streak</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && <CalendarView tasks={allTasks} />}
        {activeTab === 'courses' && <CourseList tasks={allTasks} />}
        {activeTab === 'analytics' && <AnalyticsView stats={stats} />}
        {activeTab === 'office-hours' && <OfficeHours />}
      </main>

      {/* Floating Add Button (mobile) */}
      <button onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all hover:scale-110 md:hidden z-20">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <AddTaskModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
