import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VynoSettingsService } from '../vyno-settings/vyno-settings.service';
import { CreateVynoOrderDto } from './dto/create-vyno-order.dto';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { SetVynoOrderStatusDto } from './dto/set-order-status.dto';

const ORDER_INCLUDE = {
  client: true,
  items: { include: { product: true } },
  paymentProof: true,
  approvedBy: { select: { id: true, fullName: true } },
} as const;

@Injectable()
export class VynoOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: VynoSettingsService,
  ) {}

  findAll(status?: string) {
    return this.prisma.vynoOrder.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.vynoOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  /** Vista pública de un pedido (confirmación/seguimiento) — el id (cuid, no
   * adivinable) funciona como token de acceso, mismo criterio que ya usa
   * GET /sales/:id/status para Dark Store. Sin datos sensibles del cliente más allá
   * de lo que el propio cliente ya cargó. */
  async findPublic(id: string) {
    const order = await this.findOne(id);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      shippingMethod: order.shippingMethod,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      createdAt: order.createdAt,
      items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity, unitPrice: i.unitPrice, subtotal: i.subtotal })),
      hasPaymentProof: !!order.paymentProof,
    };
  }

  /** Crea el pedido: resuelve/crea el Client por teléfono (mismo cliente único del
   * CRM), calcula todo server-side (nunca confía en un precio que mande el cliente) y
   * descuenta stock. Arranca en PAGO_PENDIENTE porque hoy el único medio es
   * transferencia — no hay un paso de "elegir método de pago" real todavía. */
  async create(dto: CreateVynoOrderDto) {
    if (!dto.items?.length) throw new BadRequestException('El carrito está vacío');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.vynoProduct.findMany({ where: { id: { in: productIds }, isActive: true } });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData: { productId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
    for (const it of dto.items) {
      const prod = byId.get(it.productId);
      if (!prod) throw new BadRequestException('Producto no encontrado');
      if (Number(prod.price) <= 0) throw new BadRequestException(`${prod.name} todavía no tiene precio cargado — probá más tarde`);
      if (prod.stock < it.quantity) throw new BadRequestException(`Sin stock suficiente de ${prod.name} (hay ${prod.stock})`);
      const unitPrice = Number(prod.price);
      const lineSubtotal = Math.round(unitPrice * it.quantity * 100) / 100;
      subtotal += lineSubtotal;
      itemsData.push({ productId: prod.id, quantity: it.quantity, unitPrice, subtotal: lineSubtotal });
    }

    const settings = await this.settings.get();
    const shippingCost = Number(settings.shippingFlatCost);
    const total = Math.round((subtotal + shippingCost) * 100) / 100;

    const client = (await this.prisma.client.findUnique({ where: { phone: dto.phone } }))
      ?? (await this.prisma.client.create({
        data: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, email: dto.email, source: 'MANUAL' },
      }));

    const count = await this.prisma.vynoOrder.count();
    const orderNumber = `VYNO-${String(count + 1).padStart(6, '0')}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vynoOrder.create({
        data: {
          orderNumber,
          clientId: client.id,
          status: 'PAGO_PENDIENTE',
          subtotal,
          shippingCost,
          total,
          province: dto.province,
          city: dto.city,
          postalCode: dto.postalCode,
          street: dto.street,
          streetNumber: dto.streetNumber,
          floorApt: dto.floorApt,
          shippingNotes: dto.shippingNotes,
          docNumber: dto.docNumber,
          items: { createMany: { data: itemsData } },
        },
        include: ORDER_INCLUDE,
      });
      for (const it of itemsData) {
        await tx.vynoProduct.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
      }
      return created;
    });

    return order;
  }

  /** El cliente informa que transfirió y sube el comprobante — nunca marca el pedido
   * como pagado por sí mismo, solo dispara COMPROBANTE_RECIBIDO. */
  async reportPayment(orderId: string, dto: ReportPaymentDto) {
    const order = await this.findOne(orderId);
    if (order.status === 'PAGO_VERIFICADO' || order.status === 'CANCELADO') {
      throw new BadRequestException('Este pedido ya no admite cargar un comprobante nuevo');
    }
    await this.prisma.vynoPaymentProof.upsert({
      where: { orderId },
      update: { ...dto, transferredAt: dto.transferredAt ? new Date(dto.transferredAt) : undefined },
      create: { orderId, ...dto, transferredAt: dto.transferredAt ? new Date(dto.transferredAt) : undefined },
    });
    return this.prisma.vynoOrder.update({
      where: { id: orderId },
      data: { status: 'COMPROBANTE_RECIBIDO' },
      include: ORDER_INCLUDE,
    });
  }

  /** Aprobar el pago es una acción exclusiva del admin — nunca se llama desde un
   * endpoint público, siempre atrás de JwtAuthGuard+RolesGuard en el controller. */
  async approvePayment(orderId: string, adminUserId: string) {
    const order = await this.findOne(orderId);
    if (order.status === 'PAGO_VERIFICADO') return order;
    if (order.status === 'CANCELADO') throw new ForbiddenException('Este pedido está cancelado');
    return this.prisma.vynoOrder.update({
      where: { id: orderId },
      data: { status: 'PAGO_VERIFICADO', approvedById: adminUserId, approvedAt: new Date() },
      include: ORDER_INCLUDE,
    });
  }

  async setStatus(orderId: string, dto: SetVynoOrderStatusDto) {
    await this.findOne(orderId);
    return this.prisma.vynoOrder.update({
      where: { id: orderId },
      data: { status: dto.status, trackingNumber: dto.trackingNumber, carrier: dto.carrier },
      include: ORDER_INCLUDE,
    });
  }
}
