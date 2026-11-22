export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 16);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + Math.round(n));
  return toISO(d);
}
export function diffDays(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}
export const daysUntil = (iso) => diffDays(todayISO(), iso);

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function fmtDate(iso, { weekday = false, year } = {}) {
  const d = parseISO(iso);
  const showYear = year ?? d.getFullYear() !== new Date().getFullYear();
  return `${weekday ? WEEKDAYS[d.getDay()] + ' ' : ''}${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}${showYear ? ' ' + d.getFullYear() : ''}`;
}
export const monthKey = (iso) => String(iso).slice(0, 7);
export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  const label = MONTHS[m - 1];
  return (label[0].toUpperCase() + label.slice(1)) + (y !== new Date().getFullYear() ? ` ${y}` : '');
}

export function humanDays(n) {
  n = Math.round(n);
  if (n <= 1) return '1 día';
  if (n < 7) return `${n} días`;
  if (n === 7) return '1 semana';
  if (n < 30) return n % 7 === 0 ? `${n / 7} semanas` : `${n} días`;
  if (n < 45) return '1 mes';
  if (n < 365) return `${Math.round(n / 30)} meses`;
  const y = Math.round(n / 365);
  return y === 1 ? '1 año' : `${y} años`;
}

// Texto largo: "vence en 3 días", "venció ayer"
export function relExpiry(n, approx) {
  const a = approx ? 'aprox. ' : '';
  if (n < -1) return `Venció hace ${-n} días`;
  if (n === -1) return 'Venció ayer';
  if (n === 0) return approx ? 'Úsalo hoy' : 'Vence hoy';
  if (n === 1) return `Vence ${a}mañana`;
  return `Vence ${a}en ${humanDays(n)}`;
}

// Texto corto para chips
export function shortExpiry(n, approx) {
  if (n < 0) return 'Vencido';
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  const t = n < 14 ? `${n} días` : n < 60 ? `${Math.round(n / 7)} sem` : n < 365 ? `${Math.round(n / 30)} meses` : `${Math.round(n / 365)} año${n >= 730 ? 's' : ''}`;
  return (approx ? '≈ ' : '') + t;
}

export function relPast(iso) {
  const n = -daysUntil(iso);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  if (n < 7) return `hace ${n} días`;
  return `el ${fmtDate(iso)}`;
}

export function status(n) {
  if (n < 0) return 'vencido';
  if (n <= 3) return 'pronto';
  return 'fresco';
}

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const fmtMoney = (n) => money.format(Number(n) || 0);
export const fmtNum = (n) => String(Number(Number(n).toFixed(3)));

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
