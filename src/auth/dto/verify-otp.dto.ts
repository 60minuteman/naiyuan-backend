import { IsEmail, IsString, Length, IsOptional } from 'class-validator';

export class VerifyOTPDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  password?: string;
} 