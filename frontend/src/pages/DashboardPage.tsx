import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi, projectsApi, tasksApi } from '../api/taskflow';
import type { Dashboard, Project, Task, TaskStatus, User } from '../types/api';
import { extractMessage } from '../api/client';
import { statusChartColor, statusLabel } from '../lib/columns';
import { TASK_STATUSES } from '../types/api';
import { projectAssignable } from '../lib/projectMembers';
import { fromDateInputToIso } from '../lib/taskMeta';
import styles from './DashboardPage.module.css';

function formatDue(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function DashboardPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('backlog');
  const [taskDue, setTaskDue] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const loadDashboard = useCallback(async () => {
    const { data } = await dashboardApi.get();
    setD(data);
  }, []);

  const loadProjects = useCallback(async () => {
    const { data } = await projectsApi.list();
    setProjects(data);
    setSelectedProjectId((prev) => prev ?? (data[0]?.id ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        await Promise.all([loadDashboard(), loadProjects()]);
      } catch (e) {
        setErr(extractMessage(e));
      }
    })();
  }, [loadDashboard, loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedProject(null);
      setTasks([]);
      return;
    }
    (async () => {
      setErr(null);
      try {
        const [{ data: p }, { data: ts }] = await Promise.all([
          projectsApi.get(selectedProjectId),
          tasksApi.list(selectedProjectId),
        ]);
        setSelectedProject(p);
        setTasks(ts);
      } catch (e) {
        setErr(extractMessage(e));
      }
    })();
  }, [selectedProjectId]);

  const members = useMemo<User[]>(() => {
    if (!selectedProject) {
      return [];
    }
    return projectAssignable(selectedProject);
  }, [selectedProject]);

  const barData = useMemo(() => {
    if (!d) {
      return [];
    }
    return TASK_STATUSES.map((s) => ({
      name: statusLabel(s),
      count: d.tasks_by_status?.[s] ?? 0,
      color: statusChartColor(s),
    }));
  }, [d]);

  const pieData = useMemo(() => {
    if (!d) {
      return [];
    }
    return TASK_STATUSES.map((s) => ({
      name: statusLabel(s),
      value: d.tasks_by_status?.[s] ?? 0,
      color: statusChartColor(s),
    }));
  }, [d]);

  if (err) {
    return <p className="tf-error">{err}</p>;
  }
  if (!d) {
    return <div className="tf-loader" role="status">Chargement du tableau de bord…</div>;
  }

  function toggleAssignee(id: number) {
    setTaskAssignees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !taskTitle.trim()) {
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const { data: task } = await tasksApi.create(selectedProjectId, {
        title: taskTitle.trim(),
        status: taskStatus,
        due_at: fromDateInputToIso(taskDue) ?? undefined,
        assignee_ids: taskAssignees.size ? Array.from(taskAssignees) : undefined,
      });
      setTasks((prev) => [...prev, task]);
      setTaskTitle('');
      setTaskDue('');
      setTaskStatus('backlog');
      setTaskAssignees(new Set());
      await loadDashboard();
    } catch (e) {
      setErr(extractMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    if (!selectedProjectId) {
      return;
    }
    if (!window.confirm(`Supprimer la tâche "${task.title}" ?`)) {
      return;
    }
    setErr(null);
    setDeletingId(task.id);
    try {
      await tasksApi.remove(selectedProjectId, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      await loadDashboard();
    } catch (e) {
      setErr(extractMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId || !inviteEmail.trim()) {
      return;
    }
    setErr(null);
    setInviting(true);
    try {
      const { data: updatedProject } = await projectsApi.addMember(selectedProjectId, {
        email: inviteEmail.trim(),
      });
      setSelectedProject(updatedProject);
      setInviteEmail('');
    } catch (e) {
      setErr(extractMessage(e));
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.hero}>
        <h1>Tableau de bord</h1>
        <p>
          Vue d’ensemble de vos projets : volume de tâches, avancement par statut, et prochaines échéances.
        </p>
      </header>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Projets</div>
          <div className={styles.statValue}>{d.projects_count}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tâches</div>
          <div className={styles.statValue}>{d.tasks_total}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>À traiter (vous)</div>
          <div className={styles.statValue}>{d.tasks_assigned_to_me}</div>
          <span className="tf-mono" style={{ fontSize: '0.75rem', color: 'var(--tf-text-muted)' }}>Non terminées, assignées à vous</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Terminé</div>
          <div className={styles.statValue}>
            {d.completion_rate}
            %
          </div>
        </div>
      </div>

      {d.due_soon_count > 0 && (
        <p className={styles.statSub} style={{ marginBottom: '1rem' }}>
          {d.due_soon_count}
          {' '}
          tâche
          {d.due_soon_count > 1 ? 's' : ''}
          {' '}
          avec échéance dans les 7 prochains jours
        </p>
      )}

      <div className={styles.charts}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Tâches par statut</h2>
            <div className={styles.pieColors} aria-hidden>
              {pieData.map((e) => (
                <span key={e.name} className={styles.pieSwatch} style={{ background: e.color }} title={e.name} />
              ))}
            </div>
          </div>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Tâches" radius={[4, 4, 0, 0]}>
                  {barData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle} style={{ margin: '0 0 0.5rem' }}>Répartition</h2>
          <div className={styles.chartBox}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={78}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className={styles.quick} aria-labelledby="quick-task-title">
        <div className={styles.quickHead}>
          <h2 id="quick-task-title">Gestion rapide des tâches</h2>
          <p>Ajoutez, assignez ou supprimez des tâches depuis le tableau de bord.</p>
        </div>

        <div className={styles.quickGrid}>
          <div className={styles.quickCard}>
            <label className={styles.quickLabel} htmlFor="dash-project">Projet</label>
            <select
              id="dash-project"
              className="tf-input"
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
            >
              {projects.length === 0 && <option value="">Aucun projet</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProject && (
              <p className={styles.projectHint}>
                Projet sélectionné : <strong>{selectedProject.name}</strong>
              </p>
            )}

            <h3 className={styles.quickSubTitle}>Membres du projet</h3>
            <form className={styles.inviteForm} onSubmit={handleInviteMember} noValidate>
              <input
                className="tf-input"
                type="email"
                placeholder="email@collaborateur.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <button className="tf-btn secondary" type="submit" disabled={!selectedProjectId || inviting}>
                {inviting ? 'Invitation…' : 'Inviter / Ajouter'}
              </button>
            </form>
            {members.length === 0 ? (
              <p className={styles.emptyText}>Aucun membre trouvé pour ce projet.</p>
            ) : (
              <ul className={styles.members}>
                {members.map((m) => (
                  <li key={m.id} className={styles.member}>
                    <span className={styles.memberDot} aria-hidden />
                    <span>{m.name}</span>
                    <span className="tf-mono">{m.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.quickCard}>
            <h3 className={styles.quickSubTitle}>Ajouter une tâche</h3>
            <form className={styles.quickForm} onSubmit={handleAddTask} noValidate>
              <input
                className="tf-input"
                placeholder="Titre de la tâche"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
              <div className={styles.inline2}>
                <select
                  className="tf-input"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                  aria-label="Statut de la tâche"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                <input
                  className="tf-input"
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  aria-label="Date de livraison"
                />
              </div>
              <fieldset className={styles.assignBox}>
                <legend>Attribuer à l'équipe</legend>
                {members.length === 0 ? (
                  <p className={styles.emptyText}>Invitez des membres pour pouvoir attribuer.</p>
                ) : (
                  <div className={styles.assignList}>
                    {members.map((m) => (
                      <label key={m.id} className={styles.assignItem}>
                        <input
                          type="checkbox"
                          checked={taskAssignees.has(m.id)}
                          onChange={() => toggleAssignee(m.id)}
                        />
                        <span>{m.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              <button className="tf-btn" type="submit" disabled={!selectedProjectId || saving}>
                {saving ? 'Ajout…' : 'Ajouter la tâche'}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.taskListWrap}>
          <h3 className={styles.quickSubTitle}>Tâches du projet</h3>
          {tasks.length === 0 ? (
            <p className={styles.emptyText}>Aucune tâche pour le moment.</p>
          ) : (
            <ul className={styles.taskList}>
              {tasks.map((t) => (
                <li key={t.id} className={styles.taskRow}>
                  <div>
                    <strong>{t.title}</strong>
                    <div className={styles.taskMeta}>
                      {selectedProject && <span>Projet : {selectedProject.name}</span>}
                      <span>{statusLabel(t.status)}</span>
                      {t.assignees && t.assignees.length > 0 && (
                        <span>
                          Assignés : {t.assignees.map((u) => u.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tf-btn danger"
                    onClick={() => void handleDeleteTask(t)}
                    disabled={deletingId === t.id}
                  >
                    {deletingId === t.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className={styles.dueBlock}>
        <h2>Prochaines échéances</h2>
        {d.upcoming_due.length === 0
          ? <p className={styles.dueBlockEmpty}>Aucune date de livraison définie sur des tâches en cours.</p>
          : (
            <ul className={styles.dueList}>
              {d.upcoming_due.map((u) => (
                <li key={u.id} className={styles.dueItem}>
                  <strong title={u.title}>{u.title}</strong>
                  {u.project && <span className="tf-mono">{u.project}</span>}
                  <span className={styles.dueDate}>{formatDue(u.due_at)}</span>
                </li>
              ))}
            </ul>
            )}
      </div>
    </div>
  );
}
