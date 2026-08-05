'use client';

// Junta lo que casi todas las páginas de Dark Store necesitan: settings, catálogo
// combinado (productos + vapeadores) y carrito — para no repetir estos 3 hooks en cada page.tsx.
import { useDarkStoreSettings } from '@/lib/dark-store-settings-store';
import { useDarkStoreCatalog } from '@/lib/dark-store-catalog';
import { useDarkStoreCart } from '@/lib/dark-store-cart';
import { darkStorePrice } from '@/lib/dark-store-pricing';

export function useDarkStoreShell() {
  const { settings, save } = useDarkStoreSettings();
  const { items, loading } = useDarkStoreCatalog(settings);
  const cart = useDarkStoreCart();

  const itemById = new Map(items.map((i) => [`${i.kind}:${i.id}`, i]));
  const cartLines = cart.lines
    .map((l) => ({ ...l, item: itemById.get(`${l.kind}:${l.id}`) }))
    .filter((l): l is typeof l & { item: NonNullable<typeof l.item> } => !!l.item);
  const cartTotal = cartLines.reduce((a, l) => a + l.item.price * l.qty, 0);

  return { settings, saveSettings: save, items, loading, cart, cartLines, cartTotal, darkStorePrice };
}
