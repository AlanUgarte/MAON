import { Module } from '@nestjs/common';
import { InsumosSettingsModule } from '../insumos-settings/insumos-settings.module';
import { InsumosOrdersService } from './insumos-orders.service';
import { InsumosOrdersController } from './insumos-orders.controller';

@Module({
  imports: [InsumosSettingsModule],
  providers: [InsumosOrdersService],
  controllers: [InsumosOrdersController],
  exports: [InsumosOrdersService],
})
export class InsumosOrdersModule {}
