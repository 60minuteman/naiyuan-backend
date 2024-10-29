import { Controller, Post, Body, Logger, Param, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { SignUpDto } from './dto/signup.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Put('complete-profile/:userId')
  async completeProfile(
    @Param('userId') userId: string,
    @Body() completeProfileDto: CompleteProfileDto
  ) {
    return this.authService.completeProfile(parseInt(userId), completeProfileDto);
  }
}
