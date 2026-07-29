import { Module } from '@nestjs/common';
import { WhatsAppSenderModule } from '../whatsapp/whatsapp-sender.module';
import { ComprobantesService } from './comprobantes.service';
import { ComprobantesController } from './comprobantes.controller';

@Module({
  imports: [WhatsAppSenderModule],
  providers: [ComprobantesService],
  controllers: [ComprobantesController],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}
