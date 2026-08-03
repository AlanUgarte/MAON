// Script puntual: sincroniza precios de costo (y stock, si el archivo trae columna
// "Stock") desde el Excel del proveedor directo contra la base de Railway, replicando
// la misma lógica de products.service.ts#importPricesFromExcel (fallback BRUTO UNIDAD,
// no pisar nombre/categoría/marca/unidades/stock cuando el archivo no las trae).
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL de Railway> node scripts/sync-precios.mjs <archivo.xlsx> [--apply]
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!filePath) { console.error('Uso: node sync-precios.mjs <archivo.xlsx> [--apply]'); process.exit(1); }

const prisma = new PrismaClient();

const parseNum = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isFinite(n) && n > 0 ? n : null;
};

async function main() {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames.includes('BULTO') ? 'BULTO' : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error('El archivo no tiene hojas para leer');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim() === 'Código'));
  if (headerIdx === -1) throw new Error('No se encontró la fila de encabezado (columna "Código")');
  const header = rows[headerIdx].map((c) => String(c).trim());
  const col = (name) => header.indexOf(name);
  const skuCol = col('Código'), nameCol = col('Nombre del Artículo'), catCol = col('Categoría'),
    brandCol = col('Marca'), unitsCol = col('Cant. Bulto'), bultoCol = col('BRUTO BULTO'), unidadCol = col('BRUTO UNIDAD'),
    stockCol = col('Stock'), lineCol = col('Línea');
  if (skuCol === -1 || (bultoCol === -1 && unidadCol === -1)) {
    throw new Error('Faltan las columnas "Código" y/o "BRUTO BULTO"/"BRUTO UNIDAD"');
  }

  const items = [];
  let skippedNoSku = 0, skippedBadPrice = 0;
  const seenSku = new Set();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[skuCol] ?? '').trim();
    if (!sku || seenSku.has(sku)) { skippedNoSku++; continue; }
    const bulto = bultoCol !== -1 ? parseNum(row[bultoCol]) : null;
    const unidad = unidadCol !== -1 ? parseNum(row[unidadCol]) : null;
    const price = bulto ?? unidad;
    if (price === null) { skippedBadPrice++; continue; }
    seenSku.add(sku);
    items.push({
      sku,
      name: nameCol !== -1 ? (String(row[nameCol] ?? '').trim() || null) : null,
      category: catCol !== -1 ? (String(row[catCol] ?? '').trim() || null) : null,
      line: lineCol !== -1 ? (String(row[lineCol] ?? '').trim().replace(/^-+\s*/, '') || null) : null,
      brand: brandCol !== -1 ? (String(row[brandCol] ?? '').trim() || null) : null,
      units: unitsCol !== -1 ? (Number(row[unitsCol]) || null) : null,
      price: Math.round(price * 100) / 100,
      stock: stockCol !== -1 ? Math.max(0, Math.round(Number(row[stockCol]) || 0)) : null,
    });
  }
  if (!items.length) throw new Error('No se encontró ningún artículo con código y precio válidos');

  const skus = items.map((i) => i.sku);
  const existing = [];
  const CHUNK_LOOKUP = 5000;
  for (let i = 0; i < skus.length; i += CHUNK_LOOKUP) {
    const chunk = skus.slice(i, i + CHUNK_LOOKUP);
    existing.push(...await prisma.product.findMany({ where: { sku: { in: chunk } }, select: { sku: true, name: true, price: true, stock: true } }));
  }
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));
  const toCreate = items.filter((i) => !existingBySku.has(i.sku) && i.name);
  const toUpdate = items.filter((i) => existingBySku.has(i.sku));
  const skippedUnknownSku = items.filter((i) => !existingBySku.has(i.sku) && !i.name).length;

  const changed = toUpdate.filter((it) => Number(existingBySku.get(it.sku).price) !== it.price);
  const stockChanged = stockCol !== -1 ? toUpdate.filter((it) => existingBySku.get(it.sku).stock !== it.stock) : [];
  console.log(`Filas con código+precio válido: ${items.length}`);
  console.log(`  a crear (nuevos, con nombre en el archivo): ${toCreate.length}`);
  console.log(`  a actualizar (ya existen): ${toUpdate.length} (de los cuales cambian de precio: ${changed.length}${stockCol !== -1 ? `, cambian de stock: ${stockChanged.length}` : ''})`);
  console.log(`  sin código / duplicados: ${skippedNoSku}`);
  console.log(`  sin precio válido: ${skippedBadPrice}`);
  console.log(`  código nuevo sin nombre en el archivo (no se puede crear): ${skippedUnknownSku}`);
  console.log('\nMuestra de cambios de precio (primeros 20):');
  for (const it of changed.slice(0, 20)) {
    const cur = existingBySku.get(it.sku);
    console.log(`  ${it.sku} ${cur.name}: $${Number(cur.price)} -> $${it.price}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    return;
  }

  const CHUNK = 1000;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${`prod_${it.sku}`}, ${it.name}::text, ${it.sku}, ${it.category}::text, ${it.line}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric, ${it.stock ?? 0}::int)`),
      ',',
    );
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, name, sku, category, line, brand, "unitsPerBulk", price, stock, "isActive", "createdAt", "updatedAt")
      SELECT id, name, sku, category, line, brand, "unitsPerBulk", price, stock, true, now(), now()
      FROM (VALUES ${values}) AS v(id, name, sku, category, line, brand, "unitsPerBulk", price, stock)
    `;
    console.log(`Creados ${Math.min(i + CHUNK, toCreate.length)}/${toCreate.length}`);
  }
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${it.sku}, ${it.name}::text, ${it.category}::text, ${it.line}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric, ${it.stock}::int)`),
      ',',
    );
    await prisma.$executeRaw`
      UPDATE "Product" AS p SET
        price = v.price,
        name = COALESCE(v.name, p.name),
        category = COALESCE(v.category, p.category),
        line = COALESCE(v.line, p.line),
        brand = COALESCE(v.brand, p.brand),
        "unitsPerBulk" = COALESCE(v.units, p."unitsPerBulk"),
        stock = COALESCE(v.stock, p.stock),
        "updatedAt" = now()
      FROM (VALUES ${values}) AS v(sku, name, category, line, brand, units, price, stock)
      WHERE p.sku = v.sku
    `;
    console.log(`Actualizados ${Math.min(i + CHUNK, toUpdate.length)}/${toUpdate.length}`);
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
