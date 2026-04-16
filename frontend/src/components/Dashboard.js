import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import StatsBar from './StatsBar';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
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

  useNotifications(data?.upcoming || []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: dashData } = await getDashboard();
      setData(dashData);
    } catch (err) {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: result } = await syncEmails(50);
      showToast(result.message);
      await fetchDashboard();
    } catch (err) {
      const msg = err.response?.data?.error || 'Email sync failed';
      showToast(msg, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      await createTask(taskData);
      showToast('Task added');
      await fetchDashboard();
    } catch (err) {
      showToast('Failed to add task', 'error');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await updateTaskStatus(taskId, 'completed');
      await fetchDashboard();
    } catch {
      showToast('Failed to update task', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      showToast('Task deleted');
      await fetchDashboard();
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading your deadlines...</p>
        </div>
      </div>
    );
  }

  const { todaysFocus = [], upcoming = [], completed = [], stats } = data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSync={handleSync} syncing={syncing} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Today's Focus */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Today's Focus
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          </div>

          {todaysFocus.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No urgent tasks right now. You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysFocus.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Deadlines */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Deadlines</h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No upcoming deadlines. Sync your emails to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Completed ({completed.length})
            </h2>
            <div className="space-y-3 opacity-70">
              {completed.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddTask}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
