import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEmail, IsInt, IsNumber, IsOptional, IsString,
  MaxLength, Min, ValidateNested,
} from 'class-validator';

/** Compra pública: el comprador elige un paquete y avisa que transfirió. Nunca manda
 * el precio ni la cantidad de chances — eso sale del paquete, server-side. */
export class CreateSorteoOrderDto {
  @ApiProperty() @IsString() @MaxLength(120) buyerName: string;
  @ApiProperty() @IsString() @MaxLength(60) packageId: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(160) buyerEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) buyerPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) receiptUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) holderName?: string;
}

export class UpdateSorteoSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) prize?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) totalNumbers?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) drawDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) drawWhere?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsInt({ each: true }) blessedNumbers?: number[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) blessedPrize?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) brandName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) instagramUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) facebookUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) tiktokUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) paymentAlias?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) paymentHolder?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) whatsappNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class SorteoPackageDto {
  @ApiProperty() @IsInt() @Min(1) chances: number;
  @ApiProperty() @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPopular?: boolean;
}

/** Se reemplaza la lista completa de paquetes de una — son 4 o 5, no vale la pena
 * un CRUD por paquete. */
export class ReplaceSorteoPackagesDto {
  @ApiProperty({ type: [SorteoPackageDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SorteoPackageDto)
  packages: SorteoPackageDto[];
}

export class CreateSorteoWinnerDto {
  @ApiProperty() @IsString() @MaxLength(120) name: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() number?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) prize?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) photoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

/** Comprobante de transferencia que sube el comprador después de crear su compra. */
export class AttachReceiptDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) receiptUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) holderName?: string;
}
