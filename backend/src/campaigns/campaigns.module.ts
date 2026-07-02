import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { ClientsModule } from '../clients/clients.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [ClientsModule, WhatsAppModule],
  providers: [CampaignsService],
  controllers: [CampaignsController],
})
export class CampaignsModule {}
