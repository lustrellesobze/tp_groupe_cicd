import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractMessage } from '../api/client';

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== password2) {
      setErr('La confirmation ne correspond pas au mot de passe.');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: password2,
      });
      nav('/app/projects', { replace: true });
    } catch (ex) {
      setErr(extractMessage(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tf-page-auth">
      <div className="auth-card" style={{ maxWidth: '26rem' }}>
        <h1>Inscription</h1>
        <p className="tf-mono" style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.45 }}>
          Créez un compte pour accéder à vos projets.
        </p>
        <form onSubmit={onSubmit} className="form-grid" style={{ maxWidth: '100%' }} noValidate>
        <div>
          <label htmlFor="rp-n">Nom</label>
          <input
            className="tf-input"
            id="rp-n"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="rp-e">Email</label>
          <input
            className="tf-input"
            id="rp-e"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="rp-p">Mot de passe</label>
          <input
            className="tf-input"
            id="rp-p"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="rp-p2">Confirmation</label>
          <input
            className="tf-input"
            id="rp-p2"
            type="password"
            name="password2"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {err && <p className="tf-error">{err}</p>}
        <div>
          <button className="tf-btn" type="submit" disabled={loading} style={{ width: '100%', minHeight: 'var(--touch-min)' }}>
            {loading ? 'Inscription…' : 'S’inscrire'}
          </button>
        </div>
      </form>
        <p style={{ marginTop: 20, marginBottom: 0, textAlign: 'center' }}>
          <Link to="/login">Déjà inscrit ?</Link>
        </p>
      </div>
    </div>
  );
}
