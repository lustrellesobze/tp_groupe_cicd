import axios, { type AxiosError } from 'axios';

const base = import.meta.env.VITE_API_BASEURL ?? '/api';

export const api = axios.create({ baseURL: base });

const TOKEN = 'tf_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN, token);
  } else {
    localStorage.removeItem(TOKEN);
  }
}

api.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export function isAxios401(err: unknown) {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export function extractMessage(err: unknown) {
  const e = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  if (e.response?.data && typeof e.response.data === 'object' && e.response.data !== null) {
    if ('message' in e.response.data && typeof e.response.data.message === 'string') {
      return e.response.data.message;
    }
  }
  return 'Erreur réseau ou serveur';
}
