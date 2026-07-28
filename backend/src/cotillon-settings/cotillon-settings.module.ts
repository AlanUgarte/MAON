import { Module } from '@nestjs/common';
import { CotillonSettingsService } from './cotillon-settings.service';
import { CotillonSettingsController } from './cotillon-settings.controller';

@Module({
  providers: [CotillonSettingsService],
  controllers: [CotillonSettingsController],
})
export class CotillonSettingsModule {}
