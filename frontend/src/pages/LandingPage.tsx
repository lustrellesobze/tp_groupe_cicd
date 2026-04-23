import { Link } from 'react-router-dom';
import { getStoredToken } from '../api/client';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    title: 'Espace & équipe',
    text: 'Projets partagés, invitations par e-mail, rôles côté propriétaire.',
  },
  {
    title: 'Flux Kanban',
    text: "Colonnes backlog → revue, glisser-déposer, assignation, vue d'ensemble claire.",
  },
  {
    title: 'Stack livrable',
    text: "API REST Laravel, interface React, prête pour l'intégration CI/CD, Docker, monitoring.",
  },
];

const TECH: string[] = ['React', 'Laravel', 'CI/CD', 'Docker'];

/**
 * Accueil public (splash) — design papier/encre/rouille/sauge, Syne + DM Sans.
 * Animations dans LandingPage.module.css
 */
export function LandingPage() {
  const hasSession = Boolean(getStoredToken());

  return (
    <div className={styles.page}>
      <div className={styles.dots} aria-hidden />
      <div className={styles.arc} aria-hidden />
      <div className={styles.ringLg} aria-hidden />
      <div className={styles.ringSm} aria-hidden />
      <div className={styles.bars} aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.bar} />
        ))}
      </div>

      <main className={styles.content}>
        <span className={styles.eyebrow}>Gestion de tâches</span>
        <h1 className={styles.brand}>TaskFlow</h1>
        <p className={styles.lead}>
          Plateforme collaborative de suivi de projets, pensée pour l’exercice
          <strong> intégration &amp; déploiement</strong> — du backlog au déploiement.
        </p>
        <div className={styles.actions}>
          {hasSession ? (
            <Link className={styles.btnPrimary} to="/app/projects">
              Ouvrir l’application
            </Link>
          ) : (
            <Link className={styles.btnPrimary} to="/login">
              Se connecter
            </Link>
          )}
          <Link className={styles.btnGhost} to="/register">
            Créer un compte
          </Link>
        </div>
        <p className={styles.hint}>Aucun compte requis pour lire l’accueil / connexion requise pour l’espace app.</p>
      </main>

      <aside className={styles.panelClip} aria-labelledby="piliers-titre">
        <div className={styles.panelInner}>
          <p className={styles.panelTitle} id="piliers-titre">
            Tout ce qu’on centralise
          </p>
          <ul className={styles.feat}>
            {FEATURES.map((f) => (
              <li key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <footer className={styles.techBar} aria-label="Technologies du projet">
        {TECH.map((t, i) => (
          <span key={t} className={styles.techPill}>
            {i > 0 && <span className={styles.divider} aria-hidden />}
            {t}
          </span>
        ))}
      </footer>
    </div>
  );
}
