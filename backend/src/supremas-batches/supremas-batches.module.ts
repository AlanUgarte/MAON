import { Module } from '@nestjs/common';
import { SupremasIngredientsModule } from '../supremas-ingredients/supremas-ingredients.module';
import { SupremasBatchesService } from './supremas-batches.service';
import { SupremasBatchesController } from './supremas-batches.controller';

@Module({
  imports: [SupremasIngredientsModule],
  providers: [SupremasBatchesService],
  controllers: [SupremasBatchesController],
  exports: [SupremasBatchesService],
})
export class SupremasBatchesModule {}
