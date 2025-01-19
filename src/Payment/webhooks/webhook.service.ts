// import { Injectable } from '@nestjs/common';
// import { createHmac } from 'crypto';
// import { PlannerRepository } from 'src/User/Planner/infrastructure/persistence/planner-repository';
// import { PaystackService } from '../paystack/paystack.service';
// import { NotificationsService } from 'src/utils/services/notifications.service';

// interface PaystackEventData {
//   event: string;
//   data: {
//     reference: string;
//     status: string;
//     metadata: {
//       type: string;
//       customer_fields: {
//         fullname: string;
//         phone: string;
//       };
//       event_details?: {
//         startDate: string;
//         endDate: string;
//       };
//     };
//     customer: {
//       email: string;
//     };
//   };
// }

// @Injectable()
// export class PaystackWebhookService {
//   constructor(
//     private readonly plannerRepository: PlannerRepository,
//     private readonly paystackService: PaystackService,
//     private readonly notificationsService: NotificationsService,
//   ) {}

//   private verifyWebhookSignature(signature: string, payload: string): boolean {
//     const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
//       .update(payload)
//       .digest('hex');
//     return hash === signature;
//   }

//   async handleWebhook(
//     signature: string,
//     payload: string,
//     rawData: PaystackEventData,
//   ): Promise<void> {
//     // Verify webhook signature
//     if (!this.verifyWebhookSignature(signature, payload)) {
//       throw new Error('Invalid webhook signature');
//     }

//     const { event, data } = rawData;

//     // Handle different webhook events
//     switch (event) {
//       case 'charge.success':
//         await this.handleSuccessfulCharge(data);
//         break;

//       case 'transfer.success':
//         await this.handleSuccessfulTransfer(data);
//         break;

//       // Add more event handlers as needed
//     }
//   }

//   private async handleSuccessfulCharge(
//     data: PaystackEventData['data'],
//   ): Promise<void> {
//     // Only process pay-per-event payments
//     if (data.metadata?.type !== 'pay_per_event') {
//       return;
//     }

//     try {
//       // Verify the transaction
//       const verificationResponse = await this.paystackService.verifyTransaction(
//         data.reference,
//       );

//       if (!verificationResponse.data.status) {
//         throw new Error('Transaction verification failed');
//       }

//       // Find the planner by email
//       const planner = await this.plannerRepository.findbyEmail(
//         data.customer.email,
//       );

//       if (!planner) {
//         throw new Error('Planner not found');
//       }

//       // Get event dates from metadata
//       const startDate = data.metadata.event_details?.startDate
//         ? new Date(data.metadata.event_details.startDate)
//         : new Date();

//       const endDate = data.metadata.event_details?.endDate
//         ? new Date(data.metadata.event_details.endDate)
//         : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days if not specified

//       // Update planner with temporary permissions
//       await this.plannerRepository.update(planner.id, {
//         tempPermissions: true,
//         tempPermissionsEndsAt: endDate,
//       });

//       // Send notification
//       await this.notificationsService.create({
//         subject: 'Event Payment Successful',
//         message: `Your payment was successful. You now have premium access for your event from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
//         account: planner.plannerID,
//       });
//     } catch (error) {
//       // Log error and notify admin
//       console.error('Error processing pay-per-event payment:', error);
//       await this.notificationsService.create({
//         subject: 'Payment Processing Error',
//         message: `Error processing payment for reference: ${data.reference}. Error: ${error.message}`,
//         account: 'admin', // Send to admin account
//       });
//     }
//   }

//   private async handleSuccessfulTransfer(
//     data: PaystackEventData['data'],
//   ): Promise<void> {
//     // Handle transfer success if needed
//     // This could be used for refunds or other transfer-related functionality
//   }
// }
