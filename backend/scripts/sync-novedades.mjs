// Marca artículos como "Novedades" (isNew) en TiendaSettings/CotillonSettings.productPromos
// a partir de una lista de códigos SAP (ej: la que llega en el PDF "LISTA DE PRECIOS" de novedades).
// Usa el catálogo estático (tyna-products.json) para resolver sku -> id (`t${sku}`) y categoría,
// porque productPromos se indexa por ese id, no por el id real de Product en la DB.
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL> node sync-novedades.mjs <skus.json> [--apply]
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const skusPath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!skusPath) { console.error('Uso: node sync-novedades.mjs <skus.json> [--apply]'); process.exit(1); }

const prisma = new PrismaClient();
const CATALOG = 'C:/Users/Tyna/Desktop/proye/compven/frontend/public/data/tyna-products.json';
const SINGLETON_ID = 'singleton';

async function main() {
  const skus = JSON.parse(readFileSync(skusPath, 'utf8'));
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const bySku = new Map(catalog.map((p) => [p.sku, p]));

  const matched = [];
  const notFound = [];
  for (const sku of skus) {
    const p = bySku.get(sku);
    if (p) matched.push(p); else notFound.push(sku);
  }
  const cotillonMatched = matched.filter((p) => p.category === 'Cotillon');

  console.log(`Códigos en la lista: ${skus.length}`);
  console.log(`  encontrados en catálogo: ${matched.length} (de Cotillón: ${cotillonMatched.length})`);
  console.log(`  no encontrados: ${notFound.length}`);
  if (notFound.length) console.log('  ' + notFound.join(', '));

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    return;
  }

  const tienda = await prisma.tiendaSettings.upsert({ where: { id: SINGLETON_ID }, update: {}, create: { id: SINGLETON_ID } });
  const tiendaPromos = { ...tienda.productPromos };
  for (const p of matched) tiendaPromos[p.id] = { ...tiendaPromos[p.id], isNew: true };
  await prisma.tiendaSettings.update({ where: { id: SINGLETON_ID }, data: { productPromos: tiendaPromos } });
  console.log(`Tienda: ${matched.length} artículos marcados como Novedades.`);

  if (cotillonMatched.length) {
    const cotillon = await prisma.cotillonSettings.upsert({ where: { id: SINGLETON_ID }, update: {}, create: { id: SINGLETON_ID } });
    const cotillonPromos = { ...cotillon.productPromos };
    for (const p of cotillonMatched) cotillonPromos[p.id] = { ...cotillonPromos[p.id], isNew: true };
    await prisma.cotillonSettings.update({ where: { id: SINGLETON_ID }, data: { productPromos: cotillonPromos } });
    console.log(`Cotillón: ${cotillonMatched.length} artículos marcados como Novedades.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
