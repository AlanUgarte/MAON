import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getTransferInstructions } from '../ai/business-config';

/**
 * CartsService
 * --------------------------------------------------------------
 * Carrito 1 a 1 con una Conversation — lo arma la IA (herramienta
 * create_or_update_cart, ver ai/ai-tools.ts) o un vendedor a mano desde la
 * Bandeja, a medida que el cliente va confirmando productos por WhatsApp.
 * `confirm()` lo convierte en una Sale real (mismo modelo que ya usan las
 * tiendas públicas), en estado PENDIENTE — el pago es un paso aparte.
 */
@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get stockControl(): boolean {
    return this.config.get<string>('STOCK_CONTROL_ENABLED') === 'true';
  }

  private include() {
    return {
      items: { include: { product: true } },
      sale: { include: { payment: true } },
    } satisfies Prisma.CartInclude;
  }

  private withTotals<T extends { items: { quantity: number; unitPrice: Prisma.Decimal }[] }>(cart: T) {
    const subtotal = cart.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);
    return { ...cart, subtotal };
  }

  private async getOrCreate(conversationId: string) {
    const existing = await this.prisma.cart.findUnique({
      where: { conversationId },
      include: this.include(),
    });
    if (existing) return existing;

    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversación no encontrada');

    return this.prisma.cart.create({
      data: { conversationId },
      include: this.include(),
    });
  }

  async get(conversationId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { conversationId },
      include: this.include(),
    });
    if (!cart) return null;
    return this.withTotals(cart);
  }

  /** Agrega un producto (o suma cantidad si ya estaba). Precio: el actual del catálogo, tomado en este momento. */
  async addItem(conversationId: string, productId: string, quantity: number) {
    const cart = await this.getOrCreate(conversationId);
    if (cart.status !== CartStatus.ABIERTO) {
      throw new BadRequestException('Este carrito ya no está abierto (fue confirmado o abandonado)');
    }
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const existingItem = cart.items.find((it) => it.productId === productId);
    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity, unitPrice: product.price },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity, unitPrice: product.price },
      });
    }
    await this.prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
    return this.get(conversationId);
  }

  async setItemQuantity(conversationId: string, productId: string, quantity: number) {
    const cart = await this.get(conversationId);
    if (!cart) throw new NotFoundException('Este carrito no existe todavía');
    const item = cart.items.find((it) => it.productId === productId);
    if (!item) throw new NotFoundException('Ese producto no está en el carrito');
    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return this.get(conversationId);
  }

  async removeItem(conversationId: string, productId: string) {
    const cart = await this.get(conversationId);
    if (!cart) throw new NotFoundException('Este carrito no existe todavía');
    const item = cart.items.find((it) => it.productId === productId);
    if (item) await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.get(conversationId);
  }

  async setShipping(conversationId: string, wantsShipping: boolean, shippingAddress?: string) {
    const cart = await this.getOrCreate(conversationId);
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { wantsShipping, shippingAddress: wantsShipping ? shippingAddress : null },
    });
    return this.get(conversationId);
  }

  /** Confirma el carrito: crea la Sale real (PENDIENTE, todavía sin pago) y cierra el carrito. */
  async confirm(conversationId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { conversationId },
      include: { ...this.include(), conversation: { include: { client: true } } },
    });
    if (!cart) throw new NotFoundException('Este carrito no existe todavía');
    if (cart.status !== CartStatus.ABIERTO) throw new BadRequestException('Este carrito ya fue confirmado');
    if (!cart.items.length) throw new BadRequestException('El carrito está vacío');

    if (this.stockControl) {
      for (const it of cart.items) {
        if (it.product.stock < it.quantity) {
          throw new BadRequestException(`Sin stock suficiente de ${it.product.name} (hay ${it.product.stock})`);
        }
      }
    }

    const total = cart.items.reduce((acc, it) => acc + Number(it.unitPrice) * it.quantity, 0);

    const sale = await this.prisma.sale.create({
      data: {
        clientId: cart.conversation.clientId,
        total,
        status: 'PENDIENTE',
        wantsShipping: cart.wantsShipping ?? false,
        shippingAddress: cart.wantsShipping ? (cart.shippingAddress ?? undefined) : undefined,
        items: {
          createMany: {
            data: cart.items.map((it) => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice })),
          },
        },
      },
      include: { items: { include: { product: true } } },
    });

    if (this.stockControl) {
      for (const it of cart.items) {
        await this.prisma.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.quantity } } });
      }
    }

    // Pago por transferencia: no hay forma de verificarlo automático (no hay API del
    // banco), así que arranca PENDIENTE y lo confirma un vendedor a mano después de
    // chequear la cuenta real (ver PaymentsController#confirm).
    await this.prisma.payment.create({
      data: { saleId: sale.id, provider: 'transferencia', status: 'PENDIENTE', amount: total },
    });

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { status: CartStatus.CONFIRMADO, saleId: sale.id },
    });
    this.logger.log(`Carrito de la conversación ${conversationId} confirmado como venta ${sale.id}`);

    return { ...sale, transfer: getTransferInstructions() };
  }
}
