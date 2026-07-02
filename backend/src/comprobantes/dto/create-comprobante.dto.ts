import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional,
  IsString, Min, ValidateNested,
} from 'class-validator';

export enum ComprobanteTipo {
  FACTURA = 'FACTURA',
  REMITO = 'REMITO',
  NOTA_CREDITO = 'NOTA_CREDITO',
  NOTA_CREDITO_REMITO = 'NOTA_CREDITO_REMITO',
}

export enum ComprobanteLetra {
  A = 'A',
  B = 'B',
  C = 'C',
  R = 'R',
}

export class ComprobanteItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiProperty() @IsString() detalle: string;
  @ApiProperty({ default: 1 }) @IsInt() @Min(1) cantidad: number;
  @ApiProperty() @IsNumber() unitPrice: number;
  @ApiPropertyOptional({ description: 'Alícuota de IVA del ítem: 0.21, 0.105 o 0 (exento). Default 0.21', default: 0.21 })
  @IsOptional() @IsNumber() ivaRate?: number;
}

export class CreateComprobanteDto {
  @ApiProperty({ enum: ComprobanteTipo }) @IsEnum(ComprobanteTipo) tipo: ComprobanteTipo;
  @ApiPropertyOptional({ enum: ComprobanteLetra, description: 'Si se omite, se infiere del tipo (A para factura/N.C., R para remito)' })
  @IsOptional() @IsEnum(ComprobanteLetra) letra?: ComprobanteLetra;
  @ApiProperty() @IsString() clientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sellerId?: string;

  // CAE: obligatorio para factura/N.C. letra A (documento que impactó en ARCA)
  @ApiPropertyOptional({ description: 'CAE de ARCA. Requerido en factura/N.C. letra A' }) @IsOptional() @IsString() cae?: string;
  @ApiPropertyOptional({ description: 'Fecha de vencimiento del CAE' }) @IsOptional() @IsDateString() caeVto?: string;

  // IVA discriminado (21%) opcional
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() discriminarIva?: boolean;

  // Nota de crédito en blanco: sin items, importe manual
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() enBlanco?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional({ description: 'Importe para nota de crédito en blanco' })
  @IsOptional() @IsNumber() importe?: number;

  @ApiPropertyOptional({ type: [ComprobanteItemDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ComprobanteItemDto)
  items?: ComprobanteItemDto[];
}
