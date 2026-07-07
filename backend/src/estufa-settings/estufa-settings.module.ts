import { Module } from '@nestjs/common';
import { EstufaSettingsService } from './estufa-settings.service';
import { EstufaSettingsController } from './estufa-settings.controller';

@Module({
  providers: [EstufaSettingsService],
  controllers: [EstufaSettingsController],
})
export class EstufaSettingsModule {}
