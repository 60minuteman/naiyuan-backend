import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User, VerificationStatus } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { PrismaClientKnownRequestError } from 'prisma';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { GenerateOTPDto } from './dto/generate-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      this.logger.log('Starting signup process...');

      // Check for existing user
      const existingUser = await this.usersService.findByEmail(signUpDto.email);
      if (existingUser) {
        this.logger.warn(`Signup attempt with existing email: ${signUpDto.email}`);
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
      this.logger.log('Password hashed successfully');

      // Create user transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            email: signUpDto.email,
            password: hashedPassword,
            firstName: signUpDto.firstName,
            lastName: signUpDto.lastName,
            phoneNumber: signUpDto.phoneNumber,
            verificationStatus: 'PENDING'
          },
        });
        this.logger.log(`User created with ID: ${user.id}`);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Store OTP
        await prisma.oTPStore.create({
          data: {
            email: user.email,
            otp: otp,
            expiresAt: expiresAt,
            user: {
              connect: {
                id: user.id
              }
            }
          }
        });
        this.logger.log('OTP stored successfully');

        // Generate JWT token
        const token = this.jwtService.sign({
          sub: user.id,
          email: user.email
        });

        // Send OTP email asynchronously
        this.emailService.sendOTP(user.email, otp).catch(error => {
          this.logger.error(`Failed to send OTP email: ${error.message}`);
        });

        return {
          message: 'Signup successful. Please verify your email.',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            verificationStatus: user.verificationStatus
          }
        };
      });

      this.logger.log(`Signup completed successfully for email: ${signUpDto.email}`);
      return result;

    } catch (error) {
      this.logger.error('Signup error:', {
        error: error.message,
        stack: error.stack,
        email: signUpDto.email
      });
      throw error;
    }
  }

  async resendOTP(generateOTPDto: GenerateOTPDto) {
    return this.generateOTP(generateOTPDto);
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
        },
        include: {
          user: true
        }
      });

      if (!otpRecord) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Update user verification status
      await this.prisma.user.update({
        where: { id: otpRecord.userId },
        data: { verificationStatus: 'VERIFIED' }
      });

      // Generate JWT token
      const payload = {
        sub: otpRecord.userId,
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

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`Attempting login for email: ${loginDto.email}`);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { 
          email: loginDto.email 
        },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          verificationStatus: true
        }
      });

      if (!user) {
        this.logger.warn(`No user found with email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password
      );

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password for user: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate token
      const payload = { 
        sub: user.id, 
        email: user.email 
      };
      
      const token = this.jwtService.sign(payload);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      this.logger.log(`Login successful for user: ${loginDto.email}`);

      return {
        token,
        user: userWithoutPassword
      };

    } catch (error) {
      this.logger.error(
        `Login error for ${loginDto.email}:`,
        error.stack
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException('Database error occurred');
      }

      throw new InternalServerErrorException('An error occurred during login');
    }
  }

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

  async invalidateToken(token: string): Promise<void> {
    // try {
    //   // Add the token to the blacklist in the database
    //   await this.prisma.tokenBlacklist.create({
    //     data: {
    //       token,
    //       invalidatedAt: new Date(),
    //     },
    //   });

    //   this.logger.debug(`Token invalidated: ${token}`);
    // } catch (error) {
    //   this.logger.error(`Error invalidating token: ${error.message}`, error.stack);
    //   throw new InternalServerErrorException('An error occurred while invalidating the token');
    // }
  }

  // Helper method to check if user exists
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email }
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking user existence: ${error.message}`);
      return false;
    }
  }
}
