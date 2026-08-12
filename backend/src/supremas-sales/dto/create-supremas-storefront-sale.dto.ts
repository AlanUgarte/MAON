import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SUPREMA_PAYMENT_METHODS } from './create-supremas-sale.dto';

/** Pedido armado en la tienda online de Supremas (sin login): identifica al cliente por
 * teléfono, igual que /sales/storefront. No trae clientId ni clientType ni pricePerKg —
 * eso lo calcula siempre el server (ver SupremasSalesService.createFromStorefront), así
 * un visitante anónimo no puede mandar su propio precio ni tramo de cliente. */
export class CreateSupremasStorefrontSaleDto {
  @ApiProperty() @IsString() @MaxLength(120) customerName: string;
  @ApiProperty() @IsString() @MaxLength(40) customerPhone: string;
  @ApiProperty() @IsNumber() @Min(0.5) @Max(500) kg: number;
  @ApiProperty({ enum: SUPREMA_PAYMENT_METHODS }) @IsIn(SUPREMA_PAYMENT_METHODS) paymentMethod: (typeof SUPREMA_PAYMENT_METHODS)[number];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() wantsShipping?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) availableSchedule?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) observaciones?: string;
}
