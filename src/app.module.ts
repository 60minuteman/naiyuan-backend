import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { PaymentsModule } from './payments/payments.module';
import { VirtualAccountModule } from './virtual-account/virtual-account.module';
import { TransactionModule } from './transaction/transaction.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    EmailModule,
    PaymentsModule,
    VirtualAccountModule,
    TransactionModule,
    PushNotificationsModule,
  ],
})
export class AppModule {}
