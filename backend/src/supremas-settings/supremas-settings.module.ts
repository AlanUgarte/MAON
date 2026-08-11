import { Module } from '@nestjs/common';
import { SupremasSettingsService } from './supremas-settings.service';
import { SupremasSettingsController } from './supremas-settings.controller';

@Module({
  providers: [SupremasSettingsService],
  controllers: [SupremasSettingsController],
  exports: [SupremasSettingsService],
})
export class SupremasSettingsModule {}
