import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageAuthor, MessageDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppSender } from '../whatsapp/whatsapp.sender';
import { AIService } from '../ai/ai.service';
import { isFreeWindowOpen } from '../common/free-window';

/**
 * AutomationsService
 * --------------------------------------------------------------
 * Motor de reglas configurables desde la interfaz. Cada regla tiene
 * un disparador (trigger) y una acción. El cron evalúa periódicamente
 * las reglas basadas en tiempo (sin respuesta X horas/días, etc.).
 */
@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: WhatsAppSender,
    private readonly ai: AIService,
    private readonly config: ConfigService,
  ) {}

  private get freeWindowOnly(): boolean {
    return this.config.get<string>('FREE_WINDOW_ONLY') !== 'false';
  }

  // ---------- CRUD ----------

  findAll() {
    return this.prisma.automation.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: any) {
    return this.prisma.automation.create({ data });
  }

  async update(id: string, data: any) {
    await this.ensure(id);
    return this.prisma.automation.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const a = await this.ensure(id);
    return this.prisma.automation.update({
      where: { id },
      data: { isActive: !a.isActive },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.automation.delete({ where: { id } });
  }

  private async ensure(id: string) {
    const a = await this.prisma.automation.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Automatización no encontrada');
    return a;
  }

  // ---------- MOTOR (CRON) ----------

  /** Corre cada hora y evalúa las reglas activas basadas en tiempo. */
  @Cron(CronExpression.EVERY_HOUR)
  async runEngine() {
    const rules = await this.prisma.automation.findMany({
      where: { isActive: true },
    });
    for (const rule of rules) {
      try {
        await this.executeRule(rule);
      } catch (err) {
        this.logger.error(`Regla ${rule.id} falló: ${err}`);
      }
    }
  }

  private async executeRule(rule: any) {
    const cfg = (rule.triggerConfig ?? {}) as any;
    let cutoff: Date | null = null;

    if (rule.trigger === 'SIN_RESPUESTA_HORAS') {
      cutoff = new Date(Date.now() - (cfg.hours ?? 48) * 3600_000);
    } else if (rule.trigger === 'SIN_RESPUESTA_DIAS') {
      cutoff = new Date(Date.now() - (cfg.days ?? 7) * 86_400_000);
    } else {
      return; // triggers por evento (compra, cambio de estado) se ejecutan inline
    }

    const targets = await this.prisma.client.findMany({
      where: {
        lastInboundAt: { lte: cutoff },
        stage: { notIn: ['VENTA_CERRADA', 'VENTA_PERDIDA'] },
      },
      include: {
        interestedProduct: true,
        conversations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      take: 200,
    });

    let executed = 0;
    for (const client of targets) {
      await this.applyAction(rule, client);
      executed++;
    }

    await this.prisma.automation.update({
      where: { id: rule.id },
      data: { lastRunAt: new Date(), runCount: { increment: executed } },
    });
    if (executed) {
      this.logger.log(`Regla "${rule.name}" ejecutada sobre ${executed} clientes`);
    }
  }

  private async applyAction(rule: any, client: any) {
    const cfg = (rule.actionConfig ?? {}) as any;

    // Blindaje de costos: si la acción envía un mensaje y la ventana gratis
    // está cerrada, NO se envía (sería una plantilla paga). En su lugar se
    // crea un seguimiento interno para que el equipo decida.
    const sendsMessage =
      rule.actionType === 'ENVIAR_MENSAJE' || rule.actionType === 'ENVIAR_PLANTILLA';
    const windowClosed = !isFreeWindowOpen(
      client.lastInboundAt,
      client.source === 'META_ADS',
    );
    if (sendsMessage && this.freeWindowOnly && windowClosed) {
      await this.prisma.followUp.create({
        data: {
          clientId: client.id,
          assignedToId: client.assignedSellerId,
          title: `Reactivar (fuera de ventana gratis) · ${rule.name}`,
          notes: 'La automatización no envió el mensaje para no generar costos de WhatsApp. Contactá al cliente cuando vuelva a escribir o usá una plantilla paga manualmente.',
          dueAt: new Date(),
        },
      });
      return;
    }

    switch (rule.actionType) {
      case 'CREAR_SEGUIMIENTO':
        await this.prisma.followUp.create({
          data: {
            clientId: client.id,
            assignedToId: client.assignedSellerId,
            title: cfg.title ?? 'Seguimiento automático',
            dueAt: new Date(),
          },
        });
        break;

      case 'CAMBIAR_ESTADO':
        await this.prisma.client.update({
          where: { id: client.id },
          data: { stage: cfg.stage },
        });
        break;

      case 'ENVIAR_MENSAJE': {
        // Mensaje fijo o generado por IA si se pide personalización
        let text = cfg.message as string;
        if (cfg.useAI) {
          text = await this.ai.generateFollowUp(
            {
              clientName: `${client.firstName} ${client.lastName ?? ''}`.trim(),
              interestedProduct: client.interestedProduct?.name,
              history: [],
            },
            cfg.daysSilent ?? 2,
          );
        }
        const conv = client.conversations[0];
        if (conv && text) {
          await this.prisma.message.create({
            data: {
              conversationId: conv.id,
              direction: MessageDirection.SALIENTE,
              author: MessageAuthor.AUTOMATIZACION,
              content: text,
            },
          });
          await this.sender.sendText(client.phone, text);
        }
        break;
      }

      case 'ENVIAR_PLANTILLA':
        if (cfg.templateName) {
          await this.sender.sendTemplate(client.phone, cfg.templateName);
        }
        break;
    }
  }
}
