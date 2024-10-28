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

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

      // Store OTP
      await this.prisma.oTPStore.create({
        data: {
          email: user.email,
          otp: otp,
          expiresAt: expiresAt,
          userId: user.id, // Ensure you are using userId if it's a foreign key
        }
      });

      // Send OTP email
      await this.emailService.sendOTP(user.email, otp);

      // Create initial payment account
      await this.prisma.paymentAccount.create({
        data: {
          userId: user.id,
          accountType: 'MAIN',
          currency: 'NGN',
          balance: 0,
          status: 'ACTIVE'
        }
      });

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

      await this.generateAndSendOTP(email);

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

  async generateOTP(email: string) {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      return this.generateAndSendOTP(email);
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

  private async generateAndSendOTP(email: string) {
    try {
      await this.prisma.oTPStore.deleteMany({ where: { email } });

      const otp = this.generateOTPString();
      const storedOTP = await this.prisma.oTPStore.create({
        data: {
          email,
          otp,
          expiresAt: new Date(Date.now() + 10 * 60000) // 10 minutes from now
        }
      });

      this.logger.debug(`Generated OTP for ${email}: ${otp}`);
      this.logger.debug(`Stored OTP: ${JSON.stringify(storedOTP)}`);

      await this.emailService.sendOTP(email, otp);
      
      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error(`Error in generateAndSendOTP: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while generating and sending OTP');
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
}
