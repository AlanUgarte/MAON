import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * WhatsAppSender
 * Encapsula el envío de mensajes vía WhatsApp Business Cloud API.
 * Si no hay token configurado, registra el envío (modo simulación) para
 * permitir desarrollo local sin credenciales reales.
 */
@Injectable()
export class WhatsAppSender {
  private readonly logger = new Logger(WhatsAppSender.name);
  private readonly token?: string;
  private readonly phoneNumberId?: string;
  private readonly apiVersion: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('WHATSAPP_TOKEN');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.apiVersion = this.config.get<string>('WHATSAPP_API_VERSION') || 'v21.0';
  }

  private get enabled(): boolean {
    return !!this.token && !!this.phoneNumberId;
  }

  async sendText(to: string, body: string): Promise<{ id?: string; simulated: boolean }> {
    if (!this.enabled) {
      this.logger.warn(`[SIMULADO] → ${to}: ${body}`);
      return { simulated: true };
    }
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      this.logger.error(`Error enviando WhatsApp: ${JSON.stringify(data)}`);
      throw new Error('No se pudo enviar el mensaje de WhatsApp');
    }
    return { id: data.messages?.[0]?.id, simulated: false };
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode = 'es_AR',
  ): Promise<{ id?: string; simulated: boolean }> {
    if (!this.enabled) {
      this.logger.warn(`[SIMULADO plantilla] → ${to}: ${templateName}`);
      return { simulated: true };
    }
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: { name: templateName, language: { code: languageCode } },
      }),
    });
    const data = await res.json();
    return { id: data.messages?.[0]?.id, simulated: false };
  }

  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<{ id?: string; simulated: boolean }> {
    if (!this.enabled) {
      this.logger.warn(`[SIMULADO imagen] -> ${to}: ${imageUrl}`);
      return { simulated: true };
    }
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'image',
        image: { link: imageUrl, caption },
      }),
    });
    const data = await res.json();
    return { id: data.messages?.[0]?.id, simulated: false };
  }
}
