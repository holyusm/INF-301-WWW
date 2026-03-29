import { useToast, type ToastItem } from '../context/ToastContext';
import './ToastContainer.css';

const ICONS: Record<ToastItem['type'], string> = {
  success: '✅',
  danger:  '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-item--${toast.type}`}
          role="alert"
        >
          <span className="toast-item__icon" aria-hidden="true">{ICONS[toast.type]}</span>
          <span className="toast-item__msg">{toast.message}</span>
          <button
            className="toast-item__close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
