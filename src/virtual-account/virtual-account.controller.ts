import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { VirtualAccountService } from './virtual-account.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('virtual-account')
@UseGuards(JwtAuthGuard)
export class VirtualAccountController {
  constructor(private readonly virtualAccountService: VirtualAccountService) {}

  @Post()
  async createVirtualAccount(@Body() paymentDetails: {
    amount: number;
    currency: string;
    description?: string;
    customerName?: string;
    customerEmail: string;
    customerPhone?: string;
    paymentType?: string;
  }) {
    return this.virtualAccountService.createVirtualAccount(paymentDetails);
  }
  @Get(':accountNumber')
  async getVirtualAccount(@Param('accountNumber') accountNumber: string) {
    console.log('Getting virtual account by account number:', accountNumber);
    return this.virtualAccountService.getVirtualAccountByAccountNumber(accountNumber);
  }

  @Get('by-reference/:reference')
  async getVirtualAccountByReference(@Param('reference') reference: string) {
    console.log('Getting virtual account by reference:', reference);
    return this.virtualAccountService.getVirtualAccountByReference(reference);
  }

  @Get('by-account-number/:accountNumber')
  async getVirtualAccountByAccountNumber(@Param('accountNumber') accountNumber: string) {
    console.log('Getting virtual account by account number:', accountNumber);
    return this.virtualAccountService.getVirtualAccountByAccountNumber(accountNumber);
  }
}
