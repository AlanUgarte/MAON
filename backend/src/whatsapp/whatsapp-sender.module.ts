import { Module } from '@nestjs/common';
import { WhatsAppSender } from './whatsapp.sender';

// Separado de WhatsAppModule para evitar un import circular: ConversationsModule
// necesita WhatsAppSender (para enviar mensajes de vendedores) y WhatsAppModule
// necesita ConversationsModule (para chequear/actualizar aiMode) — este módulo
// chico no depende de ninguno de los dos, así que corta el ciclo.
@Module({
  providers: [WhatsAppSender],
  exports: [WhatsAppSender],
})
export class WhatsAppSenderModule {}
