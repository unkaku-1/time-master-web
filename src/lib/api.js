import axios from 'axios';

// API base URL - 在生产环境中应该从环境变量获取
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  syncLdapUsers: () => api.post('/auth/sync-ldap'),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params = {}) => api.get('/tasks', { params }),
  createTask: (task) => api.post('/tasks', task),
  getTask: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, task) => api.put(`/tasks/${id}`, task),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  createSubtask: (parentId, subtask) => api.post(`/tasks/${parentId}/subtasks`, subtask),
  getSubtasks: (parentId) => api.get(`/tasks/${parentId}/subtasks`),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUsageReport: (days = 30) => api.get('/admin/reports/usage', { params: { days } }),
  
  // LDAP Settings
  getLdapSettings: () => api.get('/admin/settings/ldap'),
  updateLdapSettings: (settings) => api.put('/admin/settings/ldap', settings),
  
  // SMTP Settings
  getSmtpSettings: () => api.get('/admin/settings/smtp'),
  updateSmtpSettings: (settings) => api.put('/admin/settings/smtp', settings),
  
  // General Settings
  getGeneralSettings: () => api.get('/admin/settings/general'),
  updateGeneralSettings: (settings) => api.put('/admin/settings/general', settings),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  createUser: (user) => api.post('/users', user),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, user) => api.put(`/users/${id}`, user),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;

