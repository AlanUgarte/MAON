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

  /**
   * La API de WhatsApp Cloud rechaza el "9" que se usa en todo el resto del sistema
   * para celulares argentinos (+549...) — lo quiere sin él (+54...). Confirmado a mano
   * con un envío real: con el 9 tira "Recipient phone number not in allowed list" (o
   * simplemente no entrega) aunque el número sea válido y esté bien escrito.
   * El resto de la app (Client.phone, formularios, etc.) sigue guardando el formato
   * normal con 9 — esta conversión es solo para el límite con la API de Meta.
   */
  private toMetaFormat(phone: string): string {
    const digits = phone.replace('+', '');
    if (digits.startsWith('549') && digits.length === 13) return '54' + digits.slice(3);
    return digits;
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
        to: this.toMetaFormat(to),
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
        to: this.toMetaFormat(to),
        type: 'template',
        template: { name: templateName, language: { code: languageCode } },
      }),
    });
    const data = await res.json();
    return { id: data.messages?.[0]?.id, simulated: false };
  }

  /**
   * Sube un archivo (ej. el PDF de un comprobante) a los servidores de Meta y lo manda
   * como documento adjunto. Dos pasos porque la API de WhatsApp no acepta el archivo
   * directo en el mensaje: primero se sube a POST /{phoneNumberId}/media (multipart,
   * devuelve un media id), después se referencia ese id en el mensaje.
   */
  async sendDocument(
    to: string,
    file: Buffer,
    filename: string,
    mimeType = 'application/pdf',
  ): Promise<{ id?: string; simulated: boolean }> {
    if (!this.enabled) {
      this.logger.warn(`[SIMULADO documento] → ${to}: ${filename} (${file.length} bytes)`);
      return { simulated: true };
    }
    const base = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;

    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('file', new Blob([new Uint8Array(file)], { type: mimeType }), filename);

    const uploadRes = await fetch(`${base}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: form,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.id) {
      this.logger.error(`Error subiendo documento a WhatsApp: ${JSON.stringify(uploadData)}`);
      throw new Error('No se pudo subir el documento a WhatsApp');
    }

    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: this.toMetaFormat(to),
        type: 'document',
        document: { id: uploadData.id, filename },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      this.logger.error(`Error enviando documento por WhatsApp: ${JSON.stringify(data)}`);
      throw new Error('No se pudo enviar el documento de WhatsApp');
    }
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
        to: this.toMetaFormat(to),
        type: 'image',
        image: { link: imageUrl, caption },
      }),
    });
    const data = await res.json();
    return { id: data.messages?.[0]?.id, simulated: false };
  }
}
