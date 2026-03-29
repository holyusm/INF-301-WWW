/**
 * RNF-7: Control de sesiones.
 * Cierra la sesión automáticamente después de TIMEOUT_MS de inactividad.
 * Emite un aviso 2 minutos antes de expirar.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TIMEOUT_MS   = 30 * 60 * 1000; // 30 minutos
const WARNING_MS   = 28 * 60 * 1000; // aviso 2 min antes
const CHECK_MS     = 30 * 1000;       // verificar cada 30 seg
const ACTIVITY_KEY = 'fukusuke_activity';

const TRACKED_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuth();
  const { showToast }               = useToast();
  const warnedRef                   = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      warnedRef.current = false;
      localStorage.removeItem(ACTIVITY_KEY);
      return;
    }

    const markActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
      warnedRef.current = false; // reset aviso al detectar actividad
    };

    TRACKED_EVENTS.forEach((ev) =>
      window.addEventListener(ev, markActivity, { passive: true })
    );
    markActivity(); // registrar el login como actividad

    const interval = setInterval(() => {
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) ?? '0', 10);
      const idle = Date.now() - last;

      if (idle >= TIMEOUT_MS) {
        logout();
        localStorage.removeItem(ACTIVITY_KEY);
        showToast('Tu sesión expiró por inactividad. Inicia sesión nuevamente.', 'warning', 8000);
      } else if (idle >= WARNING_MS && !warnedRef.current) {
        warnedRef.current = true;
        showToast('Tu sesión se cerrará en 2 minutos por inactividad.', 'warning', 6000);
      }
    }, CHECK_MS);

    return () => {
      TRACKED_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated, logout, showToast]);
}
