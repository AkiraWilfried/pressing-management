import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  Shirt,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import '../style/Login.css';

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.ok) {
      navigate('/');
    } else {
      setError(result.error || 'Email ou mot de passe incorrect.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── EN-TÊTE ───────────────────────────── */}
        <div className="login-header">
          <div className="login-logo" aria-hidden="true">
            <Shirt className="login-logo-icon" />
          </div>
          <h1 className="login-title">Pressing</h1>
          <p className="login-subtitle">Gestion de pressing</p>
        </div>

        {/* ── FORMULAIRE ────────────────────────── */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Erreur */}
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle className="login-error-icon" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Adresse email
            </label>
            <div className="input-icon-wrapper">
              <Mail className="input-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                className="form-input with-icon"
                placeholder="admin@pressing.cm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Mot de passe
            </label>
            <div className="input-icon-wrapper">
              <Lock className="input-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye    size={18} aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <Loader2 className="spinner" size={18} aria-hidden="true" />
                Connexion…
              </span>
            ) : (
              'Se connecter'
            )}
          </button>

        </form>

        {/* ── HELPER ────────────────────────────── */}
        <p className="login-helper" aria-label="Identifiants de test">
          admin@pressing.cm&nbsp;/&nbsp;admin123
        </p>

      </div>
    </div>
  );
}
