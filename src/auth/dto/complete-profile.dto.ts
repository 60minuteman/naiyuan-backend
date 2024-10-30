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
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      // Set time to midnight UTC
      date.setUTCHours(0, 0, 0, 0);
      return date.toISOString();
    } catch {
      throw new Error('Invalid date format');
    }
  })
  dateOfBirth?: string;
} 