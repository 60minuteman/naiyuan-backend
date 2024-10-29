import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsOptional()
  bvn?: string;

  @IsString()
  @IsOptional()
  nin?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;
} 