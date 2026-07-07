import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsBoolean, ValidateNested, IsInt, Min, Max, ArrayMaxSize, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

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
}

/** Marca un pedido como facturado, asociándolo al número de comprobante ya emitido. */
export class MarkInvoicedDto {
  @ApiProperty() @IsString() @MaxLength(60) comprobanteNumero: string;
}
