import { Module } from '@nestjs/common';
import { VynoSettingsService } from './vyno-settings.service';
import { VynoSettingsController } from './vyno-settings.controller';

@Module({
  providers: [VynoSettingsService],
  controllers: [VynoSettingsController],
  exports: [VynoSettingsService],
})
export class VynoSettingsModule {}
