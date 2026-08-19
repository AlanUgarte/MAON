import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumosProductDto } from './dto/create-insumos-product.dto';
import { UpdateInsumosProductDto } from './dto/update-insumos-product.dto';

@Injectable()
export class InsumosProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pública: solo activos, para el storefront.
  findPublic() {
    return this.prisma.insumosProduct.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.insumosProduct.findFirst({ where: { slug, isActive: true } });
  }

  // Admin: todo, incluye inactivos.
  findAll() {
    return this.prisma.insumosProduct.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const p = await this.prisma.insumosProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  create(dto: CreateInsumosProductDto) {
    return this.prisma.insumosProduct.create({ data: dto });
  }

  async update(id: string, dto: UpdateInsumosProductDto) {
    await this.findOne(id);
    return this.prisma.insumosProduct.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.insumosProduct.delete({ where: { id } });
    return { ok: true };
  }
}
