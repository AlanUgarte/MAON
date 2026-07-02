/**
 * Ventana de mensajería gratis de WhatsApp.
 * - 24 h desde el último mensaje del cliente (caso general).
 * - 72 h si el lead entró por un anuncio Click-to-WhatsApp (Meta Ads).
 * Mientras la ventana está abierta, responder al cliente no tiene costo.
 * Fuera de la ventana, enviar requiere una plantilla paga.
 */

export const FREE_WINDOW_HOURS = { ad: 72, normal: 24 };

export function freeWindowHours(fromAd: boolean): number {
  return fromAd ? FREE_WINDOW_HOURS.ad : FREE_WINDOW_HOURS.normal;
}

export function isFreeWindowOpen(
  lastInboundAt: Date | string | null | undefined,
  fromAd = false,
): boolean {
  if (!lastInboundAt) return false;
  const last = new Date(lastInboundAt).getTime();
  const limit = freeWindowHours(fromAd) * 3600_000;
  return Date.now() - last < limit;
}

/** Horas restantes de ventana gratis (0 si está cerrada). */
export function freeWindowRemainingHours(
  lastInboundAt: Date | string | null | undefined,
  fromAd = false,
): number {
  if (!lastInboundAt) return 0;
  const last = new Date(lastInboundAt).getTime();
  const limit = freeWindowHours(fromAd) * 3600_000;
  const remaining = limit - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / 3600_000) : 0;
}
