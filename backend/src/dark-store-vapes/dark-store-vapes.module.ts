import { Module } from '@nestjs/common';
import { DarkStoreVapesService } from './dark-store-vapes.service';
import { DarkStoreVapesController } from './dark-store-vapes.controller';

@Module({
  providers: [DarkStoreVapesService],
  controllers: [DarkStoreVapesController],
  exports: [DarkStoreVapesService],
})
export class DarkStoreVapesModule {}
