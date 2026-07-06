import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, CreateStorefrontSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Control de stock opcional: si está apagado, no descuenta ni valida stock. */
  private get stockControl(): boolean {
    return this.config.get<string>('STOCK_CONTROL_ENABLED') === 'true';
  }

  /**
   * Registra una venta (pedido confirmado). Suma las cantidades por artículo
   * que luego ve el dashboard. Descuenta stock sólo si el control está activo.
   */
  async create(dto: CreateSaleDto) {
    if (!dto.items?.length) throw new BadRequestException('El pedido no tiene ítems');

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const items: Prisma.SaleItemCreateManySaleInput[] = [];
    let total = new Prisma.Decimal(0);

    for (const it of dto.items) {
      const prod = products.find((p) => p.id === it.productId);
      if (!prod) throw new BadRequestException(`Producto no encontrado: ${it.productId}`);
      if (this.stockControl && prod.stock < it.quantity) {
        throw new BadRequestException(`Sin stock suficiente de ${prod.name} (hay ${prod.stock})`);
      }
      items.push({ productId: prod.id, quantity: it.quantity, unitPrice: prod.price });
      total = total.add(prod.price.mul(it.quantity));
    }

    const sale = await this.prisma.sale.create({
      data: {
        clientId: dto.clientId,
        sellerId: dto.sellerId,
        total,
        status: 'PAGADA',
        items: { createMany: { data: items } },
      },
      include: { items: { include: { product: true } } },
    });

    // Descuento de stock (sólo si el control está activo)
    if (this.stockControl) {
      for (const it of dto.items) {
        await this.prisma.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }
    }

    // El cliente pasa a venta cerrada
    await this.prisma.client.update({
      where: { id: dto.clientId },
      data: { stage: 'VENTA_CERRADA' },
    });

    return sale;
  }

  /**
   * Pedido armado en la tienda pública (sin login): identifica productos por SKU
   * en vez de id, y busca/crea el cliente por teléfono en vez de recibir un clientId
   * (el caller no tiene sesión ni conoce ids reales del backend).
   */
  async createFromStorefront(dto: CreateStorefrontSaleDto) {
    if (!dto.items?.length) return { ok: false, reason: 'sin ítems' };

    const products = await this.prisma.product.findMany({
      where: { sku: { in: dto.items.map((i) => i.sku) } },
    });
    const bySku = new Map(products.map((p) => [p.sku, p]));

    const items: Prisma.SaleItemCreateManySaleInput[] = [];
    let total = new Prisma.Decimal(0);
    let skipped = 0;
    for (const it of dto.items) {
      const prod = bySku.get(it.sku);
      if (!prod) { skipped++; continue; }
      items.push({ productId: prod.id, quantity: it.quantity, unitPrice: prod.price });
      total = total.add(prod.price.mul(it.quantity));
    }
    if (!items.length) return { ok: false, reason: 'ningún SKU reconocido' };

    const client = (await this.prisma.client.findUnique({ where: { phone: dto.customerPhone } }))
      ?? (await this.prisma.client.create({
        data: {
          firstName: dto.customerName.trim().split(' ')[0] || dto.customerName.trim(),
          lastName: dto.customerName.trim().split(' ').slice(1).join(' ') || null,
          phone: dto.customerPhone,
          source: 'WHATSAPP',
        },
      }));

    const seller = dto.sellerName
      ? await this.prisma.user.findFirst({ where: { fullName: dto.sellerName } })
      : null;

    const sale = await this.prisma.sale.create({
      data: {
        clientId: client.id,
        sellerId: seller?.id,
        total,
        status: 'PENDIENTE',
        items: { createMany: { data: items } },
      },
    });

    return { ok: true, saleId: sale.id, matched: items.length, skipped };
  }

  findAll() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  /** Unidades vendidas por artículo (lo que ve el dashboard). */
  async unitsByProduct() {
    const grouped = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true },
    });
    return grouped
      .map((g) => ({
        product: products.find((p) => p.id === g.productId)?.name ?? 'N/D',
        units: g._sum.quantity ?? 0,
      }))
      .sort((a, b) => b.units - a.units);
  }
}
