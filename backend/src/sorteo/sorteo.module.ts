import { Module } from '@nestjs/common';
import { SorteoService } from './sorteo.service';
import { SorteoController } from './sorteo.controller';

@Module({
  providers: [SorteoService],
  controllers: [SorteoController],
  exports: [SorteoService],
})
export class SorteoModule {}
