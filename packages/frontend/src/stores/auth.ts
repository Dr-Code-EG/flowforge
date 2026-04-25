import { defineStore } from 'pinia';
import type { User } from '@flowforge/shared';
import { api } from '../api';

interface State {
  token: string | null;
  user: User | null;
  ready: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    token: localStorage.getItem('flowforge_token'),
    user: null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    async bootstrap() {
      if (this.ready) return;
      if (this.token) {
        try {
          const r = await api.get('/api/auth/me');
          this.user = r.data;
        } catch {
          this.token = null;
          localStorage.removeItem('flowforge_token');
        }
      }
      this.ready = true;
    },
    async login(email: string, password: string) {
      const r = await api.post('/api/auth/login', { email, password });
      this.token = r.data.token;
      this.user = r.data.user;
      localStorage.setItem('flowforge_token', r.data.token);
    },
    async register(email: string, name: string, password: string) {
      const r = await api.post('/api/auth/register', { email, name, password });
      this.token = r.data.token;
      this.user = r.data.user;
      localStorage.setItem('flowforge_token', r.data.token);
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('flowforge_token');
    },
  },
});
