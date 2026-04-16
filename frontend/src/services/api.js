import axios from 'axios';

// In production, frontend is served by the same server, so use relative path
const API_BASE = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('deadlineos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('deadlineos_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const getLoginUrl = () => api.get('/auth/google');
export const getProfile = () => api.get('/auth/profile');

// Tasks
export const getDashboard = () => api.get('/tasks/dashboard');
export const getTasks = (params) => api.get('/tasks', { params });
export const createTask = (data) => api.post('/tasks', data);
export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Email sync
export const syncEmails = (count = 50) =>
  api.post(`/emails/sync?count=${count}`);

export default api;
