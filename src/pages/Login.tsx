import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const DEMO_ACCOUNTS = [
  { email: 'maria@example.com',    role: 'Cliente',      pw: '123456' },
  { email: 'admin@fukusuke.cl',    role: 'Admin',        pw: '123456' },
  { email: 'cajero@fukusuke.cl',   role: 'Cajero',       pw: '123456' },
  { email: 'despacho@fukusuke.cl', role: 'Despachador',  pw: '123456' },
  { email: 'dueno@fukusuke.cl',    role: 'Dueño',        pw: '123456' },
];

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
  const [showDemo, setShowDemo] = useState(false);

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

  const fillDemo = (email: string, pw: string) => {
    setEmail(email);
    setPassword(pw);
    setError('');
    setShowDemo(false);
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

        {/* ── Cuentas demo ── */}
        <div className="auth-card__hint">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-decoration-none"
            onClick={() => setShowDemo((v) => !v)}
            style={{ fontSize: '0.82rem' }}
          >
            💡 {showDemo ? 'Ocultar' : 'Ver'} cuentas de demostración
          </button>

          {showDemo && (
            <div style={{ marginTop: '0.6rem' }}>
              {DEMO_ACCOUNTS.map(({ email: e, role, pw }) => (
                <button
                  key={e}
                  type="button"
                  className="demo-account-btn"
                  onClick={() => fillDemo(e, pw)}
                  title={`Contraseña: ${pw}`}
                >
                  <span className="demo-role">{role}</span>
                  <span className="demo-email">{e}</span>
                </button>
              ))}
              <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.4rem 0 0' }}>
                Contraseña de todas las cuentas: <code>123456</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
