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
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?([+-]\d{2}:?\d{2}|Z)$/, {
    message: 'Date must be in ISO-8601 DateTime format (e.g. 1996-09-08T00:00:00Z)'
  })
  dateOfBirth?: string;
}