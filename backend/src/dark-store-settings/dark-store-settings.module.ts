import { Module } from '@nestjs/common';
import { DarkStoreSettingsService } from './dark-store-settings.service';
import { DarkStoreSettingsController } from './dark-store-settings.controller';

@Module({
  providers: [DarkStoreSettingsService],
  controllers: [DarkStoreSettingsController],
})
export class DarkStoreSettingsModule {}
