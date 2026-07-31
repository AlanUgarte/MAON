// Sync desde el export completo de SAP (LISTA317-style): trae nombre, marca, categoría,
// unidades por bulto, precio bruto, stock disponible y URL de imagen real por artículo.
// Cada artículo aparece en 3 filas (una por unidad de medida: BULTO/DISPLAY/UNIDAD) — solo
// se usa la fila BULTO, que es la que tiene el precio "bruto bulto" real y el stock
// disponible correctos (las otras filas repiten mal esos valores, no son confiables).
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL> node sync-catalogo-full.mjs <archivo.xlsx> [--apply]
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!filePath) { console.error('Uso: node sync-catalogo-full.mjs <archivo.xlsx> [--apply]'); process.exit(1); }

const prisma = new PrismaClient();

const COL = {
  marca: 8, categoria: 13, sku: 14, nombreCorto: 15, nombre: 16,
  uom: 5, urlImg: 35, unitsPerBulk: 45, disponible: 51, priceBruto: 97,
};

async function main() {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets['Sheet1'] ?? wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const items = [];
  let skippedNoSku = 0, skippedBadPrice = 0, skippedNoBultoRow = 0;
  const seenSku = new Set();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[COL.uom]).trim() !== 'BULTO') continue; // solo la fila confiable
    const sku = String(row[COL.sku] ?? '').trim();
    if (!sku || seenSku.has(sku)) { skippedNoSku++; continue; }
    const price = Number(row[COL.priceBruto]);
    if (!isFinite(price) || price <= 0) { skippedBadPrice++; continue; }
    seenSku.add(sku);
    const name = String(row[COL.nombre] ?? '').trim() || String(row[COL.nombreCorto] ?? '').trim();
    const stockRaw = Number(row[COL.disponible]);
    const url = String(row[COL.urlImg] ?? '').trim();
    items.push({
      sku,
      name: name || null,
      category: String(row[COL.categoria] ?? '').trim() || null,
      brand: String(row[COL.marca] ?? '').trim() || null,
      units: Number(row[COL.unitsPerBulk]) || null,
      price: Math.round(price * 100) / 100,
      stock: isFinite(stockRaw) ? Math.max(0, Math.round(stockRaw)) : null,
      imageUrl: url || null,
    });
  }
  const totalSkus = new Set(rows.slice(1).map((r) => String(r[COL.sku] ?? '').trim()).filter(Boolean));
  skippedNoBultoRow = totalSkus.size - seenSku.size - skippedBadPrice;
  if (!items.length) throw new Error('No se encontró ningún artículo con código y precio válidos');

  const skus = items.map((i) => i.sku);
  const existing = [];
  const CHUNK_LOOKUP = 5000;
  for (let i = 0; i < skus.length; i += CHUNK_LOOKUP) {
    const chunk = skus.slice(i, i + CHUNK_LOOKUP);
    existing.push(...await prisma.product.findMany({ where: { sku: { in: chunk } }, select: { sku: true, name: true, price: true, images: true } }));
  }
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));
  const toCreate = items.filter((i) => !existingBySku.has(i.sku) && i.name);
  const toUpdate = items.filter((i) => existingBySku.has(i.sku));
  const skippedUnknownSku = items.filter((i) => !existingBySku.has(i.sku) && !i.name).length;
  const withNewImage = toUpdate.filter((it) => it.imageUrl && !(existingBySku.get(it.sku).images?.length)).length;

  const changed = toUpdate.filter((it) => Number(existingBySku.get(it.sku).price) !== it.price);
  console.log(`Filas BULTO con código+precio válido: ${items.length}`);
  console.log(`  a crear (nuevos): ${toCreate.length}`);
  console.log(`  a actualizar (ya existen): ${toUpdate.length} (cambian de precio: ${changed.length}, ganan imagen que no tenían: ${withNewImage})`);
  console.log(`  sin código / duplicados: ${skippedNoSku}`);
  console.log(`  sin precio válido: ${skippedBadPrice}`);
  console.log(`  artículos sin fila BULTO (no se pudo confirmar precio real): ${Math.max(0, skippedNoBultoRow)}`);
  console.log(`  código nuevo sin nombre (no se puede crear): ${skippedUnknownSku}`);
  console.log('\nMuestra de cambios de precio (primeros 15):');
  for (const it of changed.slice(0, 15)) {
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
      chunk.map((it) => Prisma.sql`(${`prod_${it.sku}`}, ${it.name}::text, ${it.sku}, ${it.category}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric, ${it.stock ?? 0}::int, ${it.imageUrl ? [it.imageUrl] : []}::text[])`),
      ',',
    );
    await prisma.$executeRaw`
      INSERT INTO "Product" (id, name, sku, category, brand, "unitsPerBulk", price, stock, images, "isActive", "createdAt", "updatedAt")
      SELECT id, name, sku, category, brand, "unitsPerBulk", price, stock, images, true, now(), now()
      FROM (VALUES ${values}) AS v(id, name, sku, category, brand, "unitsPerBulk", price, stock, images)
    `;
    console.log(`Creados ${Math.min(i + CHUNK, toCreate.length)}/${toCreate.length}`);
  }
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${it.sku}, ${it.name}::text, ${it.category}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric, ${it.stock}::int, ${it.imageUrl ? [it.imageUrl] : null}::text[])`),
      ',',
    );
    await prisma.$executeRaw`
      UPDATE "Product" AS p SET
        price = v.price,
        name = COALESCE(v.name, p.name),
        category = COALESCE(v.category, p.category),
        brand = COALESCE(v.brand, p.brand),
        "unitsPerBulk" = COALESCE(v.units, p."unitsPerBulk"),
        stock = COALESCE(v.stock, p.stock),
        images = CASE WHEN v.images IS NOT NULL AND cardinality(p.images) = 0 THEN v.images ELSE p.images END,
        "updatedAt" = now()
      FROM (VALUES ${values}) AS v(sku, name, category, brand, units, price, stock, images)
      WHERE p.sku = v.sku
    `;
    console.log(`Actualizados ${Math.min(i + CHUNK, toUpdate.length)}/${toUpdate.length}`);
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
