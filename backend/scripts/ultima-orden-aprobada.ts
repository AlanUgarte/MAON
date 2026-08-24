/**
 * Imprime el id de la última compra aprobada del sorteo — sirve para probar a mano el
 * comprobante en /api/sorteo/comprobante/<id>.
 *
 *   npx @railway/cli run --service Postgres-aeL0 -- bash -c \
 *     'DATABASE_URL="$DATABASE_PUBLIC_URL" npx ts-node scripts/ultima-orden-aprobada.ts'
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const order = await prisma.sorteoOrder.findFirst({
      where: { status: 'APROBADO' },
      orderBy: { createdAt: 'desc' },
      include: { numbers: { select: { number: true } } },
    });
    if (!order) return console.log('No hay compras aprobadas todavía.');
    console.log(`ORDER_ID=${order.id}`);
    console.log(`${order.orderNumber} — ${order.buyerName} — ${order.numbers.length} números`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
