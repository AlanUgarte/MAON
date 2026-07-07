import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEstufaSettingsDto } from './dto/update-estufa-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class EstufaSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fila única de config: se crea con los defaults del schema la primera vez que se pide. */
  async get() {
    return this.prisma.estufaSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(dto: UpdateEstufaSettingsDto) {
    return this.prisma.estufaSettings.upsert({
      where: { id: SINGLETON_ID },
      update: dto,
      create: { id: SINGLETON_ID, ...dto },
    });
  }
}
