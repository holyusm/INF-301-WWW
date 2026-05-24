import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/credential.entity';
import { UserGender } from '../../users/entities/user-profile.entity';

export class RegisterDto {
  @IsString()
  run: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;

  @IsString()
  commune: string;

  @IsString()
  province: string;

  @IsString()
  region: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
