import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MaxLength, ValidateNested,
} from 'class-validator';

export const SUPREMA_CLIENT_TYPES = ['CONSUMIDOR_FINAL', 'KIOSCO', 'MAYORISTA'] as const;
export const SUPREMA_PAYMENT_METHODS = ['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'OTRO'] as const;

/** Datos para crear el cliente si todavía no existe (mismo Client de todo el CRM,
 * identificado por teléfono — nunca un cliente paralelo del módulo Supremas). */
export class NewSupremaClientDto {
  @ApiProperty() @IsString() @MaxLength(120) name: string;
  @ApiProperty() @IsString() @MaxLength(40) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) email?: string;
}

export class CreateSupremasSaleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional({ type: NewSupremaClientDto })
  @IsOptional() @ValidateNested() @Type(() => NewSupremaClientDto) newClient?: NewSupremaClientDto;

  @ApiProperty({ enum: SUPREMA_CLIENT_TYPES }) @IsIn(SUPREMA_CLIENT_TYPES) clientType: (typeof SUPREMA_CLIENT_TYPES)[number];
  @ApiProperty() @IsNumber() @Min(0.001) kg: number;
  // Solo se respeta si quien llama es ADMINISTRADOR/SUPERVISOR (punto 8 del pedido) —
  // el service ignora este valor para VENDEDOR y siempre autocompleta por clientType.
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) pricePerKg?: number;
  @ApiProperty({ enum: SUPREMA_PAYMENT_METHODS }) @IsIn(SUPREMA_PAYMENT_METHODS) paymentMethod: (typeof SUPREMA_PAYMENT_METHODS)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) observaciones?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fecha?: string;
}
