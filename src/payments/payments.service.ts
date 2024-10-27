import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly budpayApiUrl: string;
  private readonly budpaySecretKey: string;

  constructor(private configService: ConfigService) {
    this.budpayApiUrl = this.configService.get<string>('BUDPAY_API_URL');
    this.budpaySecretKey = this.configService.get<string>('BUDPAY_SECRET_KEY');
    
    if (!this.budpaySecretKey) {
      console.error('BudPay secret key is not set correctly');
      throw new Error('BudPay secret key is not configured');
    }
  }

  async createBankTransferCheckout(checkoutDetails: {
    email: string;
    amount: string;
    currency: string;
    reference: string;
    name: string;
  }) {
    try {
      console.log('Creating bank transfer checkout with details:', checkoutDetails);
      console.log('BudPay API URL:', this.budpayApiUrl);
      
      const response = await axios.post(
        `${this.budpayApiUrl}/banktransfer/initialize`,
        checkoutDetails,
        {
          headers: {
            Authorization: `Bearer ${this.budpaySecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('BudPay bank transfer checkout response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating bank transfer checkout with BudPay:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          console.error('BudPay API response:', axiosError.response.data);
          throw new InternalServerErrorException(`BudPay API error: ${JSON.stringify(axiosError.response.data)}`);
        } else if (axiosError.request) {
          console.error('No response received from BudPay API');
          throw new InternalServerErrorException('No response received from BudPay API');
        } else {
          console.error('Error setting up the request:', axiosError.message);
          throw new InternalServerErrorException(`Error setting up the request: ${axiosError.message}`);
        }
      } else {
        console.error('Unexpected error:', error);
        throw new InternalServerErrorException(`An unexpected error occurred while creating bank transfer checkout: ${error.message}`);
      }
    }
  }
}
