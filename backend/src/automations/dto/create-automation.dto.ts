import { ApiProperty } from '@nestjs/swagger';
import { AutomationActionType, AutomationTrigger } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAutomationDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: AutomationTrigger }) @IsEnum(AutomationTrigger) trigger: AutomationTrigger;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() triggerConfig?: Record<string, any>;
  @ApiProperty({ enum: AutomationActionType }) @IsEnum(AutomationActionType) actionType: AutomationActionType;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() actionConfig?: Record<string, any>;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() conditions?: Record<string, any>;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}
