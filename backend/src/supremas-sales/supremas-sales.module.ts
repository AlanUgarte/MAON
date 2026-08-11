import { Module } from '@nestjs/common';
import { SupremasSettingsModule } from '../supremas-settings/supremas-settings.module';
import { SupremasBatchesModule } from '../supremas-batches/supremas-batches.module';
import { SupremasSalesService } from './supremas-sales.service';
import { SupremasSalesController } from './supremas-sales.controller';

@Module({
  imports: [SupremasSettingsModule, SupremasBatchesModule],
  providers: [SupremasSalesService],
  controllers: [SupremasSalesController],
  exports: [SupremasSalesService],
})
export class SupremasSalesModule {}
