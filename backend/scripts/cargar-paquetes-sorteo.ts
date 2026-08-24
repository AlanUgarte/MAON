/**
 * Carga los paquetes de chances del sorteo y deja el sorteo apuntando a la Quiniela
 * Nacional Nocturna. Es idempotente: desactiva los paquetes viejos y crea los de esta
 * lista, igual que el botón "Guardar paquetes" del panel.
 *
 * Correr con las variables del servicio de Railway:
 *   npx @railway/cli run --service backend -- npx ts-node scripts/cargar-paquetes-sorteo.ts
 */
import { PrismaClient } from '@prisma/client';

const PAQUETES = [
  { chances: 3, price: 5000, isPopular: false },
  { chances: 8, price: 10000, isPopular: true },
  { chances: 18, price: 20000, isPopular: false },
  { chances: 38, price: 40000, isPopular: false },
  { chances: 50, price: 50000, isPopular: false },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction([
      prisma.sorteoPackage.updateMany({ data: { isActive: false } }),
      prisma.sorteoPackage.createMany({ data: PAQUETES.map((p) => ({ ...p, isActive: true })) }),
    ]);
    await prisma.sorteoSettings.update({
      where: { id: 'singleton' },
      data: { drawWhere: 'QUINIELA NACIONAL NOCTURNA' },
    });

    const activos = await prisma.sorteoPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    console.log('Paquetes activos:');
    activos.forEach((p) => console.log(`  ${p.chances} chances — $${p.price}${p.isPopular ? '  (más popular)' : ''}`));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
