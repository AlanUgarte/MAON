import { Module } from '@nestjs/common';
import { TiendaSettingsService } from './tienda-settings.service';
import { TiendaSettingsController } from './tienda-settings.controller';

@Module({
  providers: [TiendaSettingsService],
  controllers: [TiendaSettingsController],
})
export class TiendaSettingsModule {}
