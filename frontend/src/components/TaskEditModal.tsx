import { useEffect, useState, type FormEvent } from 'react';
import { tasksApi } from '../api/taskflow';
import { extractMessage } from '../api/client';
import type { Task, TaskStatus, User } from '../types/api';
import { TASK_STATUSES } from '../types/api';
import { statusLabel } from '../lib/columns';
import { fromDateInputToIso, toDateInputValue } from '../lib/taskMeta';

type Props = {
  projectId: number;
  task: Task;
  members: User[];
  onClose: () => void;
  onSaved: (t: Task) => void;
};

export function TaskEditModal({ projectId, task, members, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task.title);
  const [body, setBody] = useState(task.body ?? '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [due, setDue] = useState(toDateInputValue(task.due_at));
  const [sel, setSel] = useState<Set<number>>(() => {
    const arr = task.assignees?.length
      ? task.assignees.map((u) => u.id)
      : task.assignee
        ? [task.assignee.id]
        : [];
    return new Set(arr);
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function toggle(id: number) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Le titre est requis.');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const dueIso = fromDateInputToIso(due);
      const { data } = await tasksApi.update(projectId, task.id, {
        title: title.trim(),
        body: body.trim() || null,
        status,
        due_at: dueIso,
        assignee_ids: Array.from(sel).sort((a, b) => a - b),
      });
      onSaved(data);
      onClose();
    } catch (ex) {
      setErr(extractMessage(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tf-modal-root" role="dialog" aria-modal="true" aria-labelledby="task-edit-title">
      <button type="button" className="tf-modal-backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="tf-modal tf-card">
        <h2 id="task-edit-title" className="tf-modal-title">Modifier la tâche</h2>
        <form onSubmit={(e) => void onSubmit(e)} className="tf-modal-form">
          {err && <p className="tf-error" role="alert">{err}</p>}
          <label className="tf-field">
            <span>Titre</span>
            <input className="tf-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="tf-field">
            <span>Description</span>
            <textarea className="tf-input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label className="tf-field">
            <span>Statut</span>
            <select className="tf-input" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label className="tf-field">
            <span>Échéance (livraison)</span>
            <input className="tf-input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <fieldset className="tf-fieldset">
            <legend>Assigner à</legend>
            {members.length === 0
              ? <p className="tf-mono">Aucun membre : invitez des personnes au projet.</p>
              : (
                <ul className="tf-check-list">
                  {members.map((m) => (
                    <li key={m.id}>
                      <label className="tf-check-row">
                        <input
                          type="checkbox"
                          checked={sel.has(m.id)}
                          onChange={() => toggle(m.id)}
                        />
                        <span>
                          {m.name}
                          <span className="tf-mono" style={{ display: 'block', fontSize: '0.85em' }}>{m.email}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                )}
          </fieldset>
          <div className="tf-modal-actions">
            <button type="button" className="tf-btn secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="tf-btn" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
