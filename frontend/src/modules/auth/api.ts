import { api, setStoredToken } from '../../api/client';
import type { AuthResponse, User } from '../../types/api';

export const authApi = {
  async register(body: { name: string; email: string; password: string; password_confirmation: string }) {
    const { data } = await api.post<AuthResponse>('/v1/auth/register', body);
    setStoredToken(data.access_token);
    return data;
  },
  async login(body: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>('/v1/auth/login', body);
    setStoredToken(data.access_token);
    return data;
  },
  async me() {
    const { data } = await api.get<User>('/v1/auth/me');
    return data;
  },
  logout() {
    setStoredToken(null);
  },
  async logoutRemote() {
    try {
      await api.post('/v1/auth/logout');
    } finally {
      setStoredToken(null);
    }
  },
};
