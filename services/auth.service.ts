import api from '@/lib/api';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password, role: 'PATIENT' });
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(form: {
    prenom:        string;
    nom:           string;
    email:         string;
    password:      string;
    dateNaissance: string;
  }) {
    await api.post('/auth/register', { ...form, role: 'PATIENT' });
    // Auto-login après inscription
    return authService.login(form.email, form.password);
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!authService.getToken();
  },
};