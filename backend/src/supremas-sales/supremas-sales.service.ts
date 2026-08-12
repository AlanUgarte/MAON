import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupremasSettingsService } from '../supremas-settings/supremas-settings.service';
import { SupremasBatchesService } from '../supremas-batches/supremas-batches.service';
import { CreateSupremasSaleDto, SUPREMA_CLIENT_TYPES } from './dto/create-supremas-sale.dto';
import { CreateSupremasStorefrontSaleDto } from './dto/create-supremas-storefront-sale.dto';

@Injectable()
export class SupremasSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SupremasSettingsService,
    private readonly batches: SupremasBatchesService,
  ) {}

  findAll() {
    return this.prisma.supremaSale.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true, address: true, email: true } },
        seller: { select: { id: true, fullName: true } },
      },
    });
  }

  findByClient(clientId: string) {
    return this.prisma.supremaSale.findMany({ where: { clientId }, orderBy: { fecha: 'desc' } });
  }

  /** Precio por tramo de cliente — la única fuente de verdad es SupremaSettings, nunca
   * un número que mande el frontend (salvo que el rol tenga permiso de overridearlo). */
  private priceForType(clientType: string, settings: { priceConsumidorFinal: any; priceKiosco: any; priceMayorista: any }) {
    if (clientType === 'KIOSCO') return Number(settings.priceKiosco);
    if (clientType === 'MAYORISTA') return Number(settings.priceMayorista);
    return Number(settings.priceConsumidorFinal);
  }

  async create(dto: CreateSupremasSaleDto, sellerId: string, canOverridePrice: boolean) {
    if (!dto.clientId && !dto.newClient) throw new BadRequestException('Falta el cliente');

    const client = dto.clientId
      ? await this.prisma.client.findUnique({ where: { id: dto.clientId } })
      : (await this.prisma.client.findUnique({ where: { phone: dto.newClient!.phone } }))
        ?? (await this.prisma.client.create({
          data: {
            firstName: dto.newClient!.name.trim().split(' ')[0] || dto.newClient!.name.trim(),
            lastName: dto.newClient!.name.trim().split(' ').slice(1).join(' ') || null,
            phone: dto.newClient!.phone,
            address: dto.newClient!.address,
            email: dto.newClient!.email,
            source: 'MANUAL',
          },
        }));
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const settings = await this.settings.get();
    const pricePerKg = canOverridePrice && dto.pricePerKg != null ? dto.pricePerKg : this.priceForType(dto.clientType, settings);
    const costPerKg = await this.batches.currentCostPerKg();

    const { stockKg } = await this.batches.stock();
    if (settings.blockNegativeStock && dto.kg > stockKg) {
      throw new BadRequestException(`Sin stock suficiente (hay ${stockKg} kg)`);
    }

    return this.persistSale({
      clientId: client.id, sellerId, createdById: sellerId,
      clientType: dto.clientType, kg: dto.kg, pricePerKg, costPerKg,
      paymentMethod: dto.paymentMethod, observaciones: dto.observaciones,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
    });
  }

  /**
   * Pedido armado en la tienda online de Supremas (sin login): identifica al cliente por
   * teléfono, igual que sales.service.ts createFromStorefront. El tramo de cliente NUNCA
   * lo elige el visitante — se deriva del kg pedido contra mayoristaMinKg (misma regla que
   * ya usa el form interno para sugerir "Mayorista" a partir de cierto volumen), así nadie
   * puede pedir 2kg y tildarse "mayorista" para pagar menos.
   */
  async createFromStorefront(dto: CreateSupremasStorefrontSaleDto) {
    const settings = await this.settings.get();

    const { stockKg } = await this.batches.stock();
    if (settings.blockNegativeStock && dto.kg > stockKg) {
      throw new BadRequestException(`Sin stock suficiente (hay ${stockKg} kg disponibles)`);
    }

    const client = (await this.prisma.client.findUnique({ where: { phone: dto.customerPhone } }))
      ?? (await this.prisma.client.create({
        data: {
          firstName: dto.customerName.trim().split(' ')[0] || dto.customerName.trim(),
          lastName: dto.customerName.trim().split(' ').slice(1).join(' ') || null,
          phone: dto.customerPhone,
          address: dto.address,
          source: 'MANUAL',
        },
      }));

    const clientType = dto.kg >= settings.mayoristaMinKg ? 'MAYORISTA' : dto.kg >= settings.kioscoMinKg ? 'KIOSCO' : 'CONSUMIDOR_FINAL';
    const pricePerKg = this.priceForType(clientType, settings);
    const costPerKg = await this.batches.currentCostPerKg();

    const logistica = dto.wantsShipping ? `Envío a: ${dto.address ?? '-'}${dto.availableSchedule ? ` · Horario: ${dto.availableSchedule}` : ''}` : 'Retira en el local';
    const observaciones = [logistica, dto.observaciones?.trim()].filter(Boolean).join(' — ');

    const sale = await this.persistSale({
      clientId: client.id, sellerId: undefined, createdById: 'storefront',
      clientType, kg: dto.kg, pricePerKg, costPerKg,
      paymentMethod: dto.paymentMethod, observaciones,
    });
    return { ok: true, saleId: sale.id };
  }

  /** Único lugar que calcula total/costo/ganancia/margen y graba la venta — tanto el
   * form interno como la tienda online pasan por acá, así el cálculo nunca se desincroniza
   * entre los dos caminos. */
  private async persistSale(input: {
    clientId: string; sellerId?: string; createdById: string;
    clientType: (typeof SUPREMA_CLIENT_TYPES)[number]; kg: number; pricePerKg: number; costPerKg: number;
    paymentMethod: string; observaciones?: string; fecha?: Date;
  }) {
    const total = Math.round(input.kg * input.pricePerKg * 100) / 100;
    const cost = Math.round(input.kg * input.costPerKg * 100) / 100;
    const profit = Math.round((total - cost) * 100) / 100;
    const marginPct = total > 0 ? Math.round((profit / total) * 10000) / 100 : 0;

    return this.prisma.supremaSale.create({
      data: {
        clientId: input.clientId,
        sellerId: input.sellerId,
        clientType: input.clientType,
        kg: input.kg,
        pricePerKg: input.pricePerKg,
        costPerKg: input.costPerKg,
        total,
        cost,
        profit,
        marginPct,
        paymentMethod: input.paymentMethod as any,
        observaciones: input.observaciones,
        fecha: input.fecha,
        createdById: input.createdById,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
  }

  async remove(id: string) {
    const sale = await this.prisma.supremaSale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    await this.prisma.supremaSale.delete({ where: { id } });
    return { ok: true };
  }
}
