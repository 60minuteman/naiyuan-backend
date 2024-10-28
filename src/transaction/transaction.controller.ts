import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getUserTransactions(@Request() req) {
    return this.transactionService.getUserTransactions(req.user.id);
  }

  @Get(':reference')
  async getTransactionDetails(@Param('reference') reference: string) {
    return this.transactionService.getTransactionDetails(reference);
  }
}
