import { IsString, IsISO8601, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CompleteProfileDto {
  @IsString()
  @IsOptional()
  bvn?: string;

  @IsString()
  @IsOptional()
  nin?: string;

  @IsISO8601()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return date.toISOString();
  })
  dateOfBirth?: string;
} 