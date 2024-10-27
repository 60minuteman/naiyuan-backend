import { Module } from '@nestjs/common';
import { VirtualAccountController } from './virtual-account.controller';
import { VirtualAccountService } from './virtual-account.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [VirtualAccountController],
  providers: [VirtualAccountService],
  exports: [VirtualAccountService]
})
export class VirtualAccountModule {}
