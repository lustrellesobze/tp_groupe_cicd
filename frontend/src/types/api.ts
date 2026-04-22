export type User = {
  id: number;
  name: string;
  email: string;
};

export type Project = {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  tasks_count?: number;
  owner?: User;
  members?: User[];
  pivot?: { role: string };
};

export const TASK_STATUSES = ['backlog', 'in_progress', 'review', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = {
  id: number;
  project_id: number;
  title: string;
  body: string | null;
  status: TaskStatus;
  position: number;
  assignee_id: number | null;
  due_at: string | null;
  assignee?: { id: number; name: string; email: string } | null;
  /** Tous les contributeurs (assignation multiple). */
  assignees?: { id: number; name: string; email: string }[] | null;
};

export type Dashboard = {
  projects_count: number;
  tasks_total: number;
  tasks_by_status: Record<string, number>;
  tasks_assigned_to_me: number;
  completion_rate: number;
  due_soon_count: number;
  /** Prochaines tâches avec échéance (hors « terminé »), tri par date. */
  upcoming_due: {
    id: number;
    title: string;
    status: string;
    due_at: string;
    project: string | null;
  }[];
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};
