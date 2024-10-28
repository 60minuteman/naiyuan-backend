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
      
      // Test query
      const userCount = await this.$queryRaw`SELECT COUNT(*) FROM "User"`;
      this.logger.log(`Database connection test: ${JSON.stringify(userCount)}`);
    } catch (error) {
      this.logger.error('Database connection failed:', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
