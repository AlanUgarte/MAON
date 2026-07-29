import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, MessageDirection, MessageAuthor, AIMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isFreeWindowOpen, freeWindowRemainingHours } from '../common/free-window';
import { WhatsAppSender } from '../whatsapp/whatsapp.sender';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly sender: WhatsAppSender,
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
      include: { client: { select: { phone: true, source: true, lastInboundAt: true } } },
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

    // Envío real (o simulado si no hay token configurado, ver WhatsAppSender).
    const sent = await this.sender.sendText(conv.client.phone, content);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.SALIENTE,
        author,
        content,
        sellerId,
        waMessageId: sent.id,
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

    return message;
  }

  // ===========================================================
  //  MAON AI Sales · control IA/humano de la conversación
  // ===========================================================

  /** Un vendedor toma la conversación: la IA deja de responder de inmediato. */
  async takeOver(conversationId: string, userId: string) {
    await this.findOrThrow(conversationId);
    this.logger.log(`Conversación ${conversationId} tomada por vendedor ${userId}`);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: AIMode.HUMAN_ACTIVE, takenOverById: userId, aiPausedAt: null },
    });
  }

  /** Devuelve la conversación a la IA — la próxima respuesta la genera el asistente de nuevo. */
  async returnToAI(conversationId: string) {
    await this.findOrThrow(conversationId);
    this.logger.log(`Conversación ${conversationId} devuelta a la IA`);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: AIMode.AI_ACTIVE, takenOverById: null, aiPausedAt: null },
    });
  }

  /** Pausa la IA sin marcar que un humano la tomó (ej. el admin la frena a mano). */
  async pauseAI(conversationId: string) {
    await this.findOrThrow(conversationId);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: AIMode.AI_PAUSED, aiPausedAt: new Date() },
    });
  }

  /**
   * El cliente pidió hablar con una persona (detectado por la IA o pedido manual).
   * Pausa la IA de inmediato — nunca deben responder la IA y una persona a la vez.
   */
  async requestHuman(conversationId: string) {
    const conv = await this.findOrThrow(conversationId);
    if (conv.aiMode === AIMode.HUMAN_ACTIVE) return conv; // ya lo tiene un vendedor, no hay nada que cambiar
    this.logger.log(`Conversación ${conversationId} pidió atención humana`);
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: AIMode.HUMAN_REQUESTED, aiPausedAt: new Date() },
    });
  }

  private async findOrThrow(conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Conversación no encontrada');
    return conv;
  }

  async assignSeller(clientId: string, sellerId: string) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: { assignedSellerId: sellerId },
    });
  }
}
