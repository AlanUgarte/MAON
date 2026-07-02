import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AIModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ConversationsModule } from './conversations/conversations.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ProductsModule } from './products/products.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AutomationsModule } from './automations/automations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SalesModule } from './sales/sales.module';
import { ComprobantesModule } from './comprobantes/comprobantes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AIModule,
    AuthModule,
    ClientsModule,
    ConversationsModule,
    WhatsAppModule,
    ProductsModule,
    CampaignsModule,
    AutomationsModule,
    DashboardModule,
    SalesModule,
    ComprobantesModule,
  ],
})
export class AppModule {}
