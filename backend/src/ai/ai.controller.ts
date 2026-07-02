import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationContext } from './prompts';

@ApiTags('IA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(
    private readonly ai: AIService,
    private readonly prisma: PrismaService,
  ) {}

  /** Reanaliza un cliente puntual y persiste el resultado. */
  @Post('clients/:id/analyze')
  async analyzeClient(@Param('id') id: string) {
    const ctx = await this.buildContext(id);
    const result = await this.ai.analyzeConversation(ctx);

    await this.prisma.client.update({
      where: { id },
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
        clientId: id,
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

    return result;
  }

  /** Devuelve 3 respuestas sugeridas para el vendedor. */
  @Post('clients/:id/suggest')
  async suggest(@Param('id') id: string) {
    const ctx = await this.buildContext(id);
    const result = await this.ai.analyzeConversation(ctx);
    return { suggestions: result.suggestions, nextAction: result.nextAction };
  }

  /** Genera una respuesta lista para enviar (opcionalmente con instrucción). */
  @Post('clients/:id/reply')
  async reply(
    @Param('id') id: string,
    @Body('instruction') instruction?: string,
  ) {
    const ctx = await this.buildContext(id);
    const text = await this.ai.generateReply(ctx, instruction);
    return { text };
  }

  /** Diagnóstico del negocio: qué mejorar (analiza leads y conversaciones). */
  @Get('insights')
  async insights() {
    const [total, byStageRaw, lost, withoutFollowUp, objectionsRaw, scoreAgg] =
      await Promise.all([
        this.prisma.client.count(),
        this.prisma.client.groupBy({ by: ['stage'], _count: { _all: true } }),
        this.prisma.client.count({ where: { stage: 'VENTA_PERDIDA' } }),
        this.prisma.client.count({
          where: { followUps: { none: { status: 'PENDIENTE' } }, stage: { notIn: ['VENTA_CERRADA', 'VENTA_PERDIDA'] } },
        }),
        this.prisma.client.groupBy({
          by: ['lastObjection'],
          _count: { _all: true },
          where: { lastObjection: { not: 'NINGUNA' } },
        }),
        this.prisma.client.aggregate({ _avg: { leadScore: true } }),
      ]);

    const byStage: Record<string, number> = {};
    byStageRaw.forEach((g) => (byStage[g.stage] = g._count._all));
    const won = byStage['VENTA_CERRADA'] ?? 0;
    const conversionRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0;
    const topObjections = objectionsRaw
      .map((o) => ({ objection: o.lastObjection, count: o._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return this.ai.generateInsights({
      totalLeads: total,
      byStage,
      conversionRate,
      avgLeadScore: Math.round(scoreAgg._avg.leadScore ?? 0),
      topObjections,
      withoutFollowUp,
      lostCount: lost,
    });
  }

  /** Lee el pedido del cliente desde la conversación y lo arma (para confirmar). */
  @Post('clients/:id/parse-order')
  async parseOrder(@Param('id') id: string) {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id },
      include: {
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 60 } },
        },
      },
    });
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, price: true },
    });
    const history =
      client.conversations[0]?.messages.map((m) => ({
        direction: m.direction as 'ENTRANTE' | 'SALIENTE',
        content: m.content,
      })) ?? [];

    const order = await this.ai.parseOrder(
      history,
      products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price.toString() })),
    );

    // Enriquecemos con precio para calcular el total estimado
    const items = (order.items || []).map((it: any) => {
      const prod = products.find((p) => p.id === it.productId);
      const unitPrice = prod ? Number(prod.price) : 0;
      return { ...it, unitPrice, subtotal: unitPrice * (it.quantity || 1) };
    });
    const total = items.reduce((a: number, it: any) => a + it.subtotal, 0);
    return { ...order, items, total };
  }

  private async buildContext(clientId: string): Promise<ConversationContext> {
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

    return {
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
    };
  }
}
