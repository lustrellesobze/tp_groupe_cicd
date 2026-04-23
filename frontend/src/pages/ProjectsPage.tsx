import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/taskflow';
import type { Project } from '../types/api';
import { extractMessage } from '../api/client';

export function ProjectsPage() {
  const [list, setList] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const { data } = await projectsApi.list();
      setList(data);
    } catch (e) {
      setErr(extractMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setErr(null);
    try {
      const { data } = await projectsApi.create({ name: name.trim(), description: description || undefined });
      setList((prev) => [data, ...prev]);
      setName('');
      setDescription('');
    } catch (e) {
      setErr(extractMessage(e));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Projets</h1>
        <p className="tf-mono">
          Créez un projet, invitez l’équipe, puis gérez le board Kanban.
        </p>
      </div>

      <div className="tf-card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 600 }}>Nouveau projet</h2>
        <form onSubmit={create} style={{ display: 'grid', gap: 10, marginTop: 8 }} noValidate>
          <div>
            <label htmlFor="p-name">Nom</label>
            <input className="tf-input" id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} />
          </div>
          <div>
            <label htmlFor="p-desc">Description (optionnel)</label>
            <textarea className="tf-input" id="p-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="tf-btn" type="submit" style={{ minHeight: 'var(--touch-min)', maxWidth: '12rem' }}>
            Créer
          </button>
        </form>
        {err && <p className="tf-error">{err}</p>}
      </div>

      {loading && (
        <div className="tf-loader" role="status" aria-live="polite">
          Chargement des projets…
        </div>
      )}

      {!loading && list.length === 0 && <p className="tf-mono">Aucun projet pour l’instant.</p>}

      <ul className="project-grid" aria-label="Liste des projets">
        {list.map((p) => (
          <li key={p.id} className="tf-card project-card">
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem' }}>
                <Link to={`/app/projects/${p.id}`} style={{ color: 'var(--tf-text)' }}>
                  {p.name}
                </Link>
              </h2>
              {p.description && <p className="tf-mono" style={{ margin: 0 }}>{p.description}</p>}
            </div>
            <div className="tf-mono" style={{ fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }} aria-label="Nombre de tâches">
              Tâches : {p.tasks_count ?? '—'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
