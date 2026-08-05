// Única regla de precio de Dark Store: costo + margen configurable (default 25%). Se
// centraliza acá para no recalcularlo distinto en la tarjeta, el carrito, el checkout y
// el mensaje de WhatsApp.
export function darkStorePrice(cost: number, marginPct: number): number {
  return Math.round(cost * (1 + marginPct / 100) * 100) / 100;
}
