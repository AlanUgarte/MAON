import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppSender } from '../whatsapp/whatsapp.sender';
import { pickFreeNumbers } from './pick-numbers';
import {
  CreateSorteoOrderDto, CreateSorteoWinnerDto, ReplaceSorteoPackagesDto, UpdateSorteoSettingsDto,
} from './dto/sorteo.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SorteoService {
  private readonly logger = new Logger(SorteoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppSender,
  ) {}

  /** Fila única de config: se crea con los defaults del schema la primera vez. */
  settings() {
    return this.prisma.sorteoSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  updateSettings(dto: UpdateSorteoSettingsDto) {
    return this.prisma.sorteoSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
  }

  /** Cierra el sorteo actual y arranca el siguiente: los números vuelven a estar
   * todos libres sin borrar el historial, porque se guardan por edición. */
  async nextEdition() {
    const s = await this.settings();
    return this.prisma.sorteoSettings.update({
      where: { id: SINGLETON_ID },
      data: { edition: s.edition + 1, blessedNumbers: [], images: [] },
    });
  }

  /** Todo lo que necesita la landing pública, sin login y sin datos de compradores. */
  async publicView() {
    const s = await this.settings();
    const [packages, sold, blessedSold, winners] = await Promise.all([
      this.prisma.sorteoPackage.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } }),
      this.prisma.sorteoNumber.count({ where: { edition: s.edition } }),
      this.prisma.sorteoNumber.findMany({
        where: { edition: s.edition, number: { in: s.blessedNumbers } },
        select: { number: true },
      }),
      this.prisma.sorteoWinner.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    ]);
    const soldBlessed = new Set(blessedSold.map((n) => n.number));
    return {
      brandName: s.brandName,
      title: s.title,
      prize: s.prize,
      images: s.images,
      videoUrl: s.videoUrl,
      email: s.email,
      instagramUrl: s.instagramUrl,
      facebookUrl: s.facebookUrl,
      tiktokUrl: s.tiktokUrl,
      drawDate: s.drawDate,
      drawWhere: s.drawWhere,
      blessedPrize: s.blessedPrize,
      blessedNumbers: s.blessedNumbers.map((n) => ({ number: n, sold: soldBlessed.has(n) })),
      paymentAlias: s.paymentAlias,
      paymentHolder: s.paymentHolder,
      whatsappNumber: s.whatsappNumber,
      isActive: s.isActive,
      totalNumbers: s.totalNumbers,
      sold,
      percentSold: s.totalNumbers ? Math.round((sold / s.totalNumbers) * 1000) / 10 : 0,
      packages: packages.map((p) => ({
        id: p.id, chances: p.chances, price: Number(p.price), isPopular: p.isPopular,
      })),
      winners,
    };
  }

  // ---------------------------- paquetes ----------------------------

  packages() {
    return this.prisma.sorteoPackage.findMany({ orderBy: { price: 'asc' } });
  }

  /** Reemplaza la lista completa. Los paquetes viejos se desactivan en vez de
   * borrarse porque las órdenes ya vendidas los referencian. */
  async replacePackages(dto: ReplaceSorteoPackagesDto) {
    await this.prisma.$transaction([
      this.prisma.sorteoPackage.updateMany({ data: { isActive: false } }),
      this.prisma.sorteoPackage.createMany({
        data: dto.packages.map((p) => ({
          chances: p.chances, price: p.price, isPopular: !!p.isPopular, isActive: true,
        })),
      }),
    ]);
    return this.packages();
  }

  // ---------------------------- órdenes ----------------------------

  /** Compra pública. Arranca en PENDIENTE y SIN números: los números se asignan
   * recién cuando el admin verifica la transferencia. */
  async createOrder(dto: CreateSorteoOrderDto) {
    const s = await this.settings();
    if (!s.isActive) throw new BadRequestException('El sorteo está cerrado por el momento');
    if (!dto.buyerEmail && !dto.buyerPhone) {
      throw new BadRequestException('Dejanos un email o un WhatsApp para poder avisarte');
    }

    // Sin comprobante ni titular no hay forma de cruzar la transferencia con la compra,
    // así que se pide al menos uno. Es un chequeo de datos completos, no de seguridad:
    // el filtro real sigue siendo que un admin aprueba a mano cada compra.
    if (!dto.holderName?.trim() && !dto.hasReceipt) {
      throw new BadRequestException(
        'Adjuntá el comprobante o escribí el nombre de quien hizo la transferencia',
      );
    }

    const pkg = await this.prisma.sorteoPackage.findFirst({ where: { id: dto.packageId, isActive: true } });
    if (!pkg) throw new BadRequestException('El paquete elegido ya no está disponible');

    const sold = await this.prisma.sorteoNumber.count({ where: { edition: s.edition } });
    const reserved = await this.prisma.sorteoOrder.aggregate({
      where: { edition: s.edition, status: 'PENDIENTE' },
      _sum: { chances: true },
    });
    if (sold + (reserved._sum.chances ?? 0) + pkg.chances > s.totalNumbers) {
      throw new BadRequestException('No quedan chances suficientes disponibles');
    }

    const count = await this.prisma.sorteoOrder.count();
    return this.prisma.sorteoOrder.create({
      data: {
        orderNumber: `SOR-${String(count + 1).padStart(6, '0')}`,
        edition: s.edition,
        buyerName: dto.buyerName.trim(),
        buyerEmail: (dto.buyerEmail ?? '').trim().toLowerCase(),
        buyerPhone: (dto.buyerPhone ?? '').replace(/\D/g, ''),
        packageId: pkg.id,
        chances: pkg.chances,
        amount: pkg.price,
        receiptUrl: dto.receiptUrl,
        holderName: dto.holderName,
      },
    });
  }

  /** El comprador adjunta el comprobante después de crear la compra. Solo mientras
   * sigue PENDIENTE: una vez aprobada, el comprobante ya fue verificado y no se toca. */
  async attachReceipt(id: string, dto: { receiptUrl?: string; holderName?: string }) {
    const order = await this.prisma.sorteoOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Compra no encontrada');
    if (order.status !== 'PENDIENTE') {
      throw new BadRequestException('Esta compra ya fue verificada, no admite un comprobante nuevo');
    }
    await this.prisma.sorteoOrder.update({
      where: { id },
      data: { receiptUrl: dto.receiptUrl, holderName: dto.holderName },
    });
    return { ok: true };
  }

  findOrders(status?: string, q?: string) {
    const search = (q ?? '').trim();
    return this.prisma.sorteoOrder.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { buyerName: { contains: search, mode: 'insensitive' as const } },
                { buyerEmail: { contains: search, mode: 'insensitive' as const } },
                { buyerPhone: { contains: search.replace(/\D/g, '') || search } },
                { orderNumber: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        numbers: { select: { number: true }, orderBy: { number: 'asc' } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  /** Vista pública de una compra — el id (cuid, no adivinable) hace de token. */
  async orderPublic(id: string) {
    const order = await this.prisma.sorteoOrder.findUnique({
      where: { id },
      include: { numbers: { select: { number: true }, orderBy: { number: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Compra no encontrada');
    const s = await this.settings();
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      buyerName: order.buyerName,
      chances: order.chances,
      amount: Number(order.amount),
      createdAt: order.createdAt,
      numbers: order.numbers.map((n) => n.number),
      prize: s.prize,
    };
  }

  /** Consulta pública "¿cuáles son mis números?" — solo devuelve compras que
   * coincidan exactamente con el email o el teléfono, nunca una búsqueda parcial
   * que permita listar compradores ajenos. */
  async lookup(rawQuery: string) {
    const q = (rawQuery ?? '').trim().toLowerCase();
    if (q.length < 5) return [];
    const digits = q.replace(/\D/g, '');
    const orders = await this.prisma.sorteoOrder.findMany({
      where: {
        OR: [
          { buyerEmail: q },
          ...(digits.length >= 6 ? [{ buyerPhone: digits }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { numbers: { select: { number: true }, orderBy: { number: 'asc' } } },
    });
    const s = await this.settings();
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      buyerName: o.buyerName,
      chances: o.chances,
      amount: Number(o.amount),
      createdAt: o.createdAt,
      numbers: o.numbers.map((n) => n.number),
      prize: s.prize,
    }));
  }

  /**
   * Aprobar = verificar la transferencia a mano y recién ahí asignar los números.
   * Acción exclusiva de admin: nunca se llama desde un endpoint público.
   * La PK (edition, number) es la que garantiza que no se venda dos veces el mismo
   * número — si dos aprobaciones simultáneas eligen el mismo, la transacción falla
   * y se reintenta, en vez de confiar en un chequeo previo en memoria.
   */
  async approveOrder(id: string, adminUserId: string) {
    const order = await this.prisma.sorteoOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Compra no encontrada');
    if (order.status === 'APROBADO') return this.orderWithNumbers(id);
    if (order.status === 'RECHAZADO') throw new ForbiddenException('Esta compra está rechazada');

    const s = await this.settings();

    for (let attempt = 0; attempt < 3; attempt++) {
      const taken = await this.prisma.sorteoNumber.findMany({
        where: { edition: order.edition },
        select: { number: true },
      });
      const used = new Set(taken.map((n) => n.number));
      if (s.totalNumbers - used.size < order.chances) {
        throw new BadRequestException('No quedan números libres suficientes para esta compra');
      }

      const assigned = pickFreeNumbers(s.totalNumbers, used, order.chances);

      try {
        await this.prisma.$transaction([
          this.prisma.sorteoNumber.createMany({
            data: assigned.map((number) => ({ edition: order.edition, number, orderId: order.id })),
          }),
          this.prisma.sorteoOrder.update({
            where: { id: order.id },
            data: { status: 'APROBADO', approvedById: adminUserId, approvedAt: new Date() },
          }),
        ]);
        const approved = await this.orderWithNumbers(id);
        this.notifyApproved(order.id, order.buyerPhone, order.buyerName, assigned, s.prize);
        return approved;
      } catch (err: any) {
        // P2002 = otro admin aprobó una compra al mismo tiempo y se quedó con alguno
        // de estos números. Se reintenta con la foto actualizada de los ocupados.
        if (err?.code !== 'P2002' || attempt === 2) throw err;
      }
    }
    throw new BadRequestException('No se pudieron asignar los números, probá de nuevo');
  }

  /**
   * Avisa al comprador con el comprobante de sus numeros. La imagen la genera la web
   * en /api/sorteo/comprobante/<id> a partir de la orden, asi que WhatsApp la baja
   * sola y no hay que guardar ningun archivo.
   *
   * A proposito no se hace await ni se corta la aprobacion si falla: los numeros ya
   * quedaron asignados y el admin los ve en el panel; que WhatsApp no responda no
   * puede deshacer una aprobacion.
   */
  private notifyApproved(orderId: string, phone: string, name: string, numbers: number[], prize: string) {
    if (!phone) return;
    const web = process.env.PUBLIC_WEB_URL || process.env.CORS_ORIGIN;
    if (!web) {
      this.logger.warn('PUBLIC_WEB_URL sin configurar: no se manda el comprobante del sorteo');
      return;
    }
    const caption =
      `Hola ${name}! Confirmamos tu pago 🍀

` +
      `Ya estas participando por la ${prize}.
` +
      `Tus numeros: ${numbers.join(' - ')}

` +
      'Mucha suerte y siempre con fe!';

    this.whatsapp
      .sendImage(phone, `${web.replace(/\/$/, '')}/api/sorteo/comprobante/${orderId}`, caption)
      .catch((err) => this.logger.error(`No se pudo avisar la aprobacion de ${orderId}: ${err?.message}`));
  }

  async rejectOrder(id: string) {
    const order = await this.prisma.sorteoOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Compra no encontrada');
    if (order.status === 'APROBADO') {
      throw new ForbiddenException('Esta compra ya tiene números asignados, no se puede rechazar');
    }
    return this.prisma.sorteoOrder.update({ where: { id }, data: { status: 'RECHAZADO' } });
  }

  private orderWithNumbers(id: string) {
    return this.prisma.sorteoOrder.findUnique({
      where: { id },
      include: {
        numbers: { select: { number: true }, orderBy: { number: 'asc' } },
        approvedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  /** El día del sorteo: número que salió en la quiniela -> quién lo compró. */
  async whoOwns(number: number) {
    const s = await this.settings();
    const row = await this.prisma.sorteoNumber.findUnique({
      where: { edition_number: { edition: s.edition, number } },
      include: {
        order: {
          include: {
            numbers: { select: { number: true }, orderBy: { number: 'asc' } },
            approvedBy: { select: { fullName: true } },
          },
        },
      },
    });
    if (!row) {
      return { found: false, number, sold: number >= 1 && number <= s.totalNumbers ? false : null };
    }
    return {
      found: true,
      number,
      isBlessed: s.blessedNumbers.includes(number),
      order: { ...row.order, amount: Number(row.order.amount), numbers: row.order.numbers.map((n) => n.number) },
    };
  }

  // ---------------------------- ganadores ----------------------------

  winners() {
    return this.prisma.sorteoWinner.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createWinner(dto: CreateSorteoWinnerDto) {
    return this.prisma.sorteoWinner.create({ data: dto });
  }

  async deleteWinner(id: string) {
    await this.prisma.sorteoWinner.delete({ where: { id } });
    return { ok: true };
  }
}
