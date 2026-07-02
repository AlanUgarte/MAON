import { Injectable, Logger } from '@nestjs/common';
import {
  MessageDirection,
  MessageAuthor,
  MessageType,
  LeadSource,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { WhatsAppSender } from './whatsapp.sender';

/**
 * WhatsAppService
 * --------------------------------------------------------------
 * Procesa los webhooks entrantes de WhatsApp Business Cloud API.
 * Por cada mensaje entrante:
 *   1. Crea el lead automáticamente si no existe (por teléfono).
 *   2. Crea/recupera la conversación.
 *   3. Guarda el mensaje (fecha, hora, dirección, contenido).
 *   4. Pasa por la capa híbrida de IA (FAQ vs Claude).
 *   5. Si es FAQ, puede responder automáticamente.
 *   6. Dispara el análisis comercial (score, intención, etc.).
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AIService,
    private readonly sender: WhatsAppSender,
    private readonly config: ConfigService,
  ) {}

  /**
   * Procesa el payload completo del webhook de Meta.
   * Estructura: entry[].changes[].value.{messages, contacts}
   */
  async handleWebhook(body: any): Promise<void> {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};
        const contacts = value.contacts ?? [];
        for (const msg of value.messages ?? []) {
          await this.ingestMessage(msg, contacts);
        }
        // Estados de entrega/lectura (para métricas de campañas)
        for (const status of value.statuses ?? []) {
          await this.handleStatus(status);
        }
      }
    }
  }

  private async ingestMessage(msg: any, contacts: any[]): Promise<void> {
    const waId: string = msg.from; // número del cliente
    const phone = this.toE164(waId);
    const profileName =
      contacts.find((c) => c.wa_id === waId)?.profile?.name || 'Cliente WhatsApp';

    const { content, type, mediaUrl } = this.parseContent(msg);

    // 1) Lead automático
    let client = await this.prisma.client.findUnique({ where: { phone } });
    const isNew = !client;
    if (!client) {
      const [firstName, ...rest] = profileName.split(' ');
      client = await this.prisma.client.create({
        data: {
          firstName: firstName || 'Cliente',
          lastName: rest.join(' ') || null,
          phone,
          source: LeadSource.WHATSAPP,
        },
      });
      this.logger.log(`Nuevo lead creado desde WhatsApp: ${phone}`);
    }

    // 2) Conversación
    let conversation = await this.prisma.conversation.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { clientId: client.id, waContactId: waId },
      });
    }

    // 3) Mensaje
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: MessageDirection.ENTRANTE,
        author: MessageAuthor.CLIENTE,
        type,
        content,
        mediaUrl,
        waMessageId: msg.id,
      },
    });

    const now = new Date();
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now,
        lastMessagePreview: content.slice(0, 120),
        unreadCount: { increment: 1 },
      },
    });
    await this.prisma.client.update({
      where: { id: client.id },
      data: { lastInboundAt: now },
    });

    // 4) Capa híbrida de IA (clasifica el mensaje)
    const decision = this.ai.triageInbound(content);

    // 5) Respuesta automática: DESACTIVADA por defecto.
    //    El cliente respondés vos (desde el CRM o desde tu WhatsApp).
    //    Para habilitar auto-respuestas de FAQ, poné AUTO_REPLY_ENABLED=true.
    const autoReplyEnabled =
      this.config.get<string>('AUTO_REPLY_ENABLED') === 'true';
    if (autoReplyEnabled && decision.autoReply && !decision.needsAI) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: MessageDirection.SALIENTE,
          author: MessageAuthor.AUTOMATIZACION,
          content: decision.autoReply,
        },
      });
      await this.sender.sendText(waId, decision.autoReply);
    }

    // 6) Análisis comercial con Claude (SIEMPRE en mensajes entrantes):
    //    score, intención, sentimiento, objeción, resumen y sugerencias
    //    para el vendedor. Esto NO envía nada al cliente.
    if (this.config.get<string>('AI_ANALYSIS_ENABLED') !== 'false') {
      await this.runAnalysis(client.id);
    }
  }

  /** Reanaliza un cliente y persiste score/intención/etc. */
  private async runAnalysis(clientId: string): Promise<void> {
    try {
      const client = await this.prisma.client.findUniqueOrThrow({
        where: { id: clientId },
        include: {
          interestedProduct: true,
          conversations: {
            orderBy: { lastMessageAt: 'desc' },
            take: 1,
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 30 } },
          },
        },
      });
      const catalog = await this.prisma.product.findMany({
        where: { isActive: true },
        take: 12,
        select: { name: true, price: true, stock: true },
      });

      const result = await this.ai.analyzeConversation({
        clientName: `${client.firstName} ${client.lastName ?? ''}`.trim(),
        interestedProduct: client.interestedProduct?.name,
        stage: client.stage,
        history:
          client.conversations[0]?.messages.map((m) => ({
            direction: m.direction as 'ENTRANTE' | 'SALIENTE',
            content: m.content,
          })) ?? [],
        catalog: catalog.map((p) => ({
          name: p.name,
          price: p.price.toString(),
          stock: p.stock,
        })),
      });

      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          leadScore: result.leadScore,
          buyingIntent: result.buyingIntent as any,
          sentiment: result.sentiment as any,
          lastObjection: result.objection as any,
          aiSummary: result.summary,
        },
      });
      await this.prisma.aIAnalysis.create({
        data: {
          clientId,
          buyingIntent: result.buyingIntent as any,
          leadScore: result.leadScore,
          sentiment: result.sentiment as any,
          objection: result.objection as any,
          nextAction: result.nextAction,
          summary: result.summary,
          suggestions: result.suggestions,
          usedAI: result.usedAI,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        },
      });
    } catch (err) {
      this.logger.error(`runAnalysis falló para ${clientId}: ${err}`);
    }
  }

  /** Actualiza estados de campaña (delivered/read) a partir del webhook. */
  private async handleStatus(status: any): Promise<void> {
    const waMessageId = status.id;
    const recipientStatus =
      status.status === 'delivered'
        ? 'ENTREGADO'
        : status.status === 'read'
          ? 'LEIDO'
          : status.status === 'failed'
            ? 'FALLIDO'
            : null;
    if (!recipientStatus) return;
    // En un flujo real se mapea waMessageId -> CampaignRecipient.
    this.logger.debug(`Estado WA ${waMessageId}: ${recipientStatus}`);
  }

  // ---- helpers ----

  private parseContent(msg: any): {
    content: string;
    type: MessageType;
    mediaUrl?: string;
  } {
    switch (msg.type) {
      case 'text':
        return { content: msg.text?.body ?? '', type: MessageType.TEXTO };
      case 'image':
        return { content: msg.image?.caption ?? '[imagen]', type: MessageType.IMAGEN, mediaUrl: msg.image?.id };
      case 'audio':
        return { content: '[audio]', type: MessageType.AUDIO, mediaUrl: msg.audio?.id };
      case 'document':
        return { content: msg.document?.filename ?? '[documento]', type: MessageType.DOCUMENTO, mediaUrl: msg.document?.id };
      case 'location':
        return { content: `[ubicación] ${msg.location?.latitude},${msg.location?.longitude}`, type: MessageType.UBICACION };
      default:
        return { content: '[mensaje no soportado]', type: MessageType.SISTEMA };
    }
  }

  private toE164(waId: string): string {
    return waId.startsWith('+') ? waId : `+${waId}`;
  }
}
