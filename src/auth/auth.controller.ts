import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  @Post('generate-otp')
  async generateOTP(@Body() generateOTPDto: GenerateOTPDto) {
    return this.authService.generateOTP(generateOTPDto);
  }

  @Post('verify-otp')
  async verifyOTP(@Body() verifyOTPDto: VerifyOTPDto) {
    return this.authService.verifyOTP(verifyOTPDto);
  }

  @Post('resend-otp')
  async resendOTP(@Body() generateOTPDto: GenerateOTPDto) {
    return this.authService.resendOTP(generateOTPDto);
  }
}
