import { IsEmail } from 'class-validator';

export class GenerateOTPDto {
  @IsEmail()
  email: string;
} 