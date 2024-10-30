import { IsString, IsOptional, Matches } from 'class-validator';

export class CompleteProfileDto {
  @IsString()
  @IsOptional()
  bvn?: string;

  @IsString()
  @IsOptional()
  nin?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format'
  })
  dateOfBirth?: string;
} 