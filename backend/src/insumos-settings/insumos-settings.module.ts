import { Module } from '@nestjs/common';
import { InsumosSettingsService } from './insumos-settings.service';
import { InsumosSettingsController } from './insumos-settings.controller';

@Module({
  providers: [InsumosSettingsService],
  controllers: [InsumosSettingsController],
  exports: [InsumosSettingsService],
})
export class InsumosSettingsModule {}
