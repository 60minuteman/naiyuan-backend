import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async generateOTP(generateOTPDto: GenerateOTPDto) {
    try {
      // Try to find user or create if doesn't exist
      let user = await this.prisma.user.findUnique({
        where: { email: generateOTPDto.email }
      });

      if (!user) {
        // Create new user if doesn't exist
        user = await this.prisma.user.create({
          data: {
            email: generateOTPDto.email,
            verificationStatus: 'PENDING'
          }
        });
        this.logger.log(`Created new user with email: ${generateOTPDto.email}`);
      }

      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save OTP to database
      await this.prisma.oTPStore.create({
        data: {
          otp,
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        },
      });

      // Send OTP via email
      await this.emailService.sendOTP(user.email, otp);

      return { 
        message: 'OTP sent successfully',
        isNewUser: !user
      };

    } catch (error) {
      this.logger.error('Failed to generate OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate OTP');
    }
  }

  async verifyOTP(verifyOTPDto: VerifyOTPDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: verifyOTPDto.email }
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const otpRecord = await this.prisma.oTPStore.findFirst({
        where: {
          userId: user.id,
          otp: verifyOTPDto.otp,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Update user verification status
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationStatus: 'VERIFIED' }
      });

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email
      };

      const token = await this.jwtService.signAsync(payload);
      const { password: _, ...userWithoutPassword } = user;

      return {
        access_token: token,
        user: userWithoutPassword
      };

    } catch (error) {
      this.logger.error('Failed to verify OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify OTP');
    }
  }

  async resendOTP(generateOTPDto: GenerateOTPDto) {
    return this.generateOTP(generateOTPDto);
  }
}
