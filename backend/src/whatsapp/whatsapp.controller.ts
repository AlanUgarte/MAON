import {
  Body, Controller, Get, HttpCode, Post, Query, Res,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('WhatsApp (Webhook)')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly config: ConfigService,
  ) {}

  /** Verificación del webhook (handshake de Meta). */
  @Get('webhook')
  @ApiExcludeEndpoint()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  /** Recepción de eventos (mensajes entrantes y estados). */
  @Post('webhook')
  @HttpCode(200)
  async receive(@Body() body: any) {
    // Respondemos 200 inmediatamente; el procesamiento es asíncrono.
    this.whatsapp.handleWebhook(body).catch(() => undefined);
    return { received: true };
  }
}
