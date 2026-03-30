const API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY as string;

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export async function validateEmailDeliverable(email: string): Promise<EmailValidationResult> {
  // Si no hay API KEY, permitimos el registro sin bloquear para desarrollo local.
  if (!API_KEY) {
    console.warn('VITE_ABSTRACT_API_KEY no definido, saltando validación');
    return { valid: true };
  }

  try {
    const res = await fetch(
      `https://emailreputation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return { valid: true }; // Si la API falla, no bloqueamos al usuario

    const data = await res.json();

    if (data.email_deliverability?.is_format_valid === false) {
      return { valid: false, reason: 'El formato del correo es inválido.' };
    }
    if (data.email_quality?.is_disposable === true) {
      return { valid: false, reason: 'No se permiten correos temporales ni desechables.' };
    }
    if (data.email_deliverability?.status === 'undeliverable') {
      return { valid: false, reason: 'El correo no existe o no puede recibir mensajes.' };
    }
    if (data.email_deliverability?.is_mx_valid === false) {
      return { valid: false, reason: 'El dominio del correo no cuenta con servidor de correo.' };
    }

    return { valid: true };
  } catch (err) {
    console.error('Error al validar correo con Abstract:', err);
    return { valid: true }; // Si hay error de red, no bloqueamos
  }
}
