import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class VirtualAccountService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService
  ) {}

  async createVirtualAccount(paymentDetails: {
    amount: number;
    currency: string;
    description?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    paymentType?: string;
  }) {
    console.log('Received request to create virtual account:', paymentDetails);

    if (!paymentDetails.customerEmail) {
      throw new BadRequestException('Customer email is required');
    }

    try {
      // Find the user by email
      const user = await this.prisma.user.findUnique({
        where: {
          email: paymentDetails.customerEmail
        }
      });

      if (!user) {
        throw new NotFoundException(`User with email ${paymentDetails.customerEmail} not found`);
      }

      console.log('Creating virtual account for user:', user.id);

      // Generate a unique reference
      const reference = `VA_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Create bank transfer checkout
      const checkoutDetails = {
        email: paymentDetails.customerEmail,
        amount: paymentDetails.amount.toString(),
        currency: paymentDetails.currency,
        reference: reference,
        name: paymentDetails.customerName || user.firstName || 'Customer',
      };

      console.log('Sending checkout details to PaymentsService:', checkoutDetails);

      const checkoutResponse = await this.paymentsService.createBankTransferCheckout(checkoutDetails);

      console.log('Received checkout response:', checkoutResponse);

      if (!checkoutResponse || !checkoutResponse.status) {
        throw new InternalServerErrorException(`Invalid checkout response: ${JSON.stringify(checkoutResponse)}`);
      }

      const accountDetails = checkoutResponse.data;

      // Create virtual account
      const virtualAccount = await this.prisma.virtualAccount.create({
        data: {
          reference: reference,
          accountNumber: accountDetails.account_number,
          accountName: accountDetails.account_name,
          bankName: accountDetails.bank_name,
          currency: paymentDetails.currency,
          amount: parseFloat(paymentDetails.amount.toString()),
          status: 'active',
          paymentType: paymentDetails.paymentType || 'default',
          description: paymentDetails.description,
          user: {
            connect: { id: user.id }
          }
        },
      });

      console.log('Virtual account created:', virtualAccount);

      return virtualAccount;
    } catch (error) {
      console.error('Error creating virtual account:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to create virtual account: ${error.message}`);
    }
  }

  async getVirtualAccount(userId: number) {
    const virtualAccount = await this.prisma.virtualAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!virtualAccount) {
      throw new NotFoundException('Virtual account not found');
    }

    return virtualAccount;
  }

  async getVirtualAccountByReference(reference: string) {
    const virtualAccount = await this.prisma.virtualAccount.findUnique({
      where: { reference },
      include: { user: true }, // Include user details if needed
    });

    if (!virtualAccount) {
      throw new NotFoundException(`Virtual account with reference ${reference} not found`);
    }

    return virtualAccount;
  }

  async getVirtualAccountByAccountNumber(accountNumber: string) {
    const virtualAccount = await this.prisma.virtualAccount.findFirst({
      where: { accountNumber },
      include: { user: true }, // Include user details if needed
    });

    if (!virtualAccount) {
      throw new NotFoundException(`Virtual account with account number ${accountNumber} not found`);
    }

    return virtualAccount;
  }
}
