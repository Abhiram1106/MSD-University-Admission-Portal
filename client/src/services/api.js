import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable for backend URL, or fallback to same domain in production
// In production (when REACT_APP_API_URL is not set), use empty string for same-origin API calls
const API_BASE = process.env.REACT_APP_API_URL || '';
const API_URL = `${API_BASE}/api`;

console.log('API Configuration:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV,
  API_BASE,
  API_URL
});

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          localStorage.setItem('token', data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function for file uploads
const uploadFile = (url, formData) => {
  const token = localStorage.getItem('token');
  return axios.post(`${API_URL}${url}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  });
};

// API Methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`)
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data)
};

export const applicationAPI = {
  submit: (data) => api.post('/applications', data),
  getMy: () => api.get('/applications/me'),
  getById: (id) => api.get(`/applications/me/${id}`),
  getAll: (params) => api.get('/applications', { params }),
  updateStatus: (id, status, remarks) => 
    api.put(`/applications/${id}/status`, { status, remarks }),
  bulkApprove: (applicationIds) => 
    api.post('/applications/bulk-approve', { applicationIds }),
  bulkReject: (applicationIds, remarks) => 
    api.post('/applications/bulk-reject', { applicationIds, remarks }),
  exportCSV: (params) => api.get('/applications/export/csv', { params }),
  exportExcel: (params) => api.get('/applications/export/excel', { params }),
  exportStatistics: () => api.get('/applications/export/statistics'),
  generateOffer: (id) => api.post(`/applications/${id}/generate-offer`),
  confirmAdmission: (id) => api.post(`/applications/${id}/confirm-admission`),
  getStatistics: () => api.get('/applications/admin/statistics'),
  getAnalytics: () => api.get('/applications/admin/analytics'),
  getSummaryReport: () => api.get('/applications/reports/summary')
};

export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`)
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

export const announcementAPI = {
  getAll: (targetAudience) => 
    api.get('/announcements', { params: { targetAudience } }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`)
};

export const contactAPI = {
  submit: (data) => api.post('/contact', data),
  getMyQueries: () => api.get('/contact/my-queries'),
  getAllQueries: (status) => api.get('/contact', { params: { status } }),
  reply: (id, reply, status) => 
    api.put(`/contact/${id}/reply`, { reply, status })
};

export const formProgressAPI = {
  get: () => api.get('/form-progress'),
  save: (step, formData) => api.post('/form-progress', { step, formData }),
  clear: () => api.delete('/form-progress')
};

export const admissionCycleAPI = {
  getActive: () => axios.get(`${API_URL}/admission-cycle/active`),
  getAll: () => api.get('/admission-cycle'),
  create: (data) => api.post('/admission-cycle', data),
  update: (id, data) => api.put(`/admission-cycle/${id}`, data),
  toggleApplications: (id) => api.put(`/admission-cycle/${id}/toggle-applications`),
  delete: (id) => api.delete(`/admission-cycle/${id}`)
};

export const smartAPI = {
  recommendCourses: (data) => api.post('/smart/recommend-courses', data),
  getMeritList: (params) => api.get('/smart/merit-list', { params }),
  getProgramTrends: () => api.get('/smart/program-trends'),
  predictAdmission: (data) => api.post('/smart/predict-admission', data),
  chatbot: (message) => api.post('/smart/chatbot', { message }),
  getFAQs: (category) => api.get(`/smart/faqs/${category}`),
  getFAQCategories: () => api.get('/smart/faqs-categories'),
  searchFAQs: (query) => api.get('/smart/faqs-search', { params: { q: query } }),
  getTranslations: (lang) => api.get(`/smart/translations/${lang}`),
  getLanguages: () => api.get('/smart/languages')
};

// Error handler helper
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  // Network error (no response from server)
  if (!error.response) {
    const message = error.message === 'Network Error' 
      ? 'Unable to connect to server. Please check your internet connection and try again.'
      : error.message || 'Network error occurred';
    toast.error(message);
    return message;
  }
  
  // Server responded with error
  const message = error.response?.data?.msg || error.response?.data?.message || error.message || 'An error occurred';
  toast.error(message);
  return message;
};

// Success handler helper
export const handleAPISuccess = (message) => {
  toast.success(message);
};

export default api;
