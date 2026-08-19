import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVynoProductDto } from './dto/create-vyno-product.dto';
import { UpdateVynoProductDto } from './dto/update-vyno-product.dto';

@Injectable()
export class VynoProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pública: solo activos, para el storefront.
  findPublic() {
    return this.prisma.vynoProduct.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  }

  findPublicBySlug(slug: string) {
    return this.prisma.vynoProduct.findFirst({ where: { slug, isActive: true } });
  }

  // Admin: todo, incluye inactivos.
  findAll() {
    return this.prisma.vynoProduct.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const p = await this.prisma.vynoProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  create(dto: CreateVynoProductDto) {
    return this.prisma.vynoProduct.create({ data: dto });
  }

  async update(id: string, dto: UpdateVynoProductDto) {
    await this.findOne(id);
    return this.prisma.vynoProduct.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.vynoProduct.delete({ where: { id } });
    return { ok: true };
  }
}
