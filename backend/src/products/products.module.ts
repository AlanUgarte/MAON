import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CatalogController } from './catalog.controller';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController, CatalogController],
  exports: [ProductsService],
})
export class ProductsModule {}
