import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async generateOTP(generateOTPDto: GenerateOTPDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: generateOTPDto.email }
      });

      if (!user) {
        throw new BadRequestException('User not found');
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

      return { message: 'OTP sent successfully' };

    } catch (error) {
      this.logger.error('Failed to generate OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate OTP');
    }
  }

  async resendOTP(generateOTPDto: GenerateOTPDto) {
    return this.generateOTP(generateOTPDto);
  }
}
