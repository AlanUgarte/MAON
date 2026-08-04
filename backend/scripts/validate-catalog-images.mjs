// Valida cuáles de las URLs de imagen del catálogo son fotos reales y cuáles son en
// realidad la página "no encontrada" que devuelve tyna.com.ar con status 200 (por eso
// el ordenamiento "con imagen primero" las trataba como si tuvieran foto real).
// Lee y escribe directo la DB — Tienda/Cotillón la leen en vivo por /api/catalog, ya no
// hay un JSON estático que regenerar.
// Uso: DATABASE_URL=<DATABASE_PUBLIC_URL> node validate-catalog-images.mjs [--apply]
//   sin --apply: solo cuenta y muestra una muestra de rotas.
//   con --apply: limpia el campo images de los productos cuya URL no es una imagen real.
import { PrismaClient } from '@prisma/client';

const apply = process.argv.includes('--apply');
const CONCURRENCY = 40;

async function checkImage(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const ct = res.headers.get('content-type') || '';
    // drena el body para no dejar la conexión colgada, pero no hace falta leerlo entero
    await res.body?.cancel?.().catch(() => {});
    return ct.startsWith('image/');
  } catch {
    return false; // error de red / timeout: se trata como rota
  }
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

async function main() {
  const prisma = new PrismaClient();
  const products = await prisma.product.findMany({
    where: { isActive: true, images: { isEmpty: false } },
    select: { sku: true, name: true, images: true },
  });
  const withImg = products.map((p) => ({ sku: p.sku, name: p.name, img: p.images[0] }));
  console.log(`Artículos con URL de imagen: ${withImg.length}`);

  const okFlags = await pool(withImg, (p) => checkImage(p.img), CONCURRENCY);
  const broken = withImg.filter((_, i) => !okFlags[i]);
  const ok = withImg.filter((_, i) => okFlags[i]);
  console.log(`  reales (content-type image/*): ${ok.length}`);
  console.log(`  rotas (devuelven HTML u otra cosa, no son foto real): ${broken.length}`);
  console.log('\nMuestra de rotas (primeras 15):');
  for (const p of broken.slice(0, 15)) console.log(`  ${p.sku} ${p.name} -> ${p.img}`);

  if (!apply) {
    console.log('\nDRY RUN — no se escribió nada. Correr de nuevo con --apply para aplicar.');
    await prisma.$disconnect();
    return;
  }

  const skus = broken.map((p) => p.sku);
  const CHUNK = 500;
  let cleared = 0;
  for (let i = 0; i < skus.length; i += CHUNK) {
    const chunk = skus.slice(i, i + CHUNK);
    const r = await prisma.$executeRaw`UPDATE "Product" SET images = ARRAY[]::text[] WHERE sku = ANY(${chunk})`;
    cleared += r;
  }
  console.log(`DB actualizada: ${cleared} productos con images limpiado.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
