import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
      
      // Test database connection with proper BigInt handling
      const result = await this.$queryRaw`SELECT COUNT(*)::integer as count FROM "User"`;
      this.logger.log(`Connected to database. User count: ${result[0].count}`);
    } catch (error) {
      this.logger.error('Database connection failed:', {
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
