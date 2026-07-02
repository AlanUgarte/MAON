import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignRecipientStatus, MessageAuthor, MessageDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from '../clients/clients.service';
import { WhatsAppSender } from '../whatsapp/whatsapp.sender';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { isFreeWindowOpen } from '../common/free-window';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly sender: WhatsAppSender,
  ) {}

  /** ¿Está la conversación dentro de la ventana gratis? (24/72 h) */
  private inWindow(c: { lastInboundAt: Date | null; source: string }): boolean {
    return isFreeWindowOpen(c.lastInboundAt, c.source === 'META_ADS');
  }

  /**
   * Cuenta destinatarios. En modo ACTIVE_WINDOW (gratis) solo cuenta los que
   * están dentro de la ventana; en TEMPLATE cuenta todo el segmento.
   */
  async previewSegment(filters: any, mode: 'ACTIVE_WINDOW' | 'TEMPLATE' = 'ACTIVE_WINDOW') {
    const where = this.clients.buildWhere(filters ?? {});
    const targets = await this.prisma.client.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, phone: true, stage: true, lastInboundAt: true, source: true },
    });
    const eligible = mode === 'ACTIVE_WINDOW' ? targets.filter((t) => this.inWindow(t)) : targets;
    return {
      mode,
      cost: mode === 'ACTIVE_WINDOW' ? 'GRATIS' : 'PLANTILLA_PAGA',
      count: eligible.length,
      totalSegment: targets.length,
      sample: eligible.slice(0, 5),
    };
  }

  async create(dto: CreateCampaignDto, createdById?: string) {
    const mode = dto.mode ?? 'ACTIVE_WINDOW';
    const where = this.clients.buildWhere(dto.filters ?? {});
    const all = await this.prisma.client.findMany({
      where,
      select: { id: true, lastInboundAt: true, source: true },
    });
    const targets = mode === 'ACTIVE_WINDOW' ? all.filter((t) => this.inWindow(t)) : all;

    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        message: dto.message,
        mode,
        imageUrl: dto.imageUrl,
        templateName: dto.templateName,
        filters: dto.filters ?? {},
        createdById,
        totalRecipients: targets.length,
        recipients: { create: targets.map((t) => ({ clientId: t.id })) },
      },
    });
  }

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { fullName: true } } },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: { recipients: { include: { client: { select: { firstName: true, lastName: true, phone: true } } } } },
    });
    if (!c) throw new NotFoundException('Campaña no encontrada');
    return c;
  }

  /** Personaliza el mensaje con datos del cliente ({nombre}). */
  private personalize(message: string, firstName: string): string {
    return message.replace(/\{nombre\}/gi, firstName);
  }

  /**
   * Envía la campaña.
   *  - ACTIVE_WINDOW: mensaje libre + imagen, GRATIS, solo a quienes siguen
   *    dentro de la ventana al momento del envío.
   *  - TEMPLATE: plantilla aprobada (con costo).
   */
  async send(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { recipients: { include: { client: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');

    await this.prisma.campaign.update({ where: { id }, data: { status: 'ENVIANDO' } });

    let sent = 0, failed = 0, skipped = 0;

    for (const r of campaign.recipients) {
      const client = r.client;
      try {
        if (campaign.mode === 'ACTIVE_WINDOW') {
          // Gratis: solo si sigue dentro de la ventana. Si no, se saltea (no se paga).
          if (!this.inWindow(client)) {
            skipped++;
            await this.prisma.campaignRecipient.update({
              where: { id: r.id },
              data: { status: CampaignRecipientStatus.FALLIDO, error: 'Fuera de ventana gratis' },
            });
            continue;
          }
          const text = this.personalize(campaign.message, client.firstName);
          if (campaign.imageUrl) {
            await this.sender.sendImage(client.phone, campaign.imageUrl, text);
          } else {
            await this.sender.sendText(client.phone, text);
          }
        } else {
          // Plantilla paga
          await this.sender.sendTemplate(client.phone, campaign.templateName || 'default');
        }

        // Registrar en la conversación
        const conv = await this.prisma.conversation.findFirst({
          where: { clientId: client.id },
          orderBy: { createdAt: 'desc' },
        });
        if (conv) {
          await this.prisma.message.create({
            data: {
              conversationId: conv.id,
              direction: MessageDirection.SALIENTE,
              author: MessageAuthor.AUTOMATIZACION,
              content: this.personalize(campaign.message, client.firstName),
              mediaUrl: campaign.imageUrl ?? undefined,
            },
          });
        }

        await this.prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { status: CampaignRecipientStatus.ENVIADO, sentAt: new Date() },
        });
        sent++;
      } catch {
        failed++;
        await this.prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { status: CampaignRecipientStatus.FALLIDO, error: 'Error de envío' },
        });
      }
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'COMPLETADA',
        sentAt: new Date(),
        sentCount: sent,
        deliveredCount: sent,
        failedCount: failed + skipped,
      },
    });
  }
}
