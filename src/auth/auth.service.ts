import { Injectable, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User, VerificationStatus } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';

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
      const existingUser = await this.usersService.findByEmail(signUpDto.email);

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: signUpDto.email,
          password: hashedPassword,
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
          phoneNumber: signUpDto.phoneNumber,
          verificationStatus: 'PENDING'
        },
      });

      // Generate and send OTP
      await this.generateAndSendOTP(user.email, user.id);

      // Generate JWT token
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email
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
    } catch (error) {
      this.logger.error(`Error in signUp service: ${error.message}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during signup');
    }
  }

  async resendOTP(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.generateAndSendOTP(email, user.id);

      return {
        message: 'OTP resent successfully',
        email: email,
      };
    } catch (error) {
      this.logger.error(`Error in resendOTP: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while resending OTP');
    }
  }

  async verifyOTP(email: string, otp: string) {
    try {
      const storedOTP = await this.prisma.oTPStore.findFirst({
        where: { 
          email,
          expiresAt: { gt: new Date() }
        },
      });

      this.logger.debug(`Stored OTP for ${email}: ${JSON.stringify(storedOTP)}`);

      if (!storedOTP) {
        throw new BadRequestException('No valid OTP found. Please request a new OTP.');
      }

      if (storedOTP.otp !== otp) {
        throw new BadRequestException('Invalid OTP. Please try again.');
      }

      await this.prisma.oTPStore.delete({ where: { id: storedOTP.id } });

      const user = await this.usersService.findByEmail(email);
      this.logger.debug(`User found: ${JSON.stringify(user)}`);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.verificationStatus === VerificationStatus.PENDING) {
        await this.usersService.update(user.id, { verificationStatus: VerificationStatus.SUCCESS });
      }

      const payload = { email: user.email, sub: user.id };
      const token = this.jwtService.sign(payload);

      const response = {
        token,
        user: {
          id: user.id ? user.id.toString() : 'undefined',
          email: user.email || 'undefined',
          firstName: user.firstName || 'undefined',
          lastName: user.lastName || 'undefined',
        },
      };

      this.logger.debug(`Response object: ${JSON.stringify(response)}`);

      return response;
    } catch (error) {
      this.logger.error(`Error in verifyOTP: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during OTP verification');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        throw new BadRequestException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid credentials');
      }

      const payload = { email: user.email, sub: user.id };
      return {
        token: this.jwtService.sign(payload),
        user: {
          id: user.id ? user.id.toString() : undefined,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        },
      };
    } catch (error) {
      this.logger.error(`Error in login: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred during login');
    }
  }

  async generateAndSendOTP(email: string, userId: number) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTP
    await this.prisma.oTPStore.deleteMany({
      where: { userId }
    });

    // Create new OTP
    await this.prisma.oTPStore.create({
      data: {
        email,
        otp,
        expiresAt,
        user: {
          connect: {
            id: userId
          }
        }
      }
    });

    // Send OTP email
    await this.emailService.sendOTP(email, otp);
    
    return otp;
  }

  async generateOTP(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.generateAndSendOTP(email, user.id);

      return {
        message: 'OTP generated successfully',
        email: email
      };
    } catch (error) {
      this.logger.error(`Error in generateOTP: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while generating OTP');
    }
  }

  private generateOTPString(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
}
