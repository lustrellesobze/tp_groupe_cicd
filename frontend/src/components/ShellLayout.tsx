import { useEffect, useId, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/app/projects', label: 'Projets' },
  { to: '/app/dashboard', label: 'Tableau de bord' },
];

export function ShellLayout() {
  const { user, logout } = useAuth();
  const navGo = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="tf-surface">
      {menuOpen && (
        <button
          type="button"
          className="tf-topbar__backdrop"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <header className="tf-topbar">
        <div className="tf-brand" role="img" aria-label="TaskFlow">
          <span
            className="pill"
            style={{
              background: 'var(--tf-primary)',
              minWidth: 0,
              padding: '0.1rem 0.35rem',
            }}
          />
          <span>TaskFlow</span>
        </div>
        <nav
          id={menuId}
          className={`tf-nav tf-nav--desktop${menuOpen ? ' is-open' : ''}`}
          aria-label="Principale"
        >
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setMenuOpen(false)}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="tf-topbar__end">
          <button
            type="button"
            className="tf-nav-toggle tf-nav--mobile-only"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
          <div className="tf-topbar__actions">
            {user && <span className="tf-topbar__user" title={user.email}>{user.name}</span>}
            <button
              className="tf-btn ghost"
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await logout();
                navGo('/login', { replace: true });
              }}
              title="Déconnecter"
            >
              Sortir
            </button>
          </div>
        </div>
      </header>
      <div className="tf-container">
        <Outlet />
      </div>
    </div>
  );
}
