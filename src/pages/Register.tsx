import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateRun } from '../utils/run';
import { validateEmailDeliverable } from '../utils/emailValidation';
import type { RegisterForm } from '../types';
import './Auth.css';

// ── Regiones / Provincias ────────────────────────────────────
const REGIONS = ['Región Metropolitana', 'Valparaíso', 'Biobío', 'Araucanía', 'Los Lagos'];

// ── RNF-7: Fortaleza de contraseña ──────────────────────────
type StrengthLevel = 'vacía' | 'muy débil' | 'débil' | 'media' | 'fuerte' | 'muy fuerte';

function measureStrength(pw: string): StrengthLevel {
  if (!pw) return 'vacía';
  if (pw.length < 6)  return 'muy débil';
  const hasUpper   = /[A-Z]/.test(pw);
  const hasLower   = /[a-z]/.test(pw);
  const hasDigit   = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (pw.length >= 12 && score >= 4) return 'muy fuerte';
  if (pw.length >= 8  && score >= 3) return 'fuerte';
  if (pw.length >= 8  && score >= 2) return 'media';
  return 'débil';
}

const STRENGTH_META: Record<StrengthLevel, { pct: number; color: string }> = {
  vacía:      { pct: 0,   color: 'transparent' },
  'muy débil':{ pct: 15,  color: '#e74c3c' },
  débil:      { pct: 35,  color: '#e67e22' },
  media:      { pct: 60,  color: '#f1c40f' },
  fuerte:     { pct: 80,  color: '#27ae60' },
  'muy fuerte':{ pct: 100, color: '#1e8449' },
};

// ── RNF-8: Validación de teléfono chileno ───────────────────
function validatePhone(phone: string): boolean {
  // Acepta: +569XXXXXXXX | 9XXXXXXXX | 569XXXXXXXX
  return /^(\+?56)?9\d{8}$/.test(phone.replace(/\s/g, ''));
}

// ── RNF-8: Validación de edad mínima (13 años) ──────────────
function validateAge(birthDate: string): boolean {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  const min   = new Date();
  min.setFullYear(min.getFullYear() - 13);
  return birth <= min;
}

// ── Estado inicial ───────────────────────────────────────────
const INITIAL: RegisterForm = {
  run: '', fullName: '', email: '', confirmEmail: '',
  password: '', confirmPassword: '', phone: '',
  address: '', commune: '', province: '', region: '',
  birthDate: '', gender: 'M',
};

export default function Register() {
  const { register }    = useAuth();
  const { showToast }   = useToast();
  const navigate        = useNavigate();
  const [form, setForm] = useState<RegisterForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const strength = measureStrength(form.password);
  const { pct: strengthPct, color: strengthColor } = STRENGTH_META[strength];

  const set = (field: keyof RegisterForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── RNF-8: Validaciones ──────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<RegisterForm> = {};

    if (!form.run) {
      errs.run = 'Requerido';
    } else if (!validateRun(form.run)) {
      errs.run = 'RUN inválido. Formato esperado: 12.345.678-5';
    }

    if (!form.fullName.trim()) errs.fullName = 'Requerido';

    if (!form.email) {
      errs.email = 'Requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Correo electrónico inválido';
    }

    if (form.email !== form.confirmEmail)
      errs.confirmEmail = 'Los correos no coinciden';

    if (!form.password || form.password.length < 6)
      errs.password = 'Mínimo 6 caracteres';

    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden';

    if (!form.phone) {
      errs.phone = 'Requerido';
    } else if (!validatePhone(form.phone)) {
      errs.phone = 'Teléfono inválido. Formato: +56912345678 ó 912345678';
    }

    if (!form.address.trim() || form.address.trim().length < 5)
      errs.address = 'Ingresa una dirección válida (mínimo 5 caracteres)';

    if (!form.commune.trim()) errs.commune = 'Requerido';

    if (!form.region) errs.region = 'Selecciona una región';

    if (!form.birthDate) {
      errs.birthDate = 'Requerido';
    } else if (!validateAge(form.birthDate)) {
      errs.birthDate = 'Debes tener al menos 13 años para registrarte';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Corrige los errores del formulario antes de continuar.', 'danger');
      return;
    }
    setLoading(true);

    // RF-6 / RF-11: Validar existencia real del correo con AbstractAPI
    const emailCheck = await validateEmailDeliverable(form.email);
    if (!emailCheck.valid) {
      setLoading(false);
      setErrors((prev) => ({ ...prev, email: emailCheck.reason }));
      showToast(emailCheck.reason, 'danger');
      return;
    }

    const ok = await register({ ...form });
    setLoading(false);

    if (!ok) {
      showToast('El correo electrónico ya está registrado. Prueba con otro.', 'danger');
      setErrors((prev) => ({ ...prev, email: 'Este correo ya está registrado' }));
      return;
    }

    setSuccess(true);
    showToast('¡Cuenta creada exitosamente! Bienvenido a Fukusuke.', 'success');
    setTimeout(() => navigate('/'), 1800);
  };

  return (
    <main className="auth-page auth-page--wide">
      <div className="auth-card auth-card--wide card border-0 shadow-sm">
        <div className="auth-card__header">
          <i className="bi bi-person-vcard auth-card__icon d-block mb-3" style={{ fontSize: '2.5rem', color: 'var(--color-primary)' }}></i>
          <h1>Crear cuenta</h1>
          <p>Regístrate para hacer tus pedidos en línea</p>
        </div>

        {success && <div className="alert alert-success">¡Registro exitoso! Redirigiendo…</div>}

        <form onSubmit={handleSubmit} noValidate className="register-form">

          {/* ── Datos personales ── */}
          <h3 className="section-title">Datos personales</h3>
          <div className="row g-3 register-grid">

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-run">
                RUN *
              </label>
              <input
                id="reg-run"
                className={`form-control ${errors.run ? 'is-invalid' : ''}`}
                value={form.run}
                onChange={set('run')}
                placeholder="12.345.678-5"
                autoComplete="off"
              />
              {errors.run
                ? <div className="invalid-feedback">{errors.run}</div>
                : <div className="form-hint">Formato: XX.XXX.XXX-X (con dígito verificador)</div>
              }
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-name">Nombre completo *</label>
              <input
                id="reg-name"
                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="María González"
                autoComplete="name"
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-email">Correo electrónico *</label>
              <input
                id="reg-email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="correo@ejemplo.cl"
                autoComplete="email"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-email2">Confirmar correo *</label>
              <input
                id="reg-email2"
                className={`form-control ${errors.confirmEmail ? 'is-invalid' : ''}`}
                type="email"
                value={form.confirmEmail}
                onChange={set('confirmEmail')}
                placeholder="correo@ejemplo.cl"
                autoComplete="off"
              />
              {errors.confirmEmail && <div className="invalid-feedback">{errors.confirmEmail}</div>}
            </div>

            {/* ── Contraseña con medidor de fortaleza (RNF-7) ── */}
            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-pw">Contraseña *</label>
              <div className="position-relative">
                <input
                  id="reg-pw"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-secondary p-2 me-1 border-0"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ zIndex: 5, background: 'none' }}
                >
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              {form.password && (
                <div className="pw-strength" aria-label={`Fortaleza: ${strength}`}>
                  <div className="pw-strength__bar">
                    <div
                      className="pw-strength__fill"
                      style={{ width: `${strengthPct}%`, background: strengthColor }}
                    />
                  </div>
                  <span className="pw-strength__label" style={{ color: strengthColor }}>
                    {strength}
                  </span>
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-pw2">Confirmar contraseña *</label>
              <input
                id="reg-pw2"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-phone">
                Teléfono *
                <span className="text-muted ms-1 fw-normal" style={{ fontSize: '0.8rem' }}>(+56912345678)</span>
              </label>
              <input
                id="reg-phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+56912345678"
                autoComplete="tel"
              />
              {errors.phone
                ? <div className="invalid-feedback">{errors.phone}</div>
                : <div className="form-hint">Número celular chileno</div>
              }
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-birth">
                Fecha de nacimiento *
                <span className="text-muted ms-1 fw-normal" style={{ fontSize: '0.8rem' }}>(mínimo 13 años)</span>
              </label>
              <input
                id="reg-birth"
                className={`form-control ${errors.birthDate ? 'is-invalid' : ''}`}
                type="date"
                value={form.birthDate}
                onChange={set('birthDate')}
                max={new Date(Date.now() - 13 * 365.25 * 24 * 3600 * 1000)
                  .toISOString().slice(0, 10)}
              />
              {errors.birthDate && <div className="invalid-feedback">{errors.birthDate}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="reg-gender">Sexo</label>
              <select id="reg-gender" className="form-select" value={form.gender} onChange={set('gender')}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="OTRO">Prefiero no indicar</option>
              </select>
            </div>
          </div>

          {/* ── Dirección ── */}
          <h3 className="section-title mt-4">Dirección de despacho</h3>
          <div className="row g-3 register-grid">
            <div className="col-12">
              <label className="form-label" htmlFor="reg-address">Dirección *</label>
              <input
                id="reg-address"
                className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                value={form.address}
                onChange={set('address')}
                placeholder="Av. Pajaritos 1234, Dpto 5B"
                autoComplete="street-address"
              />
              {errors.address && <div className="invalid-feedback">{errors.address}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label" htmlFor="reg-commune">Comuna *</label>
              <input
                id="reg-commune"
                className={`form-control ${errors.commune ? 'is-invalid' : ''}`}
                value={form.commune}
                onChange={set('commune')}
                placeholder="Maipú"
                autoComplete="address-level2"
              />
              {errors.commune && <div className="invalid-feedback">{errors.commune}</div>}
            </div>

            <div className="col-md-4">
              <label className="form-label" htmlFor="reg-province">Provincia</label>
              <input
                id="reg-province"
                className="form-control"
                value={form.province}
                onChange={set('province')}
                placeholder="Santiago"
                autoComplete="address-level1"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label" htmlFor="reg-region">Región *</label>
              <select
                id="reg-region"
                className={`form-select ${errors.region ? 'is-invalid' : ''}`}
                value={form.region}
                onChange={set('region')}
              >
                <option value="">Selecciona…</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <div className="invalid-feedback">{errors.region}</div>}
            </div>
          </div>

          <button
            className="btn btn-primary auth-card__submit w-100 mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Registrando…' : 'Crear cuenta'}
          </button>
        </form>

        <hr className="divider" />
        <p className="auth-card__footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
  );
}
