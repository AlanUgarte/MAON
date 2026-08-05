import { Module } from '@nestjs/common';
import { WhatsAppSenderModule } from '../whatsapp/whatsapp-sender.module';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { DarkStoreVapesModule } from '../dark-store-vapes/dark-store-vapes.module';
import { DarkStoreSettingsModule } from '../dark-store-settings/dark-store-settings.module';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';

@Module({
  imports: [WhatsAppSenderModule, ComprobantesModule, DarkStoreVapesModule, DarkStoreSettingsModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
