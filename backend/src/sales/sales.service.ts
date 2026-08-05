import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageAuthor, MessageDirection, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppSender } from '../whatsapp/whatsapp.sender';
import { getTransferInstructions } from '../ai/business-config';
import { ComprobantesService } from '../comprobantes/comprobantes.service';
import { ComprobanteTipo, ComprobanteLetra } from '../comprobantes/dto/create-comprobante.dto';
import { DarkStoreVapesService } from '../dark-store-vapes/dark-store-vapes.service';
import { CreateSaleDto, CreateStorefrontSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly sender: WhatsAppSender,
    private readonly comprobantes: ComprobantesService,
    private readonly vapes: DarkStoreVapesService,
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
    if (!dto.items?.length && !dto.vapeItems?.length) return { ok: false, reason: 'sin ítems' };

    // Un mismo SKU puede venir repetido en varias líneas (carrito real o abuso):
    // se suman las cantidades en vez de crear un SaleItem por línea.
    const qtyBySku = new Map<string, number>();
    for (const it of dto.items ?? []) qtyBySku.set(it.sku, (qtyBySku.get(it.sku) ?? 0) + it.quantity);

    const products = qtyBySku.size
      ? await this.prisma.product.findMany({ where: { sku: { in: [...qtyBySku.keys()] } } })
      : [];
    const bySku = new Map(products.map((p) => [p.sku, p]));

    const items: Prisma.SaleItemCreateManySaleInput[] = [];
    const confirmationItems: { name: string; quantity: number; unitPrice: number }[] = [];
    let total = new Prisma.Decimal(0);
    let skipped = 0;
    for (const [sku, quantity] of qtyBySku) {
      const prod = bySku.get(sku);
      if (!prod) { skipped++; continue; }
      if (dto.enforceStock && prod.stock < quantity) {
        throw new BadRequestException(`Sin stock suficiente de ${prod.name} (hay ${prod.stock})`);
      }
      items.push({ productId: prod.id, quantity, unitPrice: prod.price });
      confirmationItems.push({ name: prod.name, quantity, unitPrice: Number(prod.price) });
      total = total.add(prod.price.mul(quantity));
    }

    // Vapeadores (Dark Store): no son Product, se resuelven aparte y quedan como snapshot
    // Json en Sale.vapeItems — no hay SaleItem porque esa tabla exige un productId real.
    const qtyByVapeId = new Map<string, number>();
    for (const it of dto.vapeItems ?? []) qtyByVapeId.set(it.vapeId, (qtyByVapeId.get(it.vapeId) ?? 0) + it.quantity);
    const vapeSnapshot: { vapeId: string; name: string; quantity: number; unitPrice: number }[] = [];
    if (qtyByVapeId.size) {
      const vapes = await this.prisma.darkStoreVape.findMany({ where: { id: { in: [...qtyByVapeId.keys()] }, isActive: true } });
      const byId = new Map(vapes.map((v) => [v.id, v]));
      for (const [vapeId, quantity] of qtyByVapeId) {
        const vape = byId.get(vapeId);
        if (!vape) { skipped++; continue; }
        if (dto.enforceStock && vape.stock < quantity) {
          throw new BadRequestException(`Sin stock suficiente de ${vape.name} (hay ${vape.stock})`);
        }
        vapeSnapshot.push({ vapeId: vape.id, name: vape.name, quantity, unitPrice: Number(vape.price) });
        confirmationItems.push({ name: vape.name, quantity, unitPrice: Number(vape.price) });
        total = total.add(vape.price.mul(quantity));
      }
    }

    if (!items.length && !vapeSnapshot.length) return { ok: false, reason: 'ningún artículo reconocido' };

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
        wantsShipping: dto.wantsShipping ?? false,
        shippingAddress: dto.wantsShipping ? dto.shippingAddress : undefined,
        availableSchedule: dto.wantsShipping ? dto.availableSchedule : undefined,
        envioGratis: dto.envioGratis ?? false,
        barrio: dto.barrio,
        vapeItems: vapeSnapshot,
      },
    });

    // Pago por transferencia: pendiente hasta que un vendedor lo confirme a mano
    // (no hay forma de verificar una transferencia bancaria por API) — mismo
    // circuito que ya usa el carrito del vendedor IA.
    await this.prisma.payment.create({
      data: { saleId: sale.id, provider: 'transferencia', status: 'PENDIENTE', amount: total },
    });

    let comprobanteNumero: string | undefined;
    if (dto.issueTicket) {
      // Dark Store no tiene pago online: en vez del texto de instrucciones de
      // transferencia, se emite un remito (ticket, no válido como factura) y se manda
      // por WhatsApp — ComprobantesService ya hace el PDF + el envío solo.
      try {
        const comprobante = await this.comprobantes.create({
          tipo: ComprobanteTipo.REMITO,
          letra: ComprobanteLetra.R,
          clientId: client.id,
          discriminarIva: false,
          items: [
            ...items.map((it, i) => ({
              productId: it.productId,
              detalle: confirmationItems[i]?.name ?? '',
              cantidad: it.quantity ?? 1,
              unitPrice: Number(it.unitPrice),
              ivaRate: 0,
            })),
            ...vapeSnapshot.map((v) => ({
              detalle: v.name,
              cantidad: v.quantity,
              unitPrice: v.unitPrice,
              ivaRate: 0,
            })),
          ],
        });
        comprobanteNumero = comprobante.numero;
        await this.prisma.sale.update({ where: { id: sale.id }, data: { invoiced: true, comprobanteNumero } });
      } catch (err) {
        this.logger.error(`No se pudo emitir el ticket de Dark Store para la venta ${sale.id}: ${err}`);
      }
    } else {
      await this.sendOrderConfirmation(client.id, client.phone, confirmationItems, Number(total));
    }

    // Descuento de stock: solo cuando el caller pidió enforceStock (hoy, únicamente
    // Dark Store) — los demás storefronts nunca lo activan, se comportan igual que antes.
    if (dto.enforceStock) {
      for (const [sku, quantity] of qtyBySku) {
        const prod = bySku.get(sku);
        if (prod) await this.prisma.product.update({ where: { id: prod.id }, data: { stock: { decrement: quantity } } });
      }
      for (const v of vapeSnapshot) {
        await this.prisma.darkStoreVape.update({ where: { id: v.vapeId }, data: { stock: { decrement: v.quantity } } });
      }
    }

    return { ok: true, saleId: sale.id, comprobanteNumero, matched: items.length + vapeSnapshot.length, skipped };
  }

  /** Confirma el pedido al cliente por WhatsApp: resumen + datos de transferencia. */
  private async sendOrderConfirmation(
    clientId: string,
    phone: string,
    items: { name: string; quantity: number; unitPrice: number }[],
    total: number,
  ) {
    try {
      let conversation = await this.prisma.conversation.findFirst({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      });
      if (!conversation) conversation = await this.prisma.conversation.create({ data: { clientId } });

      const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
      const lineas = items.map((it) => `${it.quantity}x ${it.name} — ${money(it.unitPrice * it.quantity)}`).join('\n');
      const t = getTransferInstructions();
      const text = `¡Pedido confirmado con éxito! ✅\n\n${lineas}\n\n*Total: ${money(total)}*\n\nPara registrar tu pago, transferí a:\nAlias: ${t.alias}\nCBU: ${t.cbu}\n${t.bank} · ${t.holder}\n\nCuando transfieras, mandanos el comprobante por acá y te confirmamos el pedido. ¡Gracias por tu compra! 🙌`;

      await this.prisma.message.create({
        data: { conversationId: conversation.id, direction: MessageDirection.SALIENTE, author: MessageAuthor.AUTOMATIZACION, content: text },
      });
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), lastMessagePreview: text.slice(0, 120) },
      });
      await this.sender.sendText(phone, text);
    } catch (err) {
      this.logger.error(`No se pudo mandar la confirmación de pedido: ${err}`);
    }
  }

  findAll() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true, phone: true } },
        seller: { select: { fullName: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });
  }

  /** Marca un pedido como facturado, asociándolo al comprobante ya emitido en /comprobantes. */
  async markInvoiced(id: string, comprobanteNumero: string) {
    return this.prisma.sale.update({
      where: { id },
      data: { invoiced: true, comprobanteNumero },
    });
  }

  /**
   * Confirma a mano que la transferencia llegó — no hay integración bancaria real,
   * así que esto lo hace un vendedor/admin después de chequear la cuenta de verdad.
   * Nunca se confirma solo porque el cliente diga que pagó o mande un comprobante.
   */
  async confirmPayment(saleId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { saleId } });
    if (!payment) throw new BadRequestException('Este pedido no tiene un pago asociado');
    await this.prisma.payment.update({ where: { saleId }, data: { status: 'APROBADO' } });
    return this.prisma.sale.update({ where: { id: saleId }, data: { status: 'PAGADA' } });
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
