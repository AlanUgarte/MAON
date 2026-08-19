import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class VynoOrderItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(50) quantity: number;
}

/** Pedido armado en la tienda pública VYNO (sin login): identifica al cliente por
 * teléfono/email, igual criterio que el resto de los storefronts. El precio NUNCA lo
 * manda el cliente — el server lo toma siempre de VynoProduct.price vigente. */
export class CreateVynoOrderDto {
  @ApiProperty() @IsString() @MaxLength(60) firstName: string;
  @ApiProperty() @IsString() @MaxLength(60) lastName: string;
  @ApiProperty() @IsEmail() @MaxLength(160) email: string;
  @ApiProperty() @IsString() @MaxLength(40) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) docNumber?: string;

  @ApiProperty() @IsString() @MaxLength(80) province: string;
  @ApiProperty() @IsString() @MaxLength(80) city: string;
  @ApiProperty() @IsString() @MaxLength(20) postalCode: string;
  @ApiProperty() @IsString() @MaxLength(120) street: string;
  @ApiProperty() @IsString() @MaxLength(20) streetNumber: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) floorApt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) shippingNotes?: string;

  @ApiProperty({ type: [VynoOrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => VynoOrderItemDto)
  items: VynoOrderItemDto[];
}
