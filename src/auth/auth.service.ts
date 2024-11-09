import { Injectable, Logger, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { GenerateOTPDto } from './dto/generate-otp.dto';
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { SignUpDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { LoginDto } from './dto/login.dto';

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
      
      // Save OTP to database with email field
      const otpRecord = await this.prisma.oTPStore.create({
        data: {
          otp,
          email: generateOTPDto.email,
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      this.logger.debug(`Created OTP record with ID: ${otpRecord.id}`);

      // Send OTP via email
      await this.emailService.sendOTP(user.email, otp);
      this.logger.debug('Sent OTP email');

      return { 
        success: true,
        message: 'OTP sent successfully',
        isNewUser: !user,
        userId: user.id,
        email: user.email,
        verificationStatus: user.verificationStatus
      };

    } catch (error) {
      this.logger.error('Failed to generate OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to generate OTP'
      });
    }
  }

  async verifyOTP(verifyOTPDto: VerifyOTPDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: verifyOTPDto.email }
      });

      if (!user) {
        throw new BadRequestException({
          success: false,
          message: 'User not found'
        });
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
        throw new BadRequestException({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Update user verification status and optional fields if provided
      const updateData: any = {
        verificationStatus: 'VERIFIED'
      };

      if (verifyOTPDto.firstName) {
        updateData.firstName = verifyOTPDto.firstName;
      }

      if (verifyOTPDto.lastName) {
        updateData.lastName = verifyOTPDto.lastName;
      }

      if (verifyOTPDto.password) {
        updateData.password = await bcrypt.hash(verifyOTPDto.password, 10);
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email
      };

      const token = await this.jwtService.signAsync(payload);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;

      return {
        success: true,
        message: 'OTP verified successfully',
        token,
        user: userWithoutPassword,
        isVerified: true,
        verificationStatus: 'VERIFIED'
      };

    } catch (error) {
      this.logger.error('Failed to verify OTP:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to verify OTP',
        isVerified: false
      });
    }
  }

  async resendOTP(generateOTPDto: GenerateOTPDto) {
    return this.generateOTP(generateOTPDto);
  }

  async signup(signUpDto: SignUpDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: signUpDto.email }
      });

      if (existingUser) {
        throw new BadRequestException({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

      // Create new user
      const user = await this.prisma.user.create({
        data: {
          email: signUpDto.email,
          password: hashedPassword,
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
          phoneNumber: signUpDto.phoneNumber,
          verificationStatus: 'PENDING'
        }
      });

      // Generate OTP for email verification
      const otpResponse = await this.generateOTP({ email: user.email });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'User registered successfully. Please verify your email with the OTP sent.',
        user: userWithoutPassword,
        isNewUser: true,
        userId: user.id,
        email: user.email,
        verificationStatus: user.verificationStatus,
        otpSent: otpResponse.success
      };

    } catch (error) {
      this.logger.error('Failed to signup:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to signup'
      });
    }
  }

  async completeProfile(userId: number, completeProfileDto: CompleteProfileDto) {
    try {
      this.logger.debug('Completing profile for user:', userId);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new BadRequestException({
          success: false,
          message: 'User not found'
        });
      }

      // Create update data object
      const updateData: any = {
        bvn: completeProfileDto.bvn,
        nin: completeProfileDto.nin,
      };

      // Handle date formatting
      if (completeProfileDto.dateOfBirth) {
        try {
          let isoDate: string;
          
          // Check if the date is already in ISO format
          if (completeProfileDto.dateOfBirth.includes('T')) {
            isoDate = completeProfileDto.dateOfBirth;
          } else {
            // Convert YYYY-MM-DD to ISO format
            const date = new Date(completeProfileDto.dateOfBirth);
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date');
            }
            isoDate = date.toISOString();
          }

          updateData.dateOfBirth = isoDate;
          this.logger.debug('Formatted date:', isoDate);
        } catch (error) {
          this.logger.error('Date formatting error:', error);
          throw new BadRequestException({
            success: false,
            message: 'Invalid date format. Please use YYYY-MM-DD or ISO format'
          });
        }
      }

      this.logger.debug('Update data:', updateData);

      // Update user profile
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      const { password: _, ...userWithoutPassword } = updatedUser;

      return {
        success: true,
        message: 'Profile updated successfully',
        user: userWithoutPassword
      };

    } catch (error) {
      this.logger.error('Profile completion failed:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.debug('Login attempt for email:', loginDto.email);
      
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email.toLowerCase() }
      });

      if (!user) {
        this.logger.debug('User not found:', loginDto.email);
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.debug('Invalid password for user:', loginDto.email);
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (user.verificationStatus !== 'VERIFIED') {
        this.logger.debug('Unverified user attempting login:', loginDto.email);
        // Generate new OTP for unverified users
        await this.generateOTP({ email: user.email });
        
        throw new UnauthorizedException({
          success: false,
          message: 'Please verify your email first',
          isVerified: false,
          email: user.email
        });
      }

      const payload = { 
        sub: user.id, 
        email: user.email,
        verificationStatus: user.verificationStatus
      };
      
      const token = await this.jwtService.signAsync(payload);
      this.logger.debug('Login successful for user:', loginDto.email);

      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Login successful',
        token,
        user: userWithoutPassword
      };

    } catch (error) {
      this.logger.error('Login failed:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }

  async logout(userId: number) {
    try {
      // You could implement token blacklisting here if needed
      // For now, we'll just return a success response
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new BadRequestException({
        success: false,
        message: error.message || 'Logout failed'
      });
    }
  }
}
