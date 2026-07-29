import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}

export class SetCartItemQtyDto {
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}

export class SetCartShippingDto {
  @ApiProperty() @IsBoolean() wantsShipping: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingAddress?: string;
}
