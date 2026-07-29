import { Module } from '@nestjs/common';
import { WhatsAppSenderModule } from '../whatsapp/whatsapp-sender.module';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
  imports: [WhatsAppSenderModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
