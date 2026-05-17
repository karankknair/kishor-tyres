import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  logout: () => api.post('/accounts/logout/'),
  checkAdmin: () => api.get('/accounts/check-admin/'),
  getProfile: () => api.get('/accounts/profile/'),
};

export const tyreSizeAPI = {
  getAll: () => api.get('/tyres/tyre-sizes/'),
  getPublic: () => axios.get(`${API_URL}/tyres/tyre-sizes/public/`),
  getAvailable: () => axios.get(`${API_URL}/tyres/tyre-sizes/available/`),
  create: (data) => api.post('/tyres/tyre-sizes/', data),
  update: (id, data) => api.put(`/tyres/tyre-sizes/${id}/`, data),
  delete: (id) => api.delete(`/tyres/tyre-sizes/${id}/`),
};

export const rateCardAPI = {
  getAll: (params) => api.get('/tyres/rate-cards/', { params }),
  create: (data) => api.post('/tyres/rate-cards/', data),
  update: (id, data) => api.put(`/tyres/rate-cards/${id}/`, data),
  delete: (id) => api.delete(`/tyres/rate-cards/${id}/`),
  lookup: (params) => api.get('/tyres/rate-cards/lookup/', { params }),
  getSubTypes: (type) => api.get(`/tyres/rate-cards/sub_types/?type=${type}`),
};

export const customerAPI = {
  getAll: () => api.get('/tyres/customers/'),
  getById: (id) => api.get(`/tyres/customers/${id}/`),
  create: (data) => api.post('/tyres/customers/', data),
  update: (id, data) => api.put(`/tyres/customers/${id}/`, data),
  delete: (id) => api.delete(`/tyres/customers/${id}/`),
  search: (query) => api.get(`/tyres/customers/search/?q=${query}`),
};

export const remouldingJobAPI = {
  getAll: (params) => api.get('/tyres/remoulding-jobs/', { params }),
  getById: (id) => api.get(`/tyres/remoulding-jobs/${id}/`),
  create: (data) => api.post('/tyres/remoulding-jobs/', data),
  update: (id, data) => api.put(`/tyres/remoulding-jobs/${id}/`, data),
  updateStatus: (id, status) =>
    api.post(`/tyres/remoulding-jobs/${id}/update_status/`, { status }),
  delete: (id) => api.delete(`/tyres/remoulding-jobs/${id}/`),
  getInProgress: (params) => api.get('/tyres/remoulding-jobs/in_progress/', { params }),
  getOverdue: () => api.get('/tyres/remoulding-jobs/overdue/'),
  getCustomerTyres: (params) => api.get('/tyres/remoulding-jobs/customer_tyres/', { params }),
  getInvoice: (id) =>
    api.get(`/tyres/remoulding-jobs/${id}/invoice/`, { responseType: 'blob' }),
  sendInvoice: (id) => api.post(`/tyres/remoulding-jobs/${id}/send_invoice/`),
};

export const stockAPI = {
  getAll: () => api.get('/tyres/stock/'),
  getSummary: () => api.get('/tyres/stock/summary/'),
  getForSale: (tyreSize) =>
    api.get('/tyres/stock/for_sale/', { params: { tyre_size: tyreSize } }),
  update: (id, data) => api.put(`/tyres/stock/${id}/`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/tyres/dashboard/stats/'),
};

export const ocrAPI = {
  extract: (imageFile) => {
    const form = new FormData();
    form.append('image', imageFile);
    return api.post('/tyres/ocr/extract/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const publicAPI = {
  getCompanyInfo: () => axios.get(`${API_URL}/tyres/company-info/public/`),
  getTestimonials: () => axios.get(`${API_URL}/tyres/testimonials/active/`),
  getGallery: (category) =>
    axios.get(`${API_URL}/tyres/gallery/by_category/`, { params: { category } }),
  getAvailableTyres: () => axios.get(`${API_URL}/tyres/tyre-sizes/available/`),
  getTyreSizesGrouped: () => axios.get(`${API_URL}/tyres/tyre-sizes/public/`),
};

// Converts a plain object to FormData (needed for file uploads).
// Values that are null/undefined are skipped; File objects are appended as-is.
const toFormData = (data) => {
  const fd = new FormData();
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && val !== undefined) fd.append(key, val);
  }
  return fd;
};

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const adminAPI = {
  // Company Info
  getCompanyInfo: () => api.get('/tyres/company-info/'),
  updateCompanyInfo: (id, data) =>
    api.patch(`/tyres/company-info/${id}/`, toFormData(data), multipart),
  createCompanyInfo: (data) =>
    api.post('/tyres/company-info/', toFormData(data), multipart),

  // Testimonials
  getTestimonials: () => api.get('/tyres/testimonials/'),
  createTestimonial: (data) =>
    api.post('/tyres/testimonials/', toFormData(data), multipart),
  updateTestimonial: (id, data) =>
    api.patch(`/tyres/testimonials/${id}/`, toFormData(data), multipart),
  deleteTestimonial: (id) => api.delete(`/tyres/testimonials/${id}/`),

  // Gallery
  getGallery: () => api.get('/tyres/gallery/'),
  createGalleryImage: (data) =>
    api.post('/tyres/gallery/', toFormData(data), multipart),
  updateGalleryImage: (id, data) =>
    api.patch(`/tyres/gallery/${id}/`, toFormData(data), multipart),
  deleteGalleryImage: (id) => api.delete(`/tyres/gallery/${id}/`),
};

export default api;
