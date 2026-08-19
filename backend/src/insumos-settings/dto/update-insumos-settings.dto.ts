import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class UpdateInsumosSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) shippingFlatCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) paymentAlias?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) whatsappNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) aboutText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(8000) privacyPolicy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(8000) termsAndConditions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) returnsPolicy?: string;
}
