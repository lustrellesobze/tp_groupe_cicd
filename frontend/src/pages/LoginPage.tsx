import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractMessage, isAxios401 } from '../api/client';
import styles from './LoginPage.module.css';

function IconEmail() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconEyeOn() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  );
}
function IconLoader() {
  return (
    <svg
      className={styles.spin}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.21-8.56" />
    </svg>
  );
}
function IconErr() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={8} x2={12} y2={12} />
      <line x1={12} y1={16} x2={12.01} y2={16} />
    </svg>
  );
}

/** Connexion — layout type « card split », couleurs TaskFlow (papier/encre/rouille/sauge) */
export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErr('Veuillez remplir tous les champs.');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      nav('/app/projects', { replace: true });
    } catch (ex) {
      if (isAxios401(ex)) {
        setErr('Email ou mot de passe incorrect.');
      } else {
        setErr(extractMessage(ex));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.auth}>
          <div className={styles.brand}>
            <div className={styles.logoBox} aria-label="TaskFlow">
              <span className={styles.logoInk}>T</span>
              <span className={styles.logoSage}>a</span>
              <span className={styles.logoRust}>F</span>
            </div>
            <span className={styles.logoText}>TaskFlow</span>
            <div className={styles.topLinks}>
              <Link to="/">Accueil</Link>
            </div>
          </div>

          <div className={styles.body}>
            <h1 className={styles.title}>Connexion à votre espace</h1>
            <p className={styles.sub}>
              Saisissez les identifiants de votre compte TaskFlow
            </p>

            {err && (
              <div className={styles.err} role="alert">
                <IconErr />
                <span>{err}</span>
              </div>
            )}

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lp-email">
                  Votre adresse e-mail
                </label>
                <div className={styles.inputRow}>
                  <span className={styles.iconL}><IconEmail /></span>
                  <input
                    id="lp-email"
                    className={styles.input}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErr(null); }}
                    disabled={loading}
                    required
                    aria-invalid={err ? 'true' : 'false'}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="lp-pw">
                  Mot de passe
                </label>
                <div className={styles.inputRow}>
                  <input
                    id="lp-pw"
                    className={`${styles.input} ${styles.inputPw}`}
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErr(null); }}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className={styles.iconR}
                    onClick={() => setShowPass((s) => !s)}
                    tabIndex={-1}
                    title={showPass ? 'Masquer' : 'Afficher'}
                    aria-pressed={showPass}
                    aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    disabled={loading}
                  >
                    {showPass ? <IconEyeOff /> : <IconEyeOn />}
                  </button>
                </div>
              </div>

              <div className={styles.row}>
                <label className={styles.remember}>
                  <input type="checkbox" className={styles.check} />
                  <span>Rester connecté (session navigateur)</span>
                </label>
                <a
                  className={styles.forgot}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading
                  ? (
                    <>
                      <IconLoader />
                      Connexion…
                    </>
                    )
                  : 'Se connecter'}
              </button>
            </form>
            <p className={styles.reg}>
              Pas de compte ?&nbsp;
              <Link to="/register">S’inscrire</Link>
            </p>
            <p className={styles.footer}>
              Besoin d’aide ?&nbsp;
              <a href="mailto:support@exemple.com">Contacter le support</a>
            </p>
          </div>
        </div>

        <div className={styles.hero}>
          <div className={styles.pattern} aria-hidden />
          {!imgBroken && (
            <img
              src="/assets/im.jpeg"
              alt=""
              className={styles.heroImg}
              onError={() => setImgBroken(true)}
            />
          )}
          <div className={styles.heroOverlay}>
            Des tâches claires, une équipe alignée
          </div>
        </div>
      </div>
    </div>
  );
}
