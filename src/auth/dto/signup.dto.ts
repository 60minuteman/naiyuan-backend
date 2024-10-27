import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignUpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number/special character',
  })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @Transform(({ value }) => {
    let cleaned = value.replace(/^\+|^0+/, '');
    if (!cleaned.startsWith('234') && /^[789]/.test(cleaned)) {
      cleaned = '234' + cleaned;
    }
    return '+' + cleaned;
  })
  @Matches(/^\+234[789][01]\d{8}$/, {
    message: 'Phone number must be a valid Nigerian number starting with +234',
  })
  phoneNumber: string;
}
