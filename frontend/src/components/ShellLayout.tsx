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
          <span style={{ color: '#1b1712' }}>T</span>
          <span style={{ color: '#2f8f75' }}>a</span>
          <span style={{ color: '#d35a3a' }}>F</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#312720',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              borderLeft: '2px solid #e9dcc7',
              paddingLeft: '0.6rem',
              marginLeft: '0.1rem',
            }}
          >
            TaskFlow
          </span>
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
