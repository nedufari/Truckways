import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaystackService } from '../paystack/paystack.service';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { OrderRepository } from 'src/Order/Infrastructure/Persistence/all-order-repositories';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { PaymentStatus } from 'src/Enums/order.enum';
import { WalletService } from 'src/Rider/wallet/wallet.service';

interface PaystackEventData {
  event: string;
  data: {
    reference: string;
    status: string;
    amount:number;
    metadata: {
      type: string;
      customer_fields: {
        fullname: string;
        phone: string;
      };
      order_details?: {
        orderID: string;
        id: number;
      };
    };
    customer: {
      email: string;
    };
  };
}

@Injectable()
export class PaystackWebhookService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paystackService: PaystackService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;
      const signature = req.headers['x-paystack-signature'];

      if (!signature || typeof signature !== 'string') {
        console.error('Missing or invalid Paystack signature');
        res.sendStatus(400);
        return;
      }

      const hash = crypto
        .createHmac(
          'sha512',
          this.configService.get<string>('PAYSTACK_TEST_SECRET'),
        )
        .update(JSON.stringify(body))
        .digest('hex');

      if (hash !== signature) {
        console.error('Invalid Paystack webhook signature');
        res.sendStatus(401);
        return;
      }

      const event = body as PaystackEventData;

      switch (event.event) {
        case 'charge.success':
          await this.handleOrderPayment(event.data, event.data.reference);
          break;
        case 'transfer.success':
          await this.handleWalletFunding(event.data);
          break;
        case 'withdrawal.success':
          await this.handleWithdrawalSuccess(event.data)
        default:
          console.log('Unsupported Paystack webhook event:', event.event);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error handling Paystack webhook:', error);
      // Don't expose internal errors to the client
      res.sendStatus(500);
    }
  }
  private async handleOrderPayment(
    data: PaystackEventData['data'],
    paymentReference: string,
  ): Promise<void> {
    // Only process pay-per-event payments
    if (data.metadata?.type !== 'truckways_order_delivery_payment') {
      console.log('Skipping non-delivery payment event');
      return;
    }

    try {
      // Verify the transaction
      const verificationResponse = await this.paystackService.verifyTransaction(
        data.reference,
      );

      if (!verificationResponse?.data?.status) {
        throw new Error(
          `Transaction verification failed for reference: ${data.reference}`,
        );
      }

      // Find the order
      const order = await this.orderRepository.findByID(paymentReference);

      if (!order) {
        throw new Error(`Order not found for reference: ${paymentReference}`);
      }

      // Update order status
      order.paymentStatus = PaymentStatus.SUCCESFUL;
      await this.orderRepository.save(order);

      // Send success notification to customer
      await this.notificationsService.create({
        subject: 'Order Payment Successful',
        message:
          'Your payment was successful and your order is being processed',
        account: order.customer.customerID,
      });
    } catch (error) {
      console.error('Error processing payment:', error);

      try {
        // Find the order again to get customer ID
        const order = await this.orderRepository.findByID(paymentReference);

        if (!order) {
          // Send error notification to customer
          await this.notificationsService.create({
            subject: 'Payment Processing Failed',
            message:
              'We encountered an issue processing your payment. Please contact our support team for assistance.',
            account: order.customer.customerID,
          });

          // Send detailed error notification to admin
          await this.notificationsService.create({
            subject: 'Payment Processing Error',
            message: `Error processing payment for reference: ${data.reference}. Customer ID: ${order.customer.customerID}. Error: ${error.message}`,
            account: 'admin',
          });
        } else {
          // If order not found, still notify admin
          await this.notificationsService.create({
            subject: 'Payment Processing Error',
            message: `Error processing payment for reference: ${data.reference}. Order not found. Error: ${error.message}`,
            account: 'admin',
          });
        }
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
      }

      // Re-throw the error to be handled by the main webhook handler
      throw error;
    }
  }

  private async handleWalletFunding(
    data: PaystackEventData['data'],
  ): Promise<void> {
    try {
      // Verify the transaction
      const verificationResponse = await this.paystackService.verifyTransaction(
        data.reference,
      );

      if (
        !verificationResponse?.data?.status
      ) {
        throw new Error(
          `Transaction verification failed for reference: ${data.reference}`,
        );
      }

      // Process the wallet funding
      const amountInNaira = data.amount / 100; // Convert from kobo to naira
      await this.walletService.processFundingSuccess(
        data.reference,
        amountInNaira,
      );
    } catch (error) {
      console.error('Error processing wallet funding:', error);
      // Send error notification to admin
      await this.notificationsService.create({
        subject: 'Wallet Funding Error',
        message: `Error processing wallet funding for reference: ${data.reference}. Error: ${error.message}`,
        account: 'admin',
      });
      throw error;
    }
  }

  private async handleWithdrawalSuccess(
    data: PaystackEventData['data'],
  ): Promise<void> {
    try {
      // Process the successful withdrawal
      await this.walletService.processWithdrawalSuccess(data.reference);
      await this.notificationsService.create({
        subject: 'Withdrawal Successful',
        message: ` withdrawal for reference: ${data.reference} was successful`,
        account: 'admin',
      });
      
    } catch (error) {
      console.error('Error processing withdrawal success:', error);
      // Send error notification to admin
      await this.notificationsService.create({
        subject: 'Withdrawal Processing Error',
        message: `Error processing withdrawal for reference: ${data.reference}. Error: ${error.message}`,
        account: 'admin',
      });
      throw error;
    }
  }
}
