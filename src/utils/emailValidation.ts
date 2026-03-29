const API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY as string;

export type EmailValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

export async function validateEmailDeliverable(email: string): Promise<EmailValidationResult> {
  try {
    const res = await fetch(
      `https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`
    );
    if (!res.ok) return { valid: true }; // Si la API falla, no bloqueamos al usuario

    const data = await res.json();

    if (!data.email_deliverability?.is_format_valid) {
      return { valid: false, reason: 'El formato del correo es inválido.' };
    }
    if (data.email_deliverability?.is_disposable) {
      return { valid: false, reason: 'No se permiten correos desechables.' };
    }
    if (data.email_deliverability?.status === 'undeliverable') {
      return { valid: false, reason: 'El correo no existe o no es válido.' };
    }
    if (!data.email_deliverability?.is_mx_valid) {
      return { valid: false, reason: 'El dominio del correo no tiene servidor de correo activo.' };
    }

    return { valid: true };
  } catch {
    return { valid: true }; // Si hay error de red, no bloqueamos
  }
}
