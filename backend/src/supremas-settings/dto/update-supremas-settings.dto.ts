import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSupremasSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) priceConsumidorFinal?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) priceKiosco?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) priceMayorista?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) kioscoMinKg?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) mayoristaMinKg?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) envaseCostPerKg?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0.001) pechugaBaseKg?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0.001) produccionBaseKg?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() blockNegativeStock?: boolean;
}
