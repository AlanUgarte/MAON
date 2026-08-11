import { Module } from '@nestjs/common';
import { SupremasSettingsModule } from '../supremas-settings/supremas-settings.module';
import { SupremasIngredientsService } from './supremas-ingredients.service';
import { SupremasIngredientsController } from './supremas-ingredients.controller';

@Module({
  imports: [SupremasSettingsModule],
  providers: [SupremasIngredientsService],
  controllers: [SupremasIngredientsController],
  exports: [SupremasIngredientsService],
})
export class SupremasIngredientsModule {}
