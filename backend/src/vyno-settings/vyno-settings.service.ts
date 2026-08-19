import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVynoSettingsDto } from './dto/update-vyno-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class VynoSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fila única de config: se crea con los defaults del schema la primera vez que se pide. */
  async get() {
    return this.prisma.vynoSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  /** Subconjunto seguro para la tienda pública: nunca hace falta ocultar nada acá (a
   * diferencia de Supremas no hay costos internos), pero se separa igual para no
   * acoplar el checkout público a la forma completa del modelo. */
  async getPublic() {
    const s = await this.get();
    return {
      shippingFlatCost: s.shippingFlatCost,
      paymentAlias: s.paymentAlias,
      aboutText: s.aboutText,
      privacyPolicy: s.privacyPolicy,
      termsAndConditions: s.termsAndConditions,
      returnsPolicy: s.returnsPolicy,
    };
  }

  async update(dto: UpdateVynoSettingsDto) {
    return this.prisma.vynoSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
  }
}
