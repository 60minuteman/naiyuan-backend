import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CompleteProfileDto {
  @IsString()
  @IsOptional()
  bvn?: string;

  @IsString()
  @IsOptional()
  nin?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    
    // If already in ISO format, return as is
    if (value.includes('T')) return value;
    
    // Convert YYYY-MM-DD to ISO format
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    return date.toISOString();
  })
  dateOfBirth?: string;
}