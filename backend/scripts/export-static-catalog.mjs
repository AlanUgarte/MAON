// Regenera el catálogo estático que lee la Tienda pública (frontend/public/data/tyna-products.json)
// a partir de la base real — hace falta correrlo cada vez que se sincronizan precios/
// artículos nuevos, si no la Tienda sigue mostrando el catálogo viejo.
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL> node export-static-catalog.mjs
import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';

const prisma = new PrismaClient();
const OUT = 'C:/Users/Tyna/Desktop/proye/compven/frontend/public/data/tyna-products.json';

async function main() {
  // La base real no tiene columna "línea" (subcategoría que usa el filtro de
  // FastCotillón) — se preserva del archivo viejo por SKU para no perderla al regenerar.
  let oldLineBySku = new Map();
  try {
    const old = JSON.parse(readFileSync(OUT, 'utf8'));
    oldLineBySku = new Map(old.filter((p) => p.line).map((p) => [p.sku, p.line]));
  } catch { /* si no existe el archivo viejo, arranca sin líneas */ }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  const rows = products.map((p) => ({
    id: `t${p.sku}`,
    name: p.name,
    sku: p.sku,
    category: p.category ?? '',
    brand: p.brand ?? '-',
    units: p.unitsPerBulk ?? 0,
    img: p.images?.[0] ?? '',
    price: Number(p.price),
    stock: p.stock ?? 0,
    active: p.isActive,
    ...(oldLineBySku.has(p.sku) ? { line: oldLineBySku.get(p.sku) } : {}),
  }));
  writeFileSync(OUT, JSON.stringify(rows));
  console.log(`Exportados ${rows.length} productos a ${OUT} (${oldLineBySku.size} con línea preservada)`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
