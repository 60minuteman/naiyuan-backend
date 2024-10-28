import { Controller, Post, Body, BadRequestException, InternalServerErrorException, Logger, ConflictException, Req, Res, UnauthorizedException, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      this.logger.log(`Signup attempt for email: ${signUpDto.email}`);
      const result = await this.authService.signUp(signUpDto);
      this.logger.log(`Signup successful for email: ${signUpDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Signup failed for email: ${signUpDto.email}`, {
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ConflictException) {
        throw new ConflictException({
          message: 'Email already exists',
          statusCode: 409
        });
      }

      throw new InternalServerErrorException({
        message: 'An error occurred during signup',
        error: error.message,
        statusCode: 500
      });
    }
  }

  @Post('generate-otp')
  async generateOTP(@Body('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }
      return await this.authService.generateOTP(email);
    } catch (error) {
      this.logger.error(`Error in generateOTP controller: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while generating OTP');
    }
  }

  @Post('resend-otp')
  async resendOTP(@Body('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }
      return await this.authService.generateOTP(email);
    } catch (error) {
      this.logger.error(`Error in resendOTP controller: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while resending OTP');
    }
  }

  @Post('verify-otp')
  async verifyOTP(@Body() body: { email: string; otp: string }) {
    try {
      const { email, otp } = body;
      if (!email || !otp) {
        throw new BadRequestException('Email and OTP are required');
      }
      const result = await this.authService.verifyOTP(email, otp);
      this.logger.debug(`Controller response: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error in verifyOTP controller: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during OTP verification');
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Login request received for: ${loginDto.email}`);
      const result = await this.authService.login(loginDto);
      return result;
    } catch (error) {
      this.logger.error(`Login controller error:`, error.stack);

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException({
          message: error.message,
          statusCode: 401
        });
      }

      throw new InternalServerErrorException({
        message: 'Server error occurred during login',
        statusCode: 500
      });
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        // Add the token to a blacklist or invalidate it in your database
        await this.authService.invalidateToken(token);
      }
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error(`Error in logout controller: ${error.message}`, error.stack);
      res.status(500).json({ message: 'Error logging out' });
    }
  }

  @Get('check-user/:email')
  async checkUser(@Param('email') email: string) {
    const exists = await this.authService.checkUserExists(email);
    return { exists };
  }
}
