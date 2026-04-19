import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  register: (data) => api.post('/accounts/register/', data),
  logout: () => api.post('/accounts/logout/'),
  checkAdmin: () => api.get('/accounts/check-admin/'),
  getProfile: () => api.get('/accounts/profile/'),
};

// Tyre Sizes API
export const tyreSizeAPI = {
  getAll: () => api.get('/tyres/tyre-sizes/'),
  getAvailable: () => api.get('/tyres/tyre-sizes/available/'),
  create: (data) => api.post('/tyres/tyre-sizes/', data),
  update: (id, data) => api.put(`/tyres/tyre-sizes/${id}/`, data),
  delete: (id) => api.delete(`/tyres/tyre-sizes/${id}/`),
  getById: (id) => api.get(`/tyres/tyre-sizes/${id}/`),
};

// Customers API
export const customerAPI = {
  getAll: () => api.get('/tyres/customers/'),
  getById: (id) => api.get(`/tyres/customers/${id}/`),
  create: (data) => api.post('/tyres/customers/', data),
  update: (id, data) => api.put(`/tyres/customers/${id}/`, data),
  delete: (id) => api.delete(`/tyres/customers/${id}/`),
  search: (query) => api.get(`/tyres/customers/search/?q=${query}`),
};

// Remoulding Jobs API
export const remouldingJobAPI = {
  getAll: (params) => api.get('/tyres/remoulding-jobs/', { params }),
  getById: (id) => api.get(`/tyres/remoulding-jobs/${id}/`),
  create: (data) => api.post('/tyres/remoulding-jobs/', data),
  update: (id, data) => api.put(`/tyres/remoulding-jobs/${id}/`, data),
  updateStatus: (id, status) => api.post(`/tyres/remoulding-jobs/${id}/update_status/`, { status }),
  delete: (id) => api.delete(`/tyres/remoulding-jobs/${id}/`),
  getInProgress: (params) => api.get('/tyres/remoulding-jobs/in_progress/', { params }),
  getCustomerTyres: (params) => api.get('/tyres/remoulding-jobs/customer_tyres/', { params }),
  getInvoice: (id) => api.get(`/tyres/remoulding-jobs/${id}/invoice/`, { responseType: 'blob' }),
  sendInvoice: (id) => api.post(`/tyres/remoulding-jobs/${id}/send_invoice/`),
};

// Stock API
export const stockAPI = {
  getAll: () => api.get('/tyres/stock/'),
  getSummary: () => api.get('/tyres/stock/summary/'),
  getForSale: (tyreSize) => api.get('/tyres/stock/for_sale/', { params: { tyre_size: tyreSize } }),
  update: (id, data) => api.put(`/tyres/stock/${id}/`, data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/tyres/dashboard/stats/'),
};

// Public API (no auth required)
export const publicAPI = {
  getCompanyInfo: () => axios.get(`${API_URL}/tyres/company-info/public/`),
  getTestimonials: () => axios.get(`${API_URL}/tyres/testimonials/active/`),
  getGallery: (category) => axios.get(`${API_URL}/tyres/gallery/by_category/`, { params: { category } }),
  getAvailableTyres: () => axios.get(`${API_URL}/tyres/tyre-sizes/available/`),
};

// Admin-only APIs
export const adminAPI = {
  getCompanyInfo: () => api.get('/tyres/company-info/'),
  updateCompanyInfo: (id, data) => api.put(`/tyres/company-info/${id}/`, data),
  getTestimonials: () => api.get('/tyres/testimonials/'),
  createTestimonial: (data) => api.post('/tyres/testimonials/', data),
  updateTestimonial: (id, data) => api.put(`/tyres/testimonials/${id}/`, data),
  deleteTestimonial: (id) => api.delete(`/tyres/testimonials/${id}/`),
  getGallery: () => api.get('/tyres/gallery/'),
  createGalleryImage: (data) => api.post('/tyres/gallery/', data),
  updateGalleryImage: (id, data) => api.put(`/tyres/gallery/${id}/`, data),
  deleteGalleryImage: (id) => api.delete(`/tyres/gallery/${id}/`),
};

export default api;
