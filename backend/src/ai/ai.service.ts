import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  ANALYSIS_SYSTEM_PROMPT,
  REPLY_SYSTEM_PROMPT,
  FOLLOWUP_SYSTEM_PROMPT,
  INSIGHTS_SYSTEM_PROMPT,
  ORDER_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildReplyPrompt,
  buildFollowUpPrompt,
  buildInsightsPrompt,
  buildOrderPrompt,
  ConversationContext,
  BusinessSnapshot,
  OrderCatalogItem,
} from './prompts';
import { matchFaq, requiresAI, FaqMatch } from './predefined-responses';

export interface AIAnalysisResult {
  buyingIntent: 'ALTA' | 'MEDIA' | 'BAJA';
  leadScore: number;
  sentiment: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';
  objection: 'PRECIO' | 'ENVIO' | 'CONFIANZA' | 'TIEMPO_ENTREGA' | 'COMPETENCIA' | 'NINGUNA';
  nextAction: string;
  summary: string;
  suggestions: string[];
  // Telemetría
  usedAI: boolean;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface InboundDecision {
  /** Si hay respuesta automática lista (FAQ) y no hace falta IA. */
  autoReply?: string;
  faq?: FaqMatch | null;
  needsAI: boolean;
}

/**
 * AIService
 * --------------------------------------------------------------
 * Único punto de entrada para TODA la lógica de IA del CRM.
 * Estrategia híbrida para reducir costos:
 *   1) Las consultas frecuentes (precio, stock, envíos, etc.) se
 *      resuelven con respuestas predefinidas, SIN llamar a Claude.
 *   2) Solo se invoca a Claude en casos complejos: negociación,
 *      mayoristas, múltiples preguntas o ambigüedad.
 *
 * Exclusivamente usa la API de Anthropic (Claude). No usa OpenAI.
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('AI_MODEL') || 'claude-sonnet-4-6';
    this.enabled =
      this.config.get<string>('AI_ENABLED') !== 'false' && !!apiKey;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;

    if (!this.client) {
      this.logger.warn(
        'ANTHROPIC_API_KEY no configurada. El AIService funcionará con heurísticas (sin IA real).',
      );
    }
  }

  // ===========================================================
  //  CAPA HÍBRIDA · decisión sobre un mensaje entrante
  // ===========================================================

  /**
   * Decide cómo tratar un mensaje entrante.
   * Si es una FAQ → devuelve respuesta automática (0 costo IA).
   * Si es complejo → marca needsAI = true.
   */
  triageInbound(
    text: string,
    vars: Record<string, string> = {},
  ): InboundDecision {
    const faq = matchFaq(text, vars);
    if (faq && !requiresAI(text)) {
      return { autoReply: faq.reply, faq, needsAI: false };
    }
    return { faq, needsAI: requiresAI(text) || !faq };
  }

  // ===========================================================
  //  ANÁLISIS INTEGRAL (1 llamada = todas las funciones)
  // ===========================================================

  /**
   * Ejecuta el análisis comercial completo:
   * intención, lead score, sentimiento, objeción, próxima acción,
   * resumen ejecutivo y 3 respuestas sugeridas.
   */
  async analyzeConversation(
    ctx: ConversationContext,
  ): Promise<AIAnalysisResult> {
    if (!this.client || !this.enabled) {
      return this.heuristicAnalysis(ctx);
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildAnalysisPrompt(ctx) }],
      });

      const raw = this.extractText(response);
      const parsed = this.safeParseJSON(raw);

      return {
        buyingIntent: this.coerceIntent(parsed.buyingIntent),
        leadScore: this.clampScore(parsed.leadScore),
        sentiment: this.coerceSentiment(parsed.sentiment),
        objection: this.coerceObjection(parsed.objection),
        nextAction: String(parsed.nextAction || 'Esperar respuesta'),
        summary: String(parsed.summary || ''),
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.slice(0, 3).map(String)
          : [],
        usedAI: true,
        model: this.model,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (err) {
      this.logger.error(`Error en analyzeConversation: ${err}`);
      return this.heuristicAnalysis(ctx);
    }
  }

  // ===========================================================
  //  RESPUESTA SUGERIDA / GENERADA PARA EL VENDEDOR
  // ===========================================================

  async generateReply(
    ctx: ConversationContext,
    instruction?: string,
  ): Promise<string> {
    if (!this.client || !this.enabled) {
      return 'Hola! Gracias por escribirnos 😊 ¿En qué te puedo ayudar hoy?';
    }
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 400,
        system: REPLY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildReplyPrompt(ctx, instruction) }],
      });
      return this.extractText(response).trim();
    } catch (err) {
      this.logger.error(`Error en generateReply: ${err}`);
      return 'Hola! Gracias por tu mensaje. En un momento te respondo con el detalle 🙌';
    }
  }

  // ===========================================================
  //  SEGUIMIENTO INTELIGENTE
  // ===========================================================

  async generateFollowUp(
    ctx: ConversationContext,
    daysSilent: number,
  ): Promise<string> {
    if (!this.client || !this.enabled) {
      return `Hola ${ctx.clientName}! 👋 ¿Seguís interesado/a? Cualquier duda quedo a disposición.`;
    }
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 200,
        system: FOLLOWUP_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildFollowUpPrompt(ctx, daysSilent) },
        ],
      });
      return this.extractText(response).trim();
    } catch (err) {
      this.logger.error(`Error en generateFollowUp: ${err}`);
      return `Hola ${ctx.clientName}! 👋 Pasaba a ver si pudiste decidirte. Tenemos stock disponible 📦`;
    }
  }

  // ===========================================================
  //  INSIGHTS DE NEGOCIO · qué mejorar
  // ===========================================================

  async generateInsights(snapshot: BusinessSnapshot): Promise<any> {
    if (!this.client || !this.enabled) {
      return this.heuristicInsights(snapshot);
    }
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1200,
        system: INSIGHTS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildInsightsPrompt(snapshot) }],
      });
      const parsed = this.safeParseJSON(this.extractText(response));
      return {
        ...parsed,
        usedAI: true,
        model: this.model,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (err) {
      this.logger.error(`Error en generateInsights: ${err}`);
      return this.heuristicInsights(snapshot);
    }
  }

  private heuristicInsights(s: BusinessSnapshot): any {
    const recs: any[] = [];
    if (s.withoutFollowUp > 0)
      recs.push({ title: `Recuperá ${s.withoutFollowUp} clientes sin seguimiento`, impact: 'ALTO', detail: 'Activá una automatización que cree un seguimiento si no responden en 48 h.' });
    if (s.topObjections[0])
      recs.push({ title: `Trabajá la objeción de ${String(s.topObjections[0].objection).toLowerCase()}`, impact: 'ALTO', detail: 'Prepară una respuesta guion para esta objeción frecuente y compartila con el equipo.' });
    if (s.conversionRate < 25)
      recs.push({ title: 'Mejorá el tiempo de primera respuesta', impact: 'MEDIO', detail: 'Responder en los primeros minutos sube fuerte la conversión. Usá las respuestas sugeridas.' });
    return {
      headline: `Conversión ${s.conversionRate}% con ${s.withoutFollowUp} clientes sin seguir. Hay margen para crecer.`,
      findings: [
        `Lead score promedio ${s.avgLeadScore}/100.`,
        `${s.lostCount} ventas perdidas en el período.`,
        s.topObjections[0] ? `La objeción más común es ${s.topObjections[0].objection}.` : 'Sin objeciones registradas.',
      ],
      recommendations: recs,
      scriptTip: 'Ante "está caro", respondé con valor (garantía, envío, stock) antes que con descuento.',
      usedAI: false,
    };
  }



  // ===========================================================
  //  LECTOR DE PEDIDOS · arma el pedido desde la conversación
  // ===========================================================

  async parseOrder(
    history: { direction: 'ENTRANTE' | 'SALIENTE'; content: string }[],
    catalog: OrderCatalogItem[],
  ): Promise<any> {
    if (!this.client || !this.enabled) {
      return { items: [], unmatched: [], note: 'IA no disponible: cargá el pedido a mano.', usedAI: false };
    }
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 800,
        system: ORDER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildOrderPrompt(history, catalog) }],
      });
      const parsed = this.safeParseJSON(this.extractText(response));
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        unmatched: Array.isArray(parsed.unmatched) ? parsed.unmatched : [],
        note: parsed.note || '',
        usedAI: true,
        model: this.model,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      };
    } catch (err) {
      this.logger.error(`Error en parseOrder: ${err}`);
      return { items: [], unmatched: [], note: 'No se pudo leer el pedido automáticamente.', usedAI: false };
    }
  }

  private extractText(response: Anthropic.Message): string {
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
  }

  private safeParseJSON(raw: string): any {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  }

  private clampScore(v: any): number {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  private coerceIntent(v: any): 'ALTA' | 'MEDIA' | 'BAJA' {
    const s = String(v).toUpperCase();
    return s === 'ALTA' || s === 'MEDIA' || s === 'BAJA' ? (s as any) : 'MEDIA';
  }

  private coerceSentiment(v: any): 'POSITIVO' | 'NEUTRO' | 'NEGATIVO' {
    const s = String(v).toUpperCase();
    return s === 'POSITIVO' || s === 'NEGATIVO' ? (s as any) : 'NEUTRO';
  }

  private coerceObjection(
    v: any,
  ): AIAnalysisResult['objection'] {
    const allowed = ['PRECIO', 'ENVIO', 'CONFIANZA', 'TIEMPO_ENTREGA', 'COMPETENCIA', 'NINGUNA'];
    const s = String(v).toUpperCase();
    return (allowed.includes(s) ? s : 'NINGUNA') as AIAnalysisResult['objection'];
  }

  // ===========================================================
  //  FALLBACK HEURÍSTICO (sin IA / sin API key)
  //  Mantiene el CRM funcional para demo y desarrollo local.
  // ===========================================================

  private heuristicAnalysis(ctx: ConversationContext): AIAnalysisResult {
    const lastInbound =
      [...ctx.history].reverse().find((m) => m.direction === 'ENTRANTE')
        ?.content || '';
    const text = lastInbound.toLowerCase();

    let score = 30;
    if (/(comprar|lo quiero|lo llevo|pagar|transferencia|cuanto sale)/.test(text)) score += 40;
    if (/(precio|stock|disponible|envio)/.test(text)) score += 15;
    if (/(mayorista|cantidad|por mayor)/.test(text)) score += 20;
    if (/(caro|no me interesa|despues|tal vez)/.test(text)) score -= 15;
    score = Math.max(0, Math.min(100, score));

    const intent = score >= 70 ? 'ALTA' : score >= 40 ? 'MEDIA' : 'BAJA';
    const sentiment = /(gracias|genial|perfecto|dale)/.test(text)
      ? 'POSITIVO'
      : /(caro|mal|problema|no)/.test(text)
        ? 'NEGATIVO'
        : 'NEUTRO';

    let objection: AIAnalysisResult['objection'] = 'NINGUNA';
    if (/(caro|precio|descuento)/.test(text)) objection = 'PRECIO';
    else if (/(envio|demora|llega)/.test(text)) objection = 'ENVIO';
    else if (/(seguro|confio|estafa|real)/.test(text)) objection = 'CONFIANZA';

    return {
      buyingIntent: intent,
      leadScore: score,
      sentiment,
      objection,
      nextAction:
        intent === 'ALTA'
          ? 'Cerrar venta y pedir datos'
          : intent === 'MEDIA'
            ? 'Enviar catálogo y precio'
            : 'Hacer seguimiento en 48 hs',
      summary: `Cliente ${ctx.clientName} con interés ${intent.toLowerCase()}${ctx.interestedProduct ? ` en ${ctx.interestedProduct}` : ''}. (Análisis heurístico sin IA)`,
      suggestions: [
        '¡Hola! Te cuento que tenemos stock disponible 📦 ¿Querés que te reserve uno?',
        'Si confirmás hoy, te lo despacho en el día. ¿Te paso los medios de pago?',
        '¿Querés que te arme el envío a tu domicilio? Decime tu ciudad y coordino 🚚',
      ],
      usedAI: false,
    };
  }
}
