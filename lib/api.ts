import axios from 'axios';

const api = axios.create({
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// ── Request interceptor — attach JWT token ────────────────────────────────────
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    const isLoginRoute = error.config?.url?.includes('/auth/login');
    const is401        = error.response?.status === 401;

    if (is401 && !isLoginRoute && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?reason=expired';
      }
    }

    return Promise.reject(error);
  }
);

export default api;