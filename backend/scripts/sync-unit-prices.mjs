// Habilita venta por unidad (y display, para Chocolates) en artículos que hoy solo se
// venden por bulto cerrado: Landy Oritas, Chocolates y Vinos — usa el precio real de costo
// por unidad/display que trae el maestro del proveedor (no se inventa dividiendo el precio
// de bulto). Solo actualiza artículos que YA existen en la base, no crea ni toca nada más
// (precio de bulto, stock, nombre, etc. quedan igual).
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL> node sync-unit-prices.mjs <maestro.xlsx> [--apply]
import { PrismaClient, Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2];
const apply = process.argv.includes('--apply');
if (!filePath) { console.error('Uso: node sync-unit-prices.mjs <maestro.xlsx> [--apply]'); process.exit(1); }

const prisma = new PrismaClient();
const parseNum = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isFinite(n) && n > 0 ? n : null;
};

// A qué grupo pertenece un artículo, a partir de nombre/categoría/línea del maestro.
function groupOf({ name, category, line }) {
  const n = name.toUpperCase();
  if (n.includes('LANDY ORITAS')) return 'landy';
  if (category === 'Chocolates') return 'chocolates';
  if (n.startsWith('VINO ') || line === 'VINOS') return 'vinos';
  return null;
}

async function main() {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const header = rows[0].map((c) => String(c).trim());
  const col = (name) => header.indexOf(name);
  const skuCol = col('Número de artículo'), nameCol = col('Descripción del artículo'),
    catCol = col('Nombre de grupo'), lineCol = col('Linea'), uomCol = col('Código de unidad de medida'),
    priceCol = col('PriceBruto'), qtyDisplayCol = col('QtyDisplay');

  // Una entrada por SKU con sus 3 precios (BULTO/UNIDAD/DISPLAY) juntos.
  const bySku = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[skuCol] ?? '').trim();
    if (!sku) continue;
    const name = String(row[nameCol] ?? '').trim();
    const category = String(row[catCol] ?? '').trim();
    const line = String(row[lineCol] ?? '').trim();
    const group = groupOf({ name, category, line });
    if (!group) continue;
    if (!bySku.has(sku)) bySku.set(sku, { sku, name, group, unitPrice: null, displayPrice: null, unitsPerDisplay: null });
    const entry = bySku.get(sku);
    const uom = String(row[uomCol]).trim();
    const price = parseNum(row[priceCol]);
    if (uom === 'UNIDAD' && price) entry.unitPrice = Math.round(price * 100) / 100;
    if (uom === 'DISPLAY' && price) {
      entry.displayPrice = Math.round(price * 100) / 100;
      entry.unitsPerDisplay = qtyDisplayCol !== -1 ? (Number(row[qtyDisplayCol]) || null) : null;
    }
  }

  // Solo importa lo que trae al menos un precio por unidad o display real.
  const items = [...bySku.values()].filter((it) => it.unitPrice || it.displayPrice);
  console.log(`Artículos de Landy/Chocolates/Vinos con precio por unidad o display en el archivo: ${items.length}`);
  for (const g of ['landy', 'chocolates', 'vinos']) {
    console.log(`  ${g}: ${items.filter((it) => it.group === g).length}`);
  }

  const skus = items.map((it) => it.sku);
  const existing = await prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true, name: true, unitPrice: true, displayPrice: true, unitsPerBulk: true, price: true } });
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));
  const toUpdate = items.filter((it) => existingBySku.has(it.sku));
  const notInCatalog = items.length - toUpdate.length;

  console.log(`  ya existen en el catálogo (se actualizan): ${toUpdate.length}`);
  console.log(`  no están en el catálogo (se ignoran, no se crean artículos nuevos acá): ${notInCatalog}`);
  console.log('\nMuestra (primeros 15):');
  for (const it of toUpdate.slice(0, 15)) {
    const cur = existingBySku.get(it.sku);
    console.log(`  [${it.group}] ${it.sku} ${cur.name}`);
    console.log(`    bulto (${cur.unitsPerBulk ?? '?'} u.): $${Number(cur.price)} · unidad: ${it.unitPrice ? '$' + it.unitPrice : '-'} · display: ${it.displayPrice ? `$${it.displayPrice} (${it.unitsPerDisplay ?? '?'} u.)` : '-'}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  const CHUNK = 500;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${it.sku}, ${it.unitPrice}::numeric, ${it.displayPrice}::numeric, ${it.unitsPerDisplay}::int)`),
      ',',
    );
    await prisma.$executeRaw`
      UPDATE "Product" AS p SET
        "unitPrice" = v."unitPrice",
        "displayPrice" = v."displayPrice",
        "unitsPerDisplay" = v."unitsPerDisplay",
        "updatedAt" = now()
      FROM (VALUES ${values}) AS v(sku, "unitPrice", "displayPrice", "unitsPerDisplay")
      WHERE p.sku = v.sku
    `;
    console.log(`Actualizados ${Math.min(i + CHUNK, toUpdate.length)}/${toUpdate.length}`);
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
