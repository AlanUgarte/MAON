import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { TiendaSettingsModule } from './tienda-settings/tienda-settings.module';
import { EstufaSettingsModule } from './estufa-settings/estufa-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Solo se aplica puntualmente en POST /sales/storefront (único endpoint público
    // de escritura) vía @UseGuards(ThrottlerGuard) — no global, para no afectar el
    // uso normal del CRM autenticado (varios vendedores pueden compartir una IP de oficina).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 8 }]),
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
    TiendaSettingsModule,
    EstufaSettingsModule,
  ],
})
export class AppModule {}
