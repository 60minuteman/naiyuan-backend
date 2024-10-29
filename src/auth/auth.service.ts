import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

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
      this.logger.debug(`Attempting to find or create user for email: ${generateOTPDto.email}`);
      
      let user = await this.prisma.user.findUnique({
        where: { email: generateOTPDto.email }
      });

      if (!user) {
        this.logger.debug('User not found, creating new user');
        try {
          user = await this.prisma.user.create({
            data: {
              email: generateOTPDto.email,
              verificationStatus: 'PENDING',
              // Add any other required fields with default values
              phoneNumber: null,
              password: null,
              firstName: null,
              lastName: null,
              middleName: null,
              bvn: null,
              nin: null,
              dateOfBirth: null,
              lgaOfOrigin: null,
              stateOfOrigin: null,
              residentialAddress: null,
              bvnResponse: null,
              ninResponse: null
            }
          });
          this.logger.debug(`Created new user with ID: ${user.id}`);
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            this.logger.error(`Prisma error creating user: ${error.code} - ${error.message}`);
            throw new BadRequestException(`Failed to create user: ${error.message}`);
          }
          throw error;
        }
      }

      // Generate 6 digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.logger.debug('Generated OTP');
      
      // Save OTP to database
      const otpRecord = await this.prisma.oTPStore.create({
        data: {
          otp,
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        },
      });
      this.logger.debug(`Created OTP record with ID: ${otpRecord.id}`);

      // Send OTP via email
      await this.emailService.sendOTP(user.email, otp);
      this.logger.debug('Sent OTP email');

      return { 
        message: 'OTP sent successfully',
        isNewUser: !user,
        userId: user.id // Adding userId to response for debugging
      };

    } catch (error) {
      this.logger.error('Failed to generate OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log the full error for debugging
      this.logger.error('Full error:', JSON.stringify(error, null, 2));
      throw new BadRequestException(error.message || 'Failed to generate OTP');
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
