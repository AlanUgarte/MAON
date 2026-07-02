import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Construye el filtro Prisma a partir de los query params.
   *  Se reutiliza para listar clientes y para segmentar campañas. */
  buildWhere(q: QueryClientsDto): Prisma.ClientWhereInput {
    const where: Prisma.ClientWhereInput = {};
    if (q.stage) where.stage = q.stage;
    if (q.city) where.city = { equals: q.city, mode: 'insensitive' };
    if (q.province) where.province = { equals: q.province, mode: 'insensitive' };
    if (q.productId) where.interestedProductId = q.productId;
    if (q.sellerId) where.assignedSellerId = q.sellerId;
    if (q.tag) where.tags = { some: { tag: { name: q.tag } } };
    if (q.search) {
      where.OR = [
        { firstName: { contains: q.search, mode: 'insensitive' } },
        { lastName: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    if (q.silentDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - q.silentDays);
      where.OR = [
        ...(where.OR ?? []),
      ];
      where.lastInboundAt = { lte: cutoff };
    }
    return where;
  }

  async findAll(q: QueryClientsDto) {
    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 25, 100);
    const where = this.buildWhere(q);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        include: {
          interestedProduct: { select: { id: true, name: true } },
          assignedSeller: { select: { id: true, fullName: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page, pageSize, pages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        interestedProduct: true,
        assignedSeller: { select: { id: true, fullName: true } },
        metaCampaign: true,
        tags: { include: { tag: true } },
        notes: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { dueAt: 'asc' } },
        sales: { include: { items: { include: { product: true } } } },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 5 },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async updateStage(id: string, stage: any) {
    await this.ensureExists(id);
    return this.prisma.client.update({ where: { id }, data: { stage } });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.client.delete({ where: { id } });
  }

  /** Pipeline agrupado por etapa (vista Kanban). */
  async pipeline() {
    const grouped = await this.prisma.client.groupBy({
      by: ['stage'],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ stage: g.stage, count: g._count._all }));
  }

  async addNote(id: string, content: string, authorId?: string) {
    await this.ensureExists(id);
    return this.prisma.note.create({ data: { clientId: id, content, authorId } });
  }

  async setTags(id: string, tagIds: string[]) {
    await this.ensureExists(id);
    await this.prisma.clientTag.deleteMany({ where: { clientId: id } });
    if (tagIds.length) {
      await this.prisma.clientTag.createMany({
        data: tagIds.map((tagId) => ({ clientId: id, tagId })),
        skipDuplicates: true,
      });
    }
    return this.findOne(id);
  }

  private async ensureExists(id: string) {
    const c = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }
}
