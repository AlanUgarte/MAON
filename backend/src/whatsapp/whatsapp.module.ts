import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppSender } from './whatsapp.sender';

@Module({
  providers: [WhatsAppService, WhatsAppSender],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, WhatsAppSender],
})
export class WhatsAppModule {}
