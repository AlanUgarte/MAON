import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDarkStoreVapeDto } from './dto/create-dark-store-vape.dto';
import { UpdateDarkStoreVapeDto } from './dto/update-dark-store-vape.dto';

@Injectable()
export class DarkStoreVapesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo público: solo activos, para /dark-store. */
  findPublic() {
    return this.prisma.darkStoreVape.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  /** Panel admin: todo, incluidos inactivos. */
  findAll() {
    return this.prisma.darkStoreVape.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const vape = await this.prisma.darkStoreVape.findUnique({ where: { id } });
    if (!vape) throw new NotFoundException('Vapeador no encontrado');
    return vape;
  }

  create(dto: CreateDarkStoreVapeDto) {
    return this.prisma.darkStoreVape.create({ data: dto });
  }

  async update(id: string, dto: UpdateDarkStoreVapeDto) {
    await this.findOne(id);
    return this.prisma.darkStoreVape.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.darkStoreVape.delete({ where: { id } });
    return { ok: true };
  }
}
