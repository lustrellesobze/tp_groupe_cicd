import { api } from '../../api/client';
import type { Dashboard } from '../../types/api';

export const dashboardApi = {
  get: () => api.get<Dashboard>('/v1/dashboard'),
};
