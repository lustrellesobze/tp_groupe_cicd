import { TASK_STATUSES, type TaskStatus } from '../types/api';

const STEP: Record<TaskStatus, number> = {
  backlog: 0,
  in_progress: 1,
  review: 2,
  done: 3,
};

/** 0 % → 100 % selon le statut (évolution de la tâche). */
export function statusProgressPercent(status: TaskStatus): number {
  const n = (TASK_STATUSES as readonly string[]).includes(status) ? STEP[status] : 0;
  return n === 0 ? 0 : Math.round((n / 3) * 100);
}

function parseIso(d: string): number {
  const t = Date.parse(d);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Raccourci lisible pour l’échéance. Retourne null si pas d’échéance.
 */
export function dueHint(dueAt: string | null, now: Date = new Date()): string | null {
  if (!dueAt) {
    return null;
  }
  const t = parseIso(dueAt);
  if (t === 0) {
    return null;
  }
  const dayMs = 86400000;
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const t0 = d0.getTime();
  const d1 = new Date(t);
  d1.setHours(0, 0, 0, 0);
  const diff = (d1.getTime() - t0) / dayMs;
  if (diff < 0) {
    return `Dépassée de ${Math.abs(diff)} j.`;
  }
  if (diff === 0) {
    return 'Aujourd’hui';
  }
  if (diff === 1) {
    return 'Demain';
  }
  if (diff <= 7) {
    return `Dans ${Math.round(diff)} j.`;
  }
  return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Valeur `YYYY-MM-DD` pour <input type="date"> à partir d’une ISO. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return '';
  }
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Lundi « date » (locales) en ISO minuit local pour l’API. */
export function fromDateInputToIso(dateStr: string): string | null {
  if (!dateStr.trim()) {
    return null;
  }
  const t = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(t.getTime())) {
    return null;
  }
  return t.toISOString();
}
