import { Module } from '@nestjs/common';
import { VynoSettingsModule } from '../vyno-settings/vyno-settings.module';
import { VynoOrdersService } from './vyno-orders.service';
import { VynoOrdersController } from './vyno-orders.controller';

@Module({
  imports: [VynoSettingsModule],
  providers: [VynoOrdersService],
  controllers: [VynoOrdersController],
  exports: [VynoOrdersService],
})
export class VynoOrdersModule {}
