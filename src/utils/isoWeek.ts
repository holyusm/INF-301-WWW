/**
 * Replica ReportsService.getWeekIdForDate del backend (ISO 8601, formato 'YYYY-WNN')
 * para poder pedir GET /reports/:weekId de semanas pasadas sin depender de que el
 * backend exponga un endpoint de navegación por offset.
 */
export function getWeekId(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // domingo = 7 (ISO)
  d.setDate(d.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const week = String(weekNumber).padStart(2, '0');
  return `${d.getFullYear()}-W${week}`;
}
