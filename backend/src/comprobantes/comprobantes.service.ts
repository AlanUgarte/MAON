import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComprobanteDto, ComprobanteTipo, ComprobanteLetra } from './dto/create-comprobante.dto';

const PREFIX: Record<string, string> = {
  FACTURA: 'FC',
  REMITO: 'RE',
  NOTA_CREDITO: 'NC',
  NOTA_CREDITO_REMITO: 'NCR',
};
const PUNTO_VENTA = '0001';
const IVA_RATE = 0.21;
// Letra por defecto según tipo: facturas/N.C. son fiscales (A), remitos no son válidos como factura (R)
const DEFAULT_LETRA: Record<string, ComprobanteLetra> = {
  FACTURA: ComprobanteLetra.A,
  NOTA_CREDITO: ComprobanteLetra.A,
  REMITO: ComprobanteLetra.R,
  NOTA_CREDITO_REMITO: ComprobanteLetra.R,
};

@Injectable()
export class ComprobantesService {
  constructor(private readonly prisma: PrismaService) {}

  private isNotaCredito(tipo: ComprobanteTipo) {
    return tipo === ComprobanteTipo.NOTA_CREDITO || tipo === ComprobanteTipo.NOTA_CREDITO_REMITO;
  }

  /** Numeración correlativa por tipo: PREFIJO 0001-00000001 */
  private async nextNumero(tipo: ComprobanteTipo): Promise<string> {
    const count = await this.prisma.comprobante.count({ where: { tipo: tipo as any } });
    const n = String(count + 1).padStart(8, '0');
    return `${PREFIX[tipo]} ${PUNTO_VENTA}-${n}`;
  }

  async create(dto: CreateComprobanteDto) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const enBlanco = !!dto.enBlanco;
    if (enBlanco && !this.isNotaCredito(dto.tipo)) {
      throw new BadRequestException('El comprobante en blanco solo aplica a notas de crédito');
    }

    const letra = dto.letra ?? DEFAULT_LETRA[dto.tipo];
    const esFiscalA = letra === ComprobanteLetra.A && (dto.tipo === ComprobanteTipo.FACTURA || this.isNotaCredito(dto.tipo));
    if (esFiscalA && (!dto.cae || !dto.caeVto)) {
      throw new BadRequestException('Factura y nota de crédito letra A requieren CAE y fecha de vencimiento del CAE (comprobante que impactó en ARCA)');
    }

    let itemsData: { productId?: string; detalle: string; cantidad: number; unitPrice: number; subtotal: number; ivaRate: number }[] = [];
    let subtotal = 0;

    if (enBlanco) {
      const importe = Number(dto.importe || 0);
      if (importe <= 0) throw new BadRequestException('Indicá el importe de la nota de crédito');
      subtotal = importe;
      itemsData = [{
        detalle: dto.descripcion || 'Nota de crédito',
        cantidad: 1,
        unitPrice: importe,
        subtotal: importe,
        ivaRate: dto.discriminarIva ? IVA_RATE : 0,
      }];
    } else {
      if (!dto.items?.length) throw new BadRequestException('Agregá al menos un item');
      itemsData = dto.items.map((it) => {
        const sub = Number(it.unitPrice) * it.cantidad;
        subtotal += sub;
        return {
          productId: it.productId,
          detalle: it.detalle,
          cantidad: it.cantidad,
          unitPrice: Number(it.unitPrice),
          subtotal: sub,
          ivaRate: it.ivaRate ?? IVA_RATE,
        };
      });
    }

    // Agrupa por alícuota: un comprobante puede mezclar 21% y 10.5% (como en las facturas reales)
    const ivaByRate = new Map<number, number>();
    itemsData.forEach((it) => {
      if (it.ivaRate > 0) ivaByRate.set(it.ivaRate, (ivaByRate.get(it.ivaRate) ?? 0) + it.subtotal);
    });
    const iva = Math.round(
      Array.from(ivaByRate.entries()).reduce((acc, [rate, neto]) => acc + neto * rate, 0) * 100,
    ) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;
    const sign = this.isNotaCredito(dto.tipo) ? -1 : 1;

    // Dos comprobantes del mismo tipo creados casi al mismo tiempo pueden calcular el
    // mismo "próximo número" (nextNumero lee un count, no hay secuencia atómica). Si eso
    // pasa, la restricción @unique de numero tira P2002: se reintenta con el número siguiente.
    for (let attempt = 0; ; attempt++) {
      const numero = await this.nextNumero(dto.tipo);
      try {
        return await this.prisma.comprobante.create({
          data: {
            numero,
            tipo: dto.tipo as any,
            letra: letra as any,
            clientId: dto.clientId,
            sellerId: dto.sellerId,
            subtotal,
            iva,
            total,
            sign,
            enBlanco,
            descripcion: dto.descripcion,
            cae: dto.cae,
            caeVto: dto.caeVto ? new Date(dto.caeVto) : undefined,
            items: { create: itemsData },
          },
          include: { items: true, client: true },
        });
      } catch (err) {
        const isDuplicateNumero = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
        if (!isDuplicateNumero || attempt >= 4) throw err;
      }
    }
  }

  findAll(clientId?: string) {
    return this.prisma.comprobante.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { issuedAt: 'desc' },
      include: { items: true, client: true },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.comprobante.findUnique({
      where: { id },
      include: { items: true, client: true },
    });
    if (!c) throw new NotFoundException('Comprobante no encontrado');
    return c;
  }

  /** Libro contable: movimientos + saldo corriente (por cliente si se pasa clientId). */
  async libro(clientId?: string) {
    const comps = await this.prisma.comprobante.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { issuedAt: 'asc' },
      include: { client: true },
    });

    let saldo = 0;
    let totalFacturado = 0;
    let totalNotasCredito = 0;

    const movimientos = comps.map((c) => {
      const total = Number(c.total);
      const debe = c.sign > 0 ? total : 0;
      const haber = c.sign < 0 ? total : 0;
      saldo += debe - haber;
      totalFacturado += debe;
      totalNotasCredito += haber;
      return {
        id: c.id,
        fecha: c.issuedAt,
        numero: c.numero,
        tipo: c.tipo,
        cliente: `${c.client.firstName} ${c.client.lastName ?? ''}`.trim(),
        clientId: c.clientId,
        debe,
        haber,
        saldo,
      };
    });

    return {
      movimientos,
      resumen: { totalFacturado, totalNotasCredito, saldo: totalFacturado - totalNotasCredito },
    };
  }
}
