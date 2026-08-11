import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupremasIngredientsService } from '../supremas-ingredients/supremas-ingredients.service';
import { CreateSupremasBatchDto } from './dto/create-supremas-batch.dto';

@Injectable()
export class SupremasBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingredients: SupremasIngredientsService,
  ) {}

  findAll() {
    return this.prisma.supremaBatch.findMany({ orderBy: { fecha: 'desc' } });
  }

  async findOne(id: string) {
    const batch = await this.prisma.supremaBatch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('Lote no encontrado');
    return batch;
  }

  async create(dto: CreateSupremasBatchDto, createdById: string) {
    const costoPorKg = Math.round((dto.costoTotal / dto.kgProducidos) * 100) / 100;
    const count = await this.prisma.supremaBatch.count();
    return this.prisma.supremaBatch.create({
      data: {
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        lote: dto.lote?.trim() || `Lote #${String(count + 1).padStart(3, '0')}`,
        kgProducidos: dto.kgProducidos,
        costoTotal: dto.costoTotal,
        costoPorKg,
        observaciones: dto.observaciones,
        createdById,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supremaBatch.delete({ where: { id } });
    return { ok: true };
  }

  /** Stock derivado: producido - vendido. Sin tabla de movimientos — con este volumen
   * de negocio dos SUM alcanzan y sobran. Sin detalle de costos: lo puede pedir
   * cualquier rol autenticado (lo necesita el form de venta para avisar "sin stock"). */
  async stock() {
    const [producido, vendido] = await Promise.all([
      this.prisma.supremaBatch.aggregate({ _sum: { kgProducidos: true } }),
      this.prisma.supremaSale.aggregate({ _sum: { kg: true } }),
    ]);
    const producidoKg = Number(producido._sum.kgProducidos ?? 0);
    const vendidoKg = Number(vendido._sum.kg ?? 0);
    return { producidoKg, vendidoKg, stockKg: Math.round((producidoKg - vendidoKg) * 1000) / 1000 };
  }

  /** Costo/kg vigente para tasar una venta nueva: el del lote más reciente (representa
   * el costo real del stock disponible), o el costeo base en caliente si todavía no se
   * registró ningún lote. Nunca se recalcula retroactivamente sobre lotes viejos. */
  async currentCostPerKg(): Promise<number> {
    const last = await this.prisma.supremaBatch.findFirst({ orderBy: { fecha: 'desc' } });
    if (last) return Number(last.costoPorKg);
    const costeo = await this.ingredients.costeo();
    return costeo.costoPorKg;
  }
}
