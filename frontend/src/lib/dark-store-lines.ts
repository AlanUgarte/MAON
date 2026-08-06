// Las "líneas" son la subcategoría que ya trae cada producto del proveedor (Vinos,
// Gaseosas, Tabletas, Bombones...). Vienen en MAYÚSCULAS y con duplicados por typo
// (SNACK/SNACKS HORNEADOS, OBLEA/OBLEAS BAÑADAS), así que se unifican acá y se
// derivan en vivo del catálogo — si mañana el proveedor agrega una línea nueva,
// aparece sola en el menú sin tocar código.

/** Variantes del proveedor que son la misma línea escrita distinto. */
const ALIAS: Record<string, string> = {
  'SNACK HORNEADOS': 'SNACKS HORNEADOS',
  'OBLEA BAÑADA': 'OBLEAS BAÑADAS',
  'BARRA DE CHOCOLATE': 'BARRA',
  INFANTIL: 'LINEA INFANTIL',
  'CROPPERS UNID': 'CROPPERS',
};

/** Bucket para los productos que no tienen línea cargada. */
export const OTHER_LINE = 'OTROS';

export function normalizeLine(raw?: string | null): string {
  const v = (raw ?? '').trim().toUpperCase();
  if (!v || v === 'NULL') return OTHER_LINE;
  return ALIAS[v] ?? v;
}

/** "JUGOS LISTOS" → "Jugos listos" */
export function lineLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

/** "AGUAS S/GAS" → "aguas-s-gas" (lo que viaja en la URL) */
export function lineSlug(key: string): string {
  return key
    .toLowerCase()
    // NFD separa la tilde de la letra y el filtro ASCII la descarta: "bañado" → "banado".
    .normalize('NFD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface DarkStoreLine {
  key: string;
  label: string;
  slug: string;
  count: number;
}

/** Líneas presentes en una categoría, con cuántos productos tiene cada una. */
export function linesOf(
  items: readonly { category: string; line?: string }[],
  category: string,
): DarkStoreLine[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    if (it.category !== category) continue;
    const key = it.line ?? OTHER_LINE;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([key, count]) => ({ key, label: lineLabel(key), slug: lineSlug(key), count }))
    .sort((a, b) =>
      // "Otros" siempre al final; el resto por cantidad de productos.
      (a.key === OTHER_LINE ? 1 : 0) - (b.key === OTHER_LINE ? 1 : 0) || b.count - a.count,
    );
}
