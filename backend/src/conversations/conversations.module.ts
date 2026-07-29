import { Module } from '@nestjs/common';
import { WhatsAppSenderModule } from '../whatsapp/whatsapp-sender.module';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [WhatsAppSenderModule],
  providers: [ConversationsService],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}
