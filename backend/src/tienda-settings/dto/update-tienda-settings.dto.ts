import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateTiendaSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() storeOpen?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() topBannerText?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroBadge?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroTitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroSubtitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() minCompra?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() envioGratisDesde?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsappNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() margenVenta?: number;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) hiddenProductIds?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsObject() productPromos?: Record<string, any>;
}
