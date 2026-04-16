import { useEffect, useCallback } from 'react';

const useNotifications = (tasks) => {
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'deadlineos-urgent',
      });
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Check for tasks due within 24 hours
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const urgentTasks = tasks.filter((t) => {
      if (t.status !== 'pending') return false;
      const deadline = new Date(t.deadline);
      return deadline <= in24Hours && deadline >= now;
    });

    if (urgentTasks.length > 0) {
      sendNotification(
        'DeadlineOS - Urgent!',
        `You have ${urgentTasks.length} task${urgentTasks.length > 1 ? 's' : ''} due within 24 hours`
      );
    }
  }, [tasks, sendNotification]);

  return { requestPermission, sendNotification };
};

export default useNotifications;
