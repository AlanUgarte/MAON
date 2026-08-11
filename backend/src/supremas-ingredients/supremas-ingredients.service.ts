import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupremasSettingsService } from '../supremas-settings/supremas-settings.service';
import { CreateSupremasIngredientDto } from './dto/create-supremas-ingredient.dto';
import { UpdateSupremasIngredientDto } from './dto/update-supremas-ingredient.dto';

@Injectable()
export class SupremasIngredientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SupremasSettingsService,
  ) {}

  findAll() {
    return this.prisma.supremaIngredient.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const ing = await this.prisma.supremaIngredient.findUnique({ where: { id } });
    if (!ing) throw new NotFoundException('Ingrediente no encontrado');
    return ing;
  }

  create(dto: CreateSupremasIngredientDto) {
    return this.prisma.supremaIngredient.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupremasIngredientDto) {
    await this.findOne(id);
    return this.prisma.supremaIngredient.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.supremaIngredient.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Costeo del lote base: nunca se guarda un costo/kg fijo — siempre se deriva en
   * caliente de los ingredientes + el rendimiento/envase configurados, así que cambiar
   * cualquiera de los dos actualiza esta cuenta al instante (punto 33 del pedido).
   */
  async costeo() {
    const [ingredients, settings] = await Promise.all([this.findAll(), this.settings.get()]);
    const ingredientesCost = ingredients.reduce((acc, i) => acc + Number(i.purchasePrice) / Number(i.purchaseQty) * Number(i.usedQty), 0);
    const produccionKg = Number(settings.produccionBaseKg);
    const envaseCost = Number(settings.envaseCostPerKg) * produccionKg;
    const costoTotal = ingredientesCost + envaseCost;
    const costoPorKg = produccionKg > 0 ? costoTotal / produccionKg : 0;
    return {
      ingredientes: ingredients.map((i) => ({
        id: i.id, name: i.name,
        costoUtilizado: Math.round((Number(i.purchasePrice) / Number(i.purchaseQty) * Number(i.usedQty)) * 100) / 100,
      })),
      ingredientesCost: Math.round(ingredientesCost * 100) / 100,
      envaseCost: Math.round(envaseCost * 100) / 100,
      costoTotal: Math.round(costoTotal * 100) / 100,
      produccionKg,
      costoPorKg: Math.round(costoPorKg * 100) / 100,
    };
  }
}
