// Habilita venta por unidad, zuncho y/o display además de por bulto cerrado, para TODO
// el catálogo — usa la columna real "Nombre de grupo de unidad de medida" del maestro del
// proveedor, formato "Bulto AxBxC":
//   A = displays por bulto.
//   B = unidades sueltas que trae cada display (0 = no se vende suelto, solo bulto/display).
//   C = tamaño del "zuncho" (paquete chico) en el que vienen empaquetadas esas B unidades
//       sueltas dentro del display. C=1 (o ausente) = las B unidades se venden una por una
//       ("Unidad"). C>1 = se venden en paquetitos de C unidades ("Zuncho"), no sueltas.
// Las filas "UNIDAD"/"ZUNCHO" del maestro solo se usan como señal de que el proveedor
// realmente ofrece esa modalidad (existe la fila con precio > 0) — el precio que se
// guarda NO es ese valor crudo, se recalcula por proporción pura a partir del precio de
// display (displayPrice / B, o ese mismo valor * C para el caso zuncho), porque el precio
// crudo del maestro ya trae incorporado el recargo del 8.5% que el proveedor aplica en su
// propia UI ("Reducido por %: -8,5") — y la tienda vuelve a aplicar ese mismo 8.5% en su
// propia capa de margen, así que usar el crudo lo duplicaría.
// Solo actualiza artículos que YA existen en la base — no crea ni toca nada más (precio de
// bulto, stock, nombre, etc. quedan igual).
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

async function main() {
  const buffer = readFileSync(filePath);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const header = rows[0].map((c) => String(c).trim());
  const col = (name) => header.indexOf(name);
  const skuCol = col('Número de artículo'), nameCol = col('Descripción del artículo'),
    groupCol = col('Nombre de grupo de unidad de medida'), uomCol = col('Código de unidad de medida'),
    priceCol = col('PriceBruto');
  if (skuCol === -1 || groupCol === -1 || uomCol === -1) throw new Error('Faltan columnas esperadas en el maestro');

  const bySku = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sku = String(row[skuCol] ?? '').trim();
    if (!sku) continue;
    const m = String(row[groupCol] ?? '').match(/(\d+)x(\d+)x(\d+)/i);
    if (!m) continue; // "Manual" u otro formato sin la grilla AxBxC: no tocar
    const [, aStr, bStr, cStr] = m;
    const displaysPerBulto = Number(aStr), unitsPerDisplay = Number(bStr), zunchoSize = Number(cStr);
    if (!bySku.has(sku)) {
      bySku.set(sku, {
        sku, name: String(row[nameCol] ?? '').trim(), displaysPerBulto, unitsPerDisplay, zunchoSize,
        hasUnidadRow: false, hasZunchoRow: false, displayPrice: null,
      });
    }
    const entry = bySku.get(sku);
    const uom = String(row[uomCol]).trim();
    const price = parseNum(row[priceCol]);
    if (uom === 'DISPLAY' && price && displaysPerBulto > 0) entry.displayPrice = Math.round(price * 100) / 100;
    // Las filas UNIDAD/ZUNCHO solo marcan ELEGIBILIDAD (el proveedor realmente vende así) —
    // el precio se recalcula abajo por proporción pura, no se usa el crudo de estas filas.
    if (uom === 'UNIDAD' && price && unitsPerDisplay > 0) entry.hasUnidadRow = true;
    if (uom === 'ZUNCHO' && price && unitsPerDisplay > 0) entry.hasZunchoRow = true;
  }

  for (const it of bySku.values()) {
    it.unitPrice = null;
    it.unitsPerZuncho = null;
    if (!it.displayPrice || !it.unitsPerDisplay) continue;
    const baseUnitCost = it.displayPrice / it.unitsPerDisplay;
    if (it.zunchoSize > 1 && it.hasZunchoRow) {
      it.unitPrice = Math.round(baseUnitCost * it.zunchoSize * 100) / 100;
      it.unitsPerZuncho = it.zunchoSize;
    } else if (it.zunchoSize <= 1 && it.hasUnidadRow) {
      it.unitPrice = Math.round(baseUnitCost * 100) / 100;
    }
  }

  const items = [...bySku.values()].filter((it) => it.unitPrice || it.displayPrice);
  console.log(`Artículos del maestro con venta por unidad/zuncho y/o display real: ${items.length}`);
  console.log(`  solo unidad: ${items.filter((it) => it.unitPrice && !it.unitsPerZuncho && !it.displayPrice).length}`);
  console.log(`  solo zuncho: ${items.filter((it) => it.unitPrice && it.unitsPerZuncho && !it.displayPrice).length}`);
  console.log(`  solo display: ${items.filter((it) => !it.unitPrice && it.displayPrice).length}`);
  console.log(`  unidad y display: ${items.filter((it) => it.unitPrice && !it.unitsPerZuncho && it.displayPrice).length}`);
  console.log(`  zuncho y display: ${items.filter((it) => it.unitPrice && it.unitsPerZuncho && it.displayPrice).length}`);

  const skus = items.map((it) => it.sku);
  const existing = [];
  const CHUNK_LOOKUP = 5000;
  for (let i = 0; i < skus.length; i += CHUNK_LOOKUP) {
    const chunk = skus.slice(i, i + CHUNK_LOOKUP);
    existing.push(...await prisma.product.findMany({ where: { sku: { in: chunk } }, select: { sku: true, name: true, price: true } }));
  }
  const existingBySku = new Map(existing.map((p) => [p.sku, p]));
  const toUpdate = items.filter((it) => existingBySku.has(it.sku));
  console.log(`  existen en el catálogo (se actualizan): ${toUpdate.length}`);
  console.log(`  no están en el catálogo (se ignoran): ${items.length - toUpdate.length}`);

  console.log('\nMuestra (primeras 15):');
  for (const it of toUpdate.slice(0, 15)) {
    const cur = existingBySku.get(it.sku);
    console.log(`  ${it.sku} ${cur.name}`);
    const unidadTxt = it.unitPrice ? (it.unitsPerZuncho ? `$${it.unitPrice} (zuncho x${it.unitsPerZuncho})` : `$${it.unitPrice}`) : '-';
    console.log(`    bulto: $${Number(cur.price)} · unidad/zuncho: ${unidadTxt} · display: ${it.displayPrice ? `$${it.displayPrice} (${it.unitsPerDisplay} u.)` : '-'}`);
  }

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  // Limpia lo que haya quedado de una corrida anterior (regla vieja sin zuncho, o precios
  // crudos sin la corrección proporcional), para no dejar datos viejos pisados.
  const resetCount = await prisma.$executeRaw`
    UPDATE "Product" SET "unitPrice" = NULL, "displayPrice" = NULL, "unitsPerDisplay" = NULL, "unitsPerZuncho" = NULL
    WHERE "unitPrice" IS NOT NULL OR "displayPrice" IS NOT NULL OR "unitsPerZuncho" IS NOT NULL
  `;
  console.log(`Reseteados ${resetCount} artículos de una corrida anterior antes de aplicar la regla nueva.`);

  const CHUNK = 500;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const values = Prisma.join(
      chunk.map((it) => Prisma.sql`(${it.sku}, ${it.unitPrice}::numeric, ${it.displayPrice}::numeric, ${it.displayPrice ? it.unitsPerDisplay : null}::int, ${it.unitsPerZuncho}::int)`),
      ',',
    );
    await prisma.$executeRaw`
      UPDATE "Product" AS p SET
        "unitPrice" = v."unitPrice",
        "displayPrice" = v."displayPrice",
        "unitsPerDisplay" = v."unitsPerDisplay",
        "unitsPerZuncho" = v."unitsPerZuncho",
        "updatedAt" = now()
      FROM (VALUES ${values}) AS v(sku, "unitPrice", "displayPrice", "unitsPerDisplay", "unitsPerZuncho")
      WHERE p.sku = v.sku
    `;
    console.log(`Actualizados ${Math.min(i + CHUNK, toUpdate.length)}/${toUpdate.length}`);
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
