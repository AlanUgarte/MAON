import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min,
} from 'class-validator';
import { ClientStage, LeadSource, IvaCondition } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiProperty({ example: '+5493411234567' }) @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;

  // Datos fiscales (facturación)
  @ApiPropertyOptional({ description: 'Razón social, si difiere del nombre' }) @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional({ example: '20350352040' }) @IsOptional() @IsString() cuit?: string;
  @ApiPropertyOptional({ enum: IvaCondition }) @IsOptional() @IsEnum(IvaCondition) ivaCondition?: IvaCondition;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional({ example: 'C029105' }) @IsOptional() @IsString() clientCode?: string;
  @ApiPropertyOptional({ default: 'Contado' }) @IsOptional() @IsString() condicionVenta?: string;
  @ApiPropertyOptional({ enum: ClientStage }) @IsOptional() @IsEnum(ClientStage) stage?: ClientStage;
  @ApiPropertyOptional({ enum: LeadSource }) @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @ApiPropertyOptional() @IsOptional() @IsString() interestedProductId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaCampaignId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedSellerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) leadScore?: number;
}
