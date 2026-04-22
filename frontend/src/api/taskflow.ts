import { api, setStoredToken } from './client';
import type {
  AuthResponse,
  Dashboard,
  Project,
  Task,
  TaskStatus,
  User,
} from '../types/api';
import { TASK_STATUSES } from '../types/api';

export const auth = {
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

export const projectsApi = {
  list: () => api.get<Project[]>('/v1/projects'),
  get: (id: number) => api.get<Project>(`/v1/projects/${id}`),
  create: (body: { name: string; description?: string }) => api.post<Project>('/v1/projects', body),
  update: (id: number, body: { name?: string; description?: string | null }) =>
    api.put<Project>(`/v1/projects/${id}`, body),
  remove: (id: number) => api.delete(`/v1/projects/${id}`),
  addMember: (projectId: number, body: { email: string; role?: string }) =>
    api.post<Project>(`/v1/projects/${projectId}/members`, body),
  removeMember: (projectId: number, userId: number) =>
    api.delete(`/v1/projects/${projectId}/members/${userId}`),
};

export type TaskCreateBody = Partial<Pick<Task, 'body' | 'due_at' | 'assignee_id' | 'position'>> & {
  title: string;
  status: TaskStatus;
  assignee_ids?: number[];
};

export const tasksApi = {
  list: (projectId: number) => api.get<Task[]>(`/v1/projects/${projectId}/tasks`),
  create: (projectId: number, body: TaskCreateBody) =>
    api.post<Task>(`/v1/projects/${projectId}/tasks`, body),
  update: (projectId: number, taskId: number, body: Partial<TaskCreateBody & Pick<Task, 'title' | 'status'>>) =>
    api.put<Task>(`/v1/projects/${projectId}/tasks/${taskId}`, body),
  remove: (projectId: number, taskId: number) => api.delete(`/v1/projects/${projectId}/tasks/${taskId}`),
};

export const dashboardApi = {
  get: () => api.get<Dashboard>('/v1/dashboard'),
};

export { TASK_STATUSES };
