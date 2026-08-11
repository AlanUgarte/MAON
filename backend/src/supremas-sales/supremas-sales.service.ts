import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupremasSettingsService } from '../supremas-settings/supremas-settings.service';
import { SupremasBatchesService } from '../supremas-batches/supremas-batches.service';
import { CreateSupremasSaleDto } from './dto/create-supremas-sale.dto';

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

    const total = Math.round(dto.kg * pricePerKg * 100) / 100;
    const cost = Math.round(dto.kg * costPerKg * 100) / 100;
    const profit = Math.round((total - cost) * 100) / 100;
    const marginPct = total > 0 ? Math.round((profit / total) * 10000) / 100 : 0;

    return this.prisma.supremaSale.create({
      data: {
        clientId: client.id,
        sellerId,
        clientType: dto.clientType,
        kg: dto.kg,
        pricePerKg,
        costPerKg,
        total,
        cost,
        profit,
        marginPct,
        paymentMethod: dto.paymentMethod,
        observaciones: dto.observaciones,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        createdById: sellerId,
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
