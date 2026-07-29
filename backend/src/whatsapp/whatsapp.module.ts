import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppSenderModule } from './whatsapp-sender.module';

@Module({
  imports: [WhatsAppSenderModule, ConversationsModule],
  providers: [WhatsAppService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, WhatsAppSenderModule],
})
export class WhatsAppModule {}
