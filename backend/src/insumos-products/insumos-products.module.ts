import { Module } from '@nestjs/common';
import { InsumosProductsService } from './insumos-products.service';
import { InsumosProductsController } from './insumos-products.controller';

@Module({
  providers: [InsumosProductsService],
  controllers: [InsumosProductsController],
  exports: [InsumosProductsService],
})
export class InsumosProductsModule {}
