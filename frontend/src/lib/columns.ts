import { TASK_STATUSES, type TaskStatus } from '../types/api';

const LABELS: Record<TaskStatus, string> = {
  backlog: 'File d’attente',
  in_progress: 'En cours',
  review: 'Revue',
  done: 'Terminé',
};

const COLORS: Record<TaskStatus, string> = {
  backlog: 'var(--col-backlog)',
  in_progress: 'var(--col-in-progress)',
  review: 'var(--col-review)',
  done: 'var(--col-done)',
};

/** Même sémantique que le board ; valeurs explicites pour Recharts (SVG). */
const CHART_HEX: Record<TaskStatus, string> = {
  backlog: '#6b7280',
  in_progress: '#2563eb',
  review: '#d97706',
  done: '#059669',
};

export function statusLabel(s: string): string {
  if (TASK_STATUSES.includes(s as TaskStatus)) {
    return LABELS[s as TaskStatus];
  }
  return s;
}

export function statusColor(s: string): string {
  if (TASK_STATUSES.includes(s as TaskStatus)) {
    return COLORS[s as TaskStatus];
  }
  return 'var(--tf-text-muted)';
}

export function statusChartColor(s: string): string {
  if (TASK_STATUSES.includes(s as TaskStatus)) {
    return CHART_HEX[s as TaskStatus];
  }
  return '#94a3b8';
}

export function columnsOrdered(): TaskStatus[] {
  return [...TASK_STATUSES];
}
