// Sincroniza SOLO imágenes desde el maestro completo del proveedor (hoja "Sheet1", una fila
// por SKU x unidad de medida — la URL de imagen es la misma en todas las filas de un mismo
// SKU, así que alcanza con una por artículo). No toca precio/stock/nombre de artículos que
// ya existen — solo su campo de imagen. Si el SKU no existe en la base y el archivo trae
// nombre + precio, lo crea (con imagen incluida).
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL de Railway> node scripts/sync-images.mjs <archivo.xlsx> [--apply]
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!filePath) { console.error('Uso: node sync-images.mjs <archivo.xlsx> [--apply]'); process.exit(1); }

const prisma = new PrismaClient();
const parseNum = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isFinite(n) ? n : null;
};

async function main() {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const header = rows[0].map((c) => String(c).trim());
  const col = (name) => header.indexOf(name);
  const skuCol = col('Número de artículo'), nameCol = col('Descripción del artículo'),
    catCol = col('Nombre de grupo'), lineCol = col('Linea'), brandCol = col('Marca'),
    imgCol = col('URL WEB'), priceCol = col('PriceBruto'), stockCol = col('Disponible'),
    uomCol = col('Código de unidad de medida');
  if (skuCol === -1 || imgCol === -1) throw new Error('Faltan las columnas "Número de artículo" y/o "URL WEB"');

  // Una fila por SKU: la imagen es igual en todas las filas (BULTO/UNIDAD/DISPLAY/...) de
  // un mismo artículo, así que la primera que aparece alcanza. Se prioriza la fila BULTO
  // por si hace falta precio/stock para crear un artículo nuevo (es la fila confiable).
  const bySku = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[skuCol] ?? '').trim();
    if (!sku) continue;
    const isBulto = uomCol !== -1 && String(row[uomCol]).trim() === 'BULTO';
    const existing = bySku.get(sku);
    if (existing && !isBulto) continue; // ya hay una fila guardada y esta no es BULTO: no pisa
    bySku.set(sku, row);
  }

  const items = [];
  for (const [sku, row] of bySku) {
    const img = String(row[imgCol] ?? '').trim();
    if (!img) continue;
    items.push({
      sku,
      img,
      name: nameCol !== -1 ? (String(row[nameCol] ?? '').trim() || null) : null,
      category: catCol !== -1 ? (String(row[catCol] ?? '').trim() || null) : null,
      line: lineCol !== -1 ? (String(row[lineCol] ?? '').trim() || null) : null,
      brand: brandCol !== -1 ? (String(row[brandCol] ?? '').trim() || null) : null,
      price: priceCol !== -1 ? parseNum(row[priceCol]) : null,
      stock: stockCol !== -1 ? Math.max(0, Math.round(parseNum(row[stockCol]) || 0)) : null,
    });
  }
  console.log(`Artículos con URL de imagen en el archivo: ${items.length}`);

  const skus = items.map((i) => i.sku);
  const existing = [];
  const CHUNK_LOOKUP = 5000;
  for (let i = 0; i < skus.length; i += CHUNK_LOOKUP) {
    const chunk = skus.slice(i, i + CHUNK_LOOKUP);
    existing.push(...await prisma.product.findMany({ where: { sku: { in: chunk } }, select: { sku: true, name: true, images: true } }));
  }
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));

  const toUpdate = items.filter((it) => {
    const cur = existingBySku.get(it.sku);
    return cur && cur.images?.[0] !== it.img;
  });
  const toCreate = items.filter((it) => !existingBySku.has(it.sku) && it.name && it.price !== null && it.price > 0);
  const skippedNewNoData = items.filter((it) => !existingBySku.has(it.sku) && !(it.name && it.price !== null && it.price > 0)).length;

  console.log(`  imágenes a actualizar (cambiaron, artículo ya existe): ${toUpdate.length}`);
  console.log(`  artículos nuevos a crear (con nombre y precio en el archivo): ${toCreate.length}`);
  console.log(`  ya estaban igual (sin cambios): ${items.filter((it) => existingBySku.has(it.sku) && existingBySku.get(it.sku).images?.[0] === it.img).length}`);
  console.log(`  nuevos sin datos suficientes para crear (falta nombre/precio válido): ${skippedNewNoData}`);
  console.log('\nMuestra de imágenes que cambian (primeras 15):');
  for (const it of toUpdate.slice(0, 15)) {
    const cur = existingBySku.get(it.sku);
    console.log(`  ${it.sku} ${cur.name}\n    antes: ${cur.images?.[0] || '(sin imagen)'}\n    ahora: ${it.img}`);
  }
  console.log('\nMuestra de artículos nuevos (primeros 10):');
  for (const it of toCreate.slice(0, 10)) {
    console.log(`  ${it.sku} ${it.name} — $${it.price} — ${it.category || '-'} / ${it.brand || '-'}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    return;
  }

  const CHUNK = 1000;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = Prisma.join(chunk.map((it) => Prisma.sql`(${it.sku}, ${[it.img]}::text[])`), ',');
    await prisma.$executeRaw`
      UPDATE "Product" AS p SET images = v.images, "updatedAt" = now()
      FROM (VALUES ${values}) AS v(sku, images)
      WHERE p.sku = v.sku
    `;
    console.log(`Imágenes actualizadas ${Math.min(i + CHUNK, toUpdate.length)}/${toUpdate.length}`);
  }
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${`prod_${it.sku}`}, ${it.name}::text, ${it.sku}, ${it.category}::text, ${it.line}::text, ${it.brand}::text, ${it.price}::numeric, ${it.stock ?? 0}::int, ${[it.img]}::text[])`),
      ',',
    );
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, name, sku, category, line, brand, price, stock, images, "isActive", "createdAt", "updatedAt")
      SELECT id, name, sku, category, line, brand, price, stock, images, true, now(), now()
      FROM (VALUES ${values}) AS v(id, name, sku, category, line, brand, price, stock, images)
    `;
    console.log(`Creados ${Math.min(i + CHUNK, toCreate.length)}/${toCreate.length}`);
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
