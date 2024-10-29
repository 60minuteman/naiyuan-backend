import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyOTPDto } from './dto';
import { GenerateOTPDto } from './dto/generate-otp.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('verify-otp')
  async verifyOTP(@Body() verifyOTPDto: VerifyOTPDto) {
    return this.authService.verifyOTP(verifyOTPDto);
  }

  @Post('generate-otp')
  async generateOTP(@Body() generateOTPDto: GenerateOTPDto) {
    return this.authService.generateOTP(generateOTPDto);
  }

  @Post('resend-otp')
  async resendOTP(@Body() generateOTPDto: GenerateOTPDto) {
    return this.authService.generateOTP(generateOTPDto);
  }
}
