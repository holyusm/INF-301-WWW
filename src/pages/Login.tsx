import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Login() {
  const { login }     = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const location      = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);

    if (ok) {
      showToast('Sesión iniciada correctamente. ¡Bienvenido!', 'success');
      navigate(from, { replace: true });
    } else {
      setError('Correo o contraseña incorrectos. Verifica tus datos.');
      showToast('Credenciales inválidas. Verifica tu correo y contraseña.', 'danger');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card card border-0 shadow-sm">
        <div className="auth-card__header">
          <span className="auth-card__icon">🍣</span>
          <h1>Iniciar sesión</h1>
          <p>Bienvenido de vuelta a Fukusuke</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label" htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.cl"
              autoComplete="email"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="login-pw">Contraseña</label>
            <input
              id="login-pw"
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            className="btn btn-primary auth-card__submit w-100"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <hr className="divider" />

        <p className="auth-card__footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </main>
  );
}
