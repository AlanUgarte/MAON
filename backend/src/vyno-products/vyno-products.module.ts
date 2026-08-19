import { Module } from '@nestjs/common';
import { VynoProductsService } from './vyno-products.service';
import { VynoProductsController } from './vyno-products.controller';

@Module({
  providers: [VynoProductsService],
  controllers: [VynoProductsController],
  exports: [VynoProductsService],
})
export class VynoProductsModule {}
