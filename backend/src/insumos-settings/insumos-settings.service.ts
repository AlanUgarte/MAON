import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInsumosSettingsDto } from './dto/update-insumos-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class InsumosSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fila única de config: se crea con los defaults del schema la primera vez que se pide. */
  async get() {
    return this.prisma.insumosSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async getPublic() {
    const s = await this.get();
    return {
      shippingFlatCost: s.shippingFlatCost,
      paymentAlias: s.paymentAlias,
      whatsappNumber: s.whatsappNumber,
      aboutText: s.aboutText,
      privacyPolicy: s.privacyPolicy,
      termsAndConditions: s.termsAndConditions,
      returnsPolicy: s.returnsPolicy,
    };
  }

  async update(dto: UpdateInsumosSettingsDto) {
    return this.prisma.insumosSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
  }
}
