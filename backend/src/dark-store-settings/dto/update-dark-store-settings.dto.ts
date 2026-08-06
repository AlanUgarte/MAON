import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDarkStoreSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() storeOpen?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() storeName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() tagline?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() logoUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() heroCarousel?: any[];
  @ApiProperty({ required: false }) @IsOptional() @IsArray() promoCards?: any[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() scheduleStart?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() scheduleEnd?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() deliveryEtaMinutes?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() deliveryFee?: number;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) deliveryBarrios?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() margenPct?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() lowStockThreshold?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() minOrderAmount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() maxOrderAmount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsappNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsappTemplate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() paymentAlias?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) hiddenProductIds?: string[];
}
