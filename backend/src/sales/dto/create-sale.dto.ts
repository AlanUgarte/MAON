import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsBoolean, IsIn, ValidateNested, IsInt, IsNumber, Min, Max, ArrayMaxSize, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

// Solo los 3 estados que el admin de Dark Store puede setear a mano desde el desplegable
// de Pedidos — PAGADA/CANCELADA se manejan por otros flujos (confirmación de pago,
// cancelación), no desde acá.
export const DARK_STORE_MANUAL_STATUSES = ['PENDIENTE', 'ENVIADA', 'ENTREGADA'] as const;
export class SetSaleStatusDto {
  @ApiProperty({ enum: DARK_STORE_MANUAL_STATUSES })
  @IsIn(DARK_STORE_MANUAL_STATUSES)
  status: (typeof DARK_STORE_MANUAL_STATUSES)[number];
}

export class SaleItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}

export class CreateSaleDto {
  @ApiProperty() @IsString() clientId: string;
  @ApiProperty({ type: [SaleItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SaleItemDto)
  items: SaleItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() sellerId?: string;
}

export class StorefrontSaleItemDto {
  @ApiProperty() @IsString() @MaxLength(64) sku: string;
  // Tope de bultos por línea: es venta mayorista, pero un pedido real de un cliente
  // no llega ni de cerca a esto — corta abuso (cantidades absurdas) sin frenar a nadie real.
  @ApiProperty() @IsInt() @Min(1) @Max(500) quantity: number;
  // Precio de venta por unidad de esta línea, ya calculado por el storefront (costo +
  // margen del artículo/general + recargos, según el modo bulto/unidad/display elegido).
  // El backend confía en este valor para Tienda/Cotillón/Estufa (no hay pago online: todo
  // pedido lo revisa un humano por WhatsApp antes de despachar) — replicar acá la fórmula
  // de precio del storefront (margen por artículo, recargos por SKU, promos) duplicaría
  // reglas de negocio configurables y se desincroniza fácil, como ya pasó antes con esto.
  // Opcional solo porque Dark Store (issueTicket) no lo manda: ese storefront vende de un
  // único modo simple y el precio se recalcula siempre server-side, nunca hace falta acá.
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0.01) unitPrice?: number;
  // Aclara el modo de venta cuando no es bulto cerrado (ej. "unidad", "zuncho x5") — sin
  // esto el remito no puede distinguir 2 bultos de 2 unidades sueltas del mismo SKU.
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) note?: string;
}

/** Línea de vapeador (Dark Store) — no es un Product del maestro, se identifica por id propio. */
export class StorefrontVapeItemDto {
  @ApiProperty() @IsString() @MaxLength(64) vapeId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(50) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) flavor?: string;
}

/** Pedido armado en la tienda pública (sin login): identifica productos por SKU, no por id. */
export class CreateStorefrontSaleDto {
  @ApiProperty() @IsString() @MaxLength(120) customerName: string;
  @ApiProperty() @IsString() @MaxLength(40) customerPhone: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) sellerName?: string;
  @ApiProperty({ type: [StorefrontSaleItemDto] })
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => StorefrontSaleItemDto)
  items: StorefrontSaleItemDto[];
  // Datos logísticos elegidos en el checkout — antes solo quedaban en localStorage.
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() wantsShipping?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) shippingAddress?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) availableSchedule?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() envioGratis?: boolean;
  // Dark Store: barrio elegido (valida contra DarkStoreSettings.deliveryBarrios en el
  // frontend) y líneas de vapeadores, que no son Product y no entran en `items`.
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) barrio?: string;
  @ApiProperty({ required: false, type: [StorefrontVapeItemDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => StorefrontVapeItemDto)
  vapeItems?: StorefrontVapeItemDto[];
  // Si viene true, rechaza el pedido cuando algún producto/vape no tiene stock suficiente
  // (los storefronts existentes NO validan esto hoy — opt-in para no cambiarles el comportamiento).
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() enforceStock?: boolean;
  // Si viene true, emite un comprobante tipo remito (ticket, no válido como factura) y lo
  // manda por WhatsApp en vez del texto de instrucciones de transferencia — opt-in, solo
  // Dark Store lo usa (no tiene pago online).
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() issueTicket?: boolean;
}

/** Marca un pedido como facturado, asociándolo al número de comprobante ya emitido. */
export class MarkInvoicedDto {
  @ApiProperty() @IsString() @MaxLength(60) comprobanteNumero: string;
}
