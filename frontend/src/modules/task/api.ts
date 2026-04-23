import { api } from '../../api/client';
import type { Task, TaskStatus } from '../../types/api';

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
