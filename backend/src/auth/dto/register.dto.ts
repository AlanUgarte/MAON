import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'vendedor@crm.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, required: false, default: Role.VENDEDOR })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
