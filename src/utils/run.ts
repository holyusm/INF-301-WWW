/**
 * Valida un RUN/RUT chileno.
 * Acepta formatos: "12.345.678-5", "12345678-5", "123456785"
 */
export function validateRun(run: string): boolean {
  // Eliminar puntos y espacios
  const clean = run.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  // Eliminar el guion para trabajar con el cuerpo + DV juntos
  const withoutDash = clean.replace('-', '');

  // Debe ser 8 o 9 caracteres: 7-8 dígitos + dígito verificador (0-9 o K)
  if (!/^\d{7,8}[0-9K]$/.test(withoutDash)) return false;

  const body = withoutDash.slice(0, -1);
  const dv   = withoutDash.slice(-1);

  // Algoritmo módulo 11
  let sum    = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum   += parseInt(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected  =
    remainder === 11 ? '0' :
    remainder === 10 ? 'K' :
    String(remainder);

  return dv === expected;
}
