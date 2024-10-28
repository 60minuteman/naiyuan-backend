import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async getUserTransactions(userId: number) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        amount: true,
        time: true,
        status: true,
        recipient: true,
        sender: true,
        description: true,
        paymentType: true,
        reference: true,
      },
    });

    return transactions.map(transaction => ({
      id: transaction.id.toString(),
      title: transaction.title,
      subtitle: this.getRelativeTime(transaction.time),
      amount: `₦${transaction.amount.toLocaleString()}`,
      time: transaction.time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      status: transaction.status,
      recipient: transaction.recipient,
      sender: transaction.sender,
      description: transaction.description,
      paymentType: transaction.paymentType,
    }));
  }

  async getTransactionDetails(reference: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      ...transaction,
      amount: `₦${transaction.amount.toLocaleString()}`,
      time: transaction.time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      date: transaction.time.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  }
}
