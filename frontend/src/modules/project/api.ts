import { api } from '../../api/client';
import type { Project } from '../../types/api';

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
