import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEstufaSettingsDto } from './dto/update-estufa-settings.dto';

const SINGLETON_ID = 'singleton';
// Sku fijo del único producto de esta landing — así el checkout puede crear Sales
// reales (POST /sales/storefront matchea por sku) sin necesitar un catálogo propio.
const ESTUFA_SKU = 'ESTUFA-CS01';

@Injectable()
export class EstufaSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mantiene el Product de la estufa en sincro con costo/margen — se crea solo la primera vez. */
  private async syncProduct(s: { cost: any; marginPct: number; heroTitle: string }) {
    const cost = Number(s.cost);
    const price = Math.round(cost * (1 + s.marginPct));
    await this.prisma.product.upsert({
      where: { sku: ESTUFA_SKU },
      update: { price, cost, name: s.heroTitle },
      create: {
        sku: ESTUFA_SKU, name: s.heroTitle, price, cost,
        category: 'Estufa', brand: 'MAON', unitsPerBulk: 1, isActive: true,
      },
    });
  }

  /** Fila única de config: se crea con los defaults del schema la primera vez que se pide. */
  async get() {
    const settings = await this.prisma.estufaSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
    await this.syncProduct(settings);
    return settings;
  }

  async update(dto: UpdateEstufaSettingsDto) {
    const settings = await this.prisma.estufaSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
    await this.syncProduct(settings);
    return settings;
  }
}
