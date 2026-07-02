import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, MessageDirection, MessageAuthor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isFreeWindowOpen, freeWindowRemainingHours } from '../common/free-window';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get freeWindowOnly(): boolean {
    return this.config.get<string>('FREE_WINDOW_ONLY') !== 'false';
  }

  /** Lista de conversaciones para la bandeja (con datos del cliente). */
  async list(params: { search?: string; status?: string; stage?: string }) {
    const where: Prisma.ConversationWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.stage) where.client = { stage: params.stage as any };
    if (params.search) {
      where.client = {
        ...(where.client as object),
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search } },
        ],
      };
    }

    return this.prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        client: {
          select: {
            id: true, firstName: true, lastName: true, phone: true, avatarUrl: true,
            stage: true, leadScore: true, buyingIntent: true, interestedProduct: { select: { name: true } },
            tags: { include: { tag: true } },
          },
        },
      },
    });
  }

  /** Mensajes de una conversación + marca como leídos. */
  async messages(conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        client: { include: { interestedProduct: true, tags: { include: { tag: true } } } },
      },
    });
    if (!conv) throw new NotFoundException('Conversación no encontrada');

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    const fromAd = conv.client.source === 'META_ADS';
    return {
      ...conv,
      freeWindowOpen: isFreeWindowOpen(conv.client.lastInboundAt, fromAd),
      freeWindowRemainingHours: freeWindowRemainingHours(conv.client.lastInboundAt, fromAd),
    };
  }

  /** Registra un mensaje saliente enviado por un vendedor (o automatización). */
  async sendMessage(
    conversationId: string,
    content: string,
    author: MessageAuthor = MessageAuthor.VENDEDOR,
    sellerId?: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: { select: { source: true, lastInboundAt: true } } },
    });
    if (!conv) throw new NotFoundException('Conversación no encontrada');

    // Blindaje de costos: no enviar fuera de la ventana gratis de WhatsApp.
    const fromAd = conv.client.source === 'META_ADS';
    if (this.freeWindowOnly && !isFreeWindowOpen(conv.client.lastInboundAt, fromAd)) {
      throw new BadRequestException(
        'La ventana gratis de WhatsApp está cerrada (el cliente no escribe hace más de 24/72 h). ' +
        'No se envió el mensaje para no generar costos. Creá un seguimiento o esperá a que el cliente vuelva a escribir.',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.SALIENTE,
        author,
        content,
        sellerId,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        lastMessagePreview: content.slice(0, 120),
      },
    });
    await this.prisma.client.update({
      where: { id: conv.clientId },
      data: { lastContactAt: message.createdAt },
    });

    // NOTE: aquí se invocaría WhatsAppSender.sendText(...) para el envío real.
    return message;
  }

  async assignSeller(clientId: string, sellerId: string) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: { assignedSellerId: sellerId },
    });
  }
}
