// Paleta e identidad visual propias de Dark Store — no participa del sistema de variables
// CSS del CRM (ese solo aplica a las pantallas logueadas). Mismo criterio que tienda/
// cotillon: consts hex + inline style, nada de rgb(var(--x)).
export const BG = '#090B10';
export const BG_SOFT = '#11151D';
export const CARD = '#171C26';
export const CARD_BORDER = 'rgba(255,255,255,0.08)';
export const ACCENT = '#7C3AED';       // violeta MAON Dark Store
export const ACCENT_SOFT = 'rgba(124,58,237,0.18)';
export const NEON = '#C6FF3C';         // verde lima — "abierto", ofertas, urgencia
export const TEXT = '#F5F5F7';
export const MUTED = '#9AA1AE';
export const ROSE = '#F43F5E';

export const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

/** Nombre a mostrar de una línea de carrito/checkout — suma el sabor elegido si tiene. */
export const lineName = (l: { item: { name: string }; flavor?: string }) =>
  l.flavor ? `${l.item.name} (${l.flavor})` : l.item.name;

// El carrito se vacía apenas se confirma el pedido (checkout -> submit), así que la
// pantalla de confirmación ya no tiene de dónde sacar el detalle para el mensaje de
// WhatsApp. Se guarda una foto del pedido en sessionStorage justo antes de limpiar el
// carrito — vive solo hasta que se cierra la pestaña, no hace falta persistirlo más.
const ORDER_SUMMARY_KEY = 'compven_dark_store_last_order';

export interface DarkStoreOrderSummary {
  numero: string;
  customerName: string;
  address: string;
  barrio: string;
  lines: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function saveOrderSummary(o: DarkStoreOrderSummary) {
  try { sessionStorage.setItem(ORDER_SUMMARY_KEY, JSON.stringify(o)); } catch {}
}

export function loadOrderSummary(): DarkStoreOrderSummary | null {
  try {
    const raw = sessionStorage.getItem(ORDER_SUMMARY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** "HH:mm" -> minutos desde medianoche, para comparar horarios sin librería de fechas. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Hora actual en Rosario (America/Argentina/Buenos_Aires) como "HH:mm", sin librerías. */
export function nowInBuenosAires(): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}

/** true si "ahora" cae dentro de [scheduleStart, scheduleEnd) — soporta ventana que cruza medianoche. */
export function isWithinSchedule(scheduleStart: string, scheduleEnd: string, nowHHmm = nowInBuenosAires()): boolean {
  const start = toMinutes(scheduleStart);
  const end = toMinutes(scheduleEnd);
  const now = toMinutes(nowHHmm);
  if (start === end) return true; // 24hs
  if (start < end) return now >= start && now < end;
  return now >= start || now < end; // cruza medianoche, ej. 22:00–02:00
}
