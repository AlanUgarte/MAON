import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEstufaSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() storeOpen?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() topBannerText?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroBadge?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroTitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() heroSubtitle?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() cost?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() marginPct?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsappNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() heroCarousel?: any[];
}
