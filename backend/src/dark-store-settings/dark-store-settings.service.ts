import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDarkStoreSettingsDto } from './dto/update-dark-store-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class DarkStoreSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fila única de config: se crea con los defaults del schema la primera vez que se pide. */
  async get() {
    return this.prisma.darkStoreSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(dto: UpdateDarkStoreSettingsDto) {
    return this.prisma.darkStoreSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
  }
}
