import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsApi, tasksApi } from '../api/taskflow';
import type { Project, Task, User } from '../types/api';
import { extractMessage } from '../api/client';
import { TaskBoard } from '../components/TaskBoard';
import { TaskEditModal } from '../components/TaskEditModal';
import { TASK_STATUSES, type TaskStatus } from '../types/api';
import { statusLabel } from '../lib/columns';
import { projectAssignable } from '../lib/projectMembers';
import { fromDateInputToIso } from '../lib/taskMeta';

export function ProjectPage() {
  const { id: urlId } = useParams();
  const projectId = urlId ? parseInt(urlId, 10) : 0;
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadP, setLoadP] = useState(true);
  const [tTitle, setTTitle] = useState('');
  const [tBody, setTBody] = useState('');
  const [tStatus, setTStatus] = useState<TaskStatus>('backlog');
  const [tDue, setTDue] = useState('');
  const [tAssign, setTAssign] = useState<Set<number>>(() => new Set());
  const [mEmail, setMEmail] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);

  const isOwner = project && user && project.owner_id === user.id;

  const assignable = useMemo(
    () => (project ? projectAssignable(project) : []),
    [project],
  );

  const load = useCallback(async () => {
    if (!projectId) return;
    setErr(null);
    setLoadP(true);
    try {
      const { data: p } = await projectsApi.get(projectId);
      setProject(p);
      const { data: ts } = await tasksApi.list(projectId);
      setTasks(ts);
    } catch (e) {
      setErr(extractMessage(e));
    } finally {
      setLoadP(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleAssignee(id: number) {
    setTAssign((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tTitle.trim()) return;
    setErr(null);
    try {
      const dueIso = fromDateInputToIso(tDue);
      const { data: t } = await tasksApi.create(projectId, {
        title: tTitle.trim(),
        body: tBody.trim() || undefined,
        status: tStatus,
        due_at: dueIso ?? undefined,
        assignee_ids: tAssign.size > 0 ? Array.from(tAssign).sort((a, b) => a - b) : undefined,
      });
      setTasks((s) => [...s, t]);
      setTTitle('');
      setTBody('');
      setTDue('');
      setTAssign(new Set());
    } catch (e) {
      setErr(extractMessage(e));
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!mEmail.trim()) return;
    setErr(null);
    try {
      const { data: p } = await projectsApi.addMember(projectId, { email: mEmail.trim() });
      setProject(p);
      setMEmail('');
    } catch (e) {
      setErr(extractMessage(e));
    }
  }

  async function removeMember(u: User) {
    if (!window.confirm(`Retirer ${u.name} ?`)) return;
    setErr(null);
    try {
      await projectsApi.removeMember(projectId, u.id);
      setProject((prev) =>
        (prev
          ? {
            ...prev,
            members: (prev.members ?? []).filter((x) => x.id !== u.id),
          }
          : null),
      );
    } catch (e) {
      setErr(extractMessage(e));
    }
  }

  function onTaskSaved(t: Task) {
    setTasks((arr) => arr.map((x) => (x.id === t.id ? t : x)));
  }

  if (!projectId) {
    return <p>Projet introuvable.</p>;
  }
  if (loadP) {
    return <div className="tf-loader" role="status">Chargement du projet…</div>;
  }
  if (err && !project) {
    return (
      <p className="tf-error">
        {err}
        {' '}
        <Link to="/app/projects">Retour</Link>
      </p>
    );
  }
  if (!project) {
    return null;
  }

  return (
    <div>
      {editing && (
        <TaskEditModal
          projectId={projectId}
          task={editing}
          members={assignable}
          onClose={() => setEditing(null)}
          onSaved={onTaskSaved}
        />
      )}

      <Link to="/app/projects" className="tf-link-back">
        ← Tous les projets
      </Link>
      <div className="page-header" style={{ marginTop: 0 }}>
        <h1>{project.name}</h1>
        {project.description && <p className="tf-mono">{project.description}</p>}
      </div>

      {isOwner && (
        <div className="tf-card" style={{ margin: '1.2rem 0' }}>
          <h2 className="dash-mono-label" style={{ marginTop: 0 }}>Membres</h2>
          <form
            onSubmit={addMember}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'stretch' }}
            noValidate
          >
            <input
              className="tf-input"
              type="email"
              placeholder="email@membre"
              value={mEmail}
              onChange={(e) => setMEmail(e.target.value)}
              required
              style={{ flex: 1, minWidth: 200, minHeight: 'var(--touch-min)' }}
            />
            <button className="tf-btn secondary" type="submit" style={{ minHeight: 'var(--touch-min)' }}>Inviter</button>
          </form>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} aria-label="Membres du projet">
            {(project.members ?? []).map((m) => (
              <li key={m.id} className="member-row">
                <span>
                  <strong style={{ fontWeight: 600 }}>{m.name}</strong>
                  {' '}
                  <span className="tf-mono" style={{ wordBreak: 'break-all' }}>
                    (
                    {m.email}
                    )
                  </span>
                </span>
                {m.id !== project.owner_id && isOwner && (
                  <button
                    type="button"
                    className="tf-btn danger"
                    style={{ padding: '0.4rem 0.65rem', minHeight: 'var(--touch-min)' }}
                    onClick={() => void removeMember(m)}
                    title="Retirer ce membre"
                  >
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tf-card" style={{ marginBottom: '1.25rem' }}>
        <h2 className="dash-mono-label" style={{ marginTop: 0 }}>Nouvelle tâche</h2>
        <p className="tf-mono" style={{ fontSize: '0.9rem', marginTop: 0, marginBottom: '0.75rem' }}>
          Titre, colonne, optionnellement description, date de livraison, et personnes du projet.
        </p>
        <form onSubmit={addTask} className="form-new-task form-new-task--stack" noValidate>
          <div className="form-new-task__wide">
            <input
              className="tf-input"
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              placeholder="Titre de la tâche *"
              required
              style={{ minHeight: 'var(--touch-min)' }}
            />
          </div>
          <div className="form-new-task__wide">
            <textarea
              className="tf-input"
              value={tBody}
              onChange={(e) => setTBody(e.target.value)}
              rows={2}
              placeholder="Description (optionnel)"
            />
          </div>
          <div>
            <label className="tf-sr" htmlFor="t-status">Colonne</label>
            <select
              id="t-status"
              className="tf-input"
              value={tStatus}
              onChange={(e) => setTStatus(e.target.value as TaskStatus)}
              aria-label="Colonne cible"
              style={{ minHeight: 'var(--touch-min)' }}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="tf-sr" htmlFor="t-due">Échéance</label>
            <input
              id="t-due"
              className="tf-input"
              type="date"
              value={tDue}
              onChange={(e) => setTDue(e.target.value)}
              style={{ minHeight: 'var(--touch-min)' }}
            />
          </div>
          <fieldset className="form-new-task__members tf-fieldset" style={{ margin: 0 }}>
            <legend>Assigner (optionnel)</legend>
            {assignable.length === 0
              ? <p className="tf-mono" style={{ fontSize: '0.88rem', margin: 0 }}>Invitez des membres pour les assigner.</p>
              : (
                <ul className="tf-check-list" style={{ maxHeight: '9.5rem' }}>
                  {assignable.map((m) => (
                    <li key={m.id}>
                      <label className="tf-check-row" style={{ fontSize: '0.88rem' }}>
                        <input
                          type="checkbox"
                          checked={tAssign.has(m.id)}
                          onChange={() => toggleAssignee(m.id)}
                        />
                        <span>
                          {m.name}
                          <span className="tf-mono" style={{ display: 'block', fontSize: '0.8em' }}>{m.email}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                )}
          </fieldset>
          <div className="form-new-task__submit">
            <button className="tf-btn" type="submit" style={{ minHeight: 'var(--touch-min)' }}>
              Ajouter la tâche
            </button>
          </div>
        </form>
        {err && <p className="tf-error">{err}</p>}
      </div>

      <h2 className="dash-mono-label">Board</h2>
      <TaskBoard
        projectId={projectId}
        items={tasks}
        onUpdate={setTasks}
        readOnly={!user}
        onEditTask={user ? (t) => setEditing(t) : undefined}
      />
    </div>
  );
}
