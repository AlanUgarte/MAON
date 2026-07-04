import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** KPIs principales + datos para gráficos. Si se pasa sellerId, todo queda acotado a ese vendedor. */
  async overview(sellerId?: string) {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const clientWhere = sellerId ? { assignedSellerId: sellerId } : {};
    const saleWhere = sellerId ? { sellerId } : {};

    const [
      leadsToday, leadsWeek, leadsMonth,
      salesTodayAgg, salesMonthAgg,
      totalClients, wonClients,
      pendingLeads, withoutFollowUp,
      ticketAgg,
    ] = await this.prisma.$transaction([
      this.prisma.client.count({ where: { ...clientWhere, createdAt: { gte: startOfDay } } }),
      this.prisma.client.count({ where: { ...clientWhere, createdAt: { gte: startOfWeek } } }),
      this.prisma.client.count({ where: { ...clientWhere, createdAt: { gte: startOfMonth } } }),
      this.prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { ...saleWhere, createdAt: { gte: startOfDay } } }),
      this.prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { ...saleWhere, createdAt: { gte: startOfMonth } } }),
      this.prisma.client.count({ where: clientWhere }),
      this.prisma.client.count({ where: { ...clientWhere, stage: 'VENTA_CERRADA' } }),
      this.prisma.client.count({ where: { ...clientWhere, stage: { in: ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA'] } } }),
      this.prisma.client.count({ where: { ...clientWhere, followUps: { none: { status: 'PENDIENTE' } }, stage: { notIn: ['VENTA_CERRADA', 'VENTA_PERDIDA'] } } }),
      this.prisma.sale.aggregate({ _avg: { total: true }, where: saleWhere }),
    ]);

    const conversion = totalClients > 0 ? (wonClients / totalClients) * 100 : 0;

    return {
      kpis: {
        leadsToday, leadsWeek, leadsMonth,
        salesToday: Number(salesTodayAgg._sum.total ?? 0),
        salesTodayCount: salesTodayAgg._count,
        salesMonth: Number(salesMonthAgg._sum.total ?? 0),
        salesMonthCount: salesMonthAgg._count,
        conversion: Number(conversion.toFixed(1)),
        avgTicket: Number(ticketAgg._avg.total ?? 0),
        pendingLeads,
        withoutFollowUp,
      },
      pipeline: await this.pipelineCounts(clientWhere),
      leadsByDay: await this.seriesByDay(clientWhere, 14),
      salesByDay: await this.salesByDay(saleWhere, 14),
      salesByProduct: await this.salesByProduct(sellerId),
      conversionByCampaign: sellerId ? [] : await this.conversionByCampaign(),
    };
  }

  private async pipelineCounts(clientWhere: Record<string, any>) {
    const grouped = await this.prisma.client.groupBy({
      by: ['stage'],
      where: clientWhere,
      _count: { _all: true },
    });
    const order = ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA', 'VENTA_CERRADA', 'VENTA_PERDIDA'];
    return order.map((stage) => ({
      stage,
      count: grouped.find((g) => g.stage === stage)?._count._all ?? 0,
    }));
  }

  /** Serie de conteo diario (leads creados). */
  private async seriesByDay(clientWhere: Record<string, any>, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await this.prisma.client.findMany({
      where: { ...clientWhere, createdAt: { gte: since } },
      select: { createdAt: true },
    });
    return this.bucketByDay(rows.map((r) => r.createdAt), days);
  }

  private async salesByDay(saleWhere: Record<string, any>, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const rows = await this.prisma.sale.findMany({
      where: { ...saleWhere, createdAt: { gte: since } },
      select: { createdAt: true, total: true },
    });
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of rows) {
      const key = r.createdAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += Number(r.total);
    }
    return Object.entries(buckets).map(([date, value]) => ({ date, value }));
  }

  private bucketByDay(dates: Date[], days: number) {
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const date of dates) {
      const key = date.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }
    return Object.entries(buckets).map(([date, value]) => ({ date, value }));
  }

  private async salesByProduct(sellerId?: string) {
    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: sellerId ? { sale: { sellerId } } : undefined,
      _sum: { quantity: true },
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      select: { id: true, name: true },
    });
    return items
      .map((i) => ({
        product: products.find((p) => p.id === i.productId)?.name ?? 'N/D',
        quantity: i._sum.quantity ?? 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }

  private async conversionByCampaign() {
    const campaigns = await this.prisma.metaCampaign.findMany({
      include: { _count: { select: { clients: true, sales: true } } },
    });
    return campaigns.map((c) => ({
      campaign: c.name,
      leads: c._count.clients,
      sales: c._count.sales,
      conversion: c._count.clients > 0 ? Number(((c._count.sales / c._count.clients) * 100).toFixed(1)) : 0,
    }));
  }

  /** Tablero de seguimientos agrupado por antigüedad sin respuesta. */
  async followUpsBoard() {
    const now = Date.now();
    const buckets = [
      { key: '24h', min: 24, max: 48 },
      { key: '48h', min: 48, max: 24 * 7 },
      { key: '7d', min: 24 * 7, max: 24 * 30 },
      { key: '30d', min: 24 * 30, max: Infinity },
    ];

    const clients = await this.prisma.client.findMany({
      where: {
        stage: { notIn: ['VENTA_CERRADA', 'VENTA_PERDIDA'] },
        lastInboundAt: { not: null },
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true, stage: true,
        leadScore: true, buyingIntent: true, lastInboundAt: true,
        interestedProduct: { select: { name: true } },
      },
      orderBy: { lastInboundAt: 'asc' },
      take: 300,
    });

    const result: Record<string, any[]> = { '24h': [], '48h': [], '7d': [], '30d': [] };
    for (const c of clients) {
      const hours = (now - new Date(c.lastInboundAt!).getTime()) / 3600_000;
      const bucket = buckets.find((b) => hours >= b.min && hours < b.max);
      if (bucket) result[bucket.key].push(c);
    }
    return result;
  }
}
