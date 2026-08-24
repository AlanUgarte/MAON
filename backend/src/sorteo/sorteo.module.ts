import { Module } from '@nestjs/common';
import { WhatsAppSenderModule } from '../whatsapp/whatsapp-sender.module';
import { SorteoService } from './sorteo.service';
import { SorteoController } from './sorteo.controller';

@Module({
  imports: [WhatsAppSenderModule],
  providers: [SorteoService],
  controllers: [SorteoController],
  exports: [SorteoService],
})
export class SorteoModule {}
