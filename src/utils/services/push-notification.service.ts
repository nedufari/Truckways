// import {
//   Inject,
//   Injectable,
//   ServiceUnavailableException,
// } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { IsNull, Not, Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
// import { OrderEntity } from 'src/Order/Infrastructure/Persistence/Relational/Entity/order.entity';

import { ServiceUnavailableException } from "@nestjs/common";

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: 'ostra-3585a',
//     clientEmail: 'firebase-adminsdk-yhnql@ostra-3585a.iam.gserviceaccount.com',
//     privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAeV4ON+Q3eI3x\n8Vm7gsI7NMwrg+g24qWf8bZaaPMev0q5WCjTN6QO6O8gnnQA4cjZnzt+/Tc71nSN\n0j2AW+f+jBt6QsakCTyLC1FeRylwbsV0jAAM388I+axTFD7r0etJmZd1aqxurq+5\n0QAa+AYA5woRWNGj+BxWruaD6T5LWCWja78Vd3+N2B/9O2SIFlc7EblNJjhy+S9u\npzMemjmzkFC4UW59Pza/vrZDBCoCfPsVH0S/8XTQ7YlW313JpPHWO0bN0j7ku8BZ\nhx2cVxk2Tes0aIIfJWuR9EeRsoAUFRf4reX7GFbGnRD8w5CVf6bZQ1wQNDMJ4XIP\nBm7YXQkxAgMBAAECggEAITVvlH1xO17qAsoVJOSxNXztEz79lGazk+6k+2FrPS1d\nK7B5zsOlY0suYw7jzfkm6eFu5wCyhHkCgCu7n8d7tjAfV49o7YmIcCciQWV+0V7T\nY8H6Cj6dXpuRb34pQw/jjD3bY49ls+0g9asJXR3ZD1PNqWONPEDFRvGDZVQbgu0j\n/3AxaW6N8VbzmEcomkToaKDn4sPyZFoT9OM1P5QzVQ2GbQhUWZ0lC7d7ijUpX8AH\nxU+BCRxw2WHzzEl9sXT0JbHdPBT7ROJ34zkltRIxsrrKxlH/tIcmLy7ivN9jbZ0L\n7UrDzcaD27DidUesBiq2HhYkFjFMM00tBB1fcI5HyQKBgQD2mLCBkCagpll9DTj3\nUFAcWeUo9Y1AYDA0GuKFJ54Gkezjj3Ej/9MrOEgS3Y1Ro3+kbOt4IWTckcsU2FBk\nhUgpi7TL1IKCzp/Ne8/mvAwG3JeN/AQ7Da906sVOz8UbjHpv/iJpUYOMyr5GJS0N\nYXeSpUm0U5Gv1DvX4x6eHgY1fQKBgQDH0FPexSweJqxtUjoIZJnaFQYE6Sztm2UC\nMBhxompJuGCvREagLtnBDBZEFvHYeZUPFbR81Xw9AxY/gwAsYK551FKL0bK7FPjI\naXtg+zbZJCta/NqjW+GZjO5WNX1RlIJocZHKPKdZw8wWpd4u8QBAGzONfV7SY+FX\ncgBA+lNgxQKBgQCM/wDtE98CPBsuxUCtJ96mV0AQC1aYWGc3Y6fhOqXAW+92ra2j\nR8MWEzgikUscQr/Y4+4+4dkpxLK5WHWfBBYeqyLU6M02va3hb8mPxDWcNsTxCgfh\nPBH2Z8YpKeMpvUjEgCpszY7KEaJ5uQfpfrE/yAI8eQvz3QXaiqIXBlPGgQKBgQCE\nTXrbLG8T38OX9zQZzpLYhccghUyMX7I4CqSEyWfbPEw4gNrKwXrJijlMCG1GSurZ\nvCNv7OOAeoTGtPTubW3ZmS63Cbhwi2hXOxDInE4q5PoYGwih1frA80H0ryI1XEIk\n6d4ArLyagTynWliNeGIUEG7IJtUcNapFfmSQoa+HiQKBgDyBrluqbGhhKTGUykR1\nC+h3+4P9xCF6/hYYNjnQaNKnp9koSnx3qY+8EPyHHY2rw3fGFbbYrOtPM3TVZmhD\ndCwhADSn4TdAfM5dGZNrHKkIwJC2u6wGR0H30YUEXmLBtW/TMYuKbqhI3YDGXjbn\nn05Osy/mwS4uz7nwSyCe86YY\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n'),
//   }),
// });

// @Injectable()
// export class PushNotificationsService {
//   constructor(
//     @InjectRepository(RiderEntity)
//     private readonly riderRepository: Repository<RiderEntity>,
//   ) {}

//   async sendPushNotification(
//     token: string,
//     title: string,
//     body: string,
//     data?: any,
//   ): Promise<string> {
//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       token,
//       data,
//     };

//     try {
//       const response = await admin.messaging().send(message);
//       console.log('Successfully sent message:', response);
//       return response;
//     } catch (error) {
//       console.error('Error sending message:', error);
//       throw new ServiceUnavailableException(error);
//     }
//   }

//   async sendNotificationToAllRiders(
//     title: string,
//     body: string,
//     data?: any,
//   ): Promise<{ successful: number; failed: number }> {
//     try {
//       // Get all active riders with FCM tokens
//       const riders = await this.riderRepository.find({
//         where: { 
//           emailConfirmed: true,
//           isAprroved:true,
//           deviceToken: Not(IsNull()) 
//         },
//         select: ['riderID', 'deviceToken', 'name']
//       });

//       const tokens = riders.map(rider => rider.deviceToken).filter(Boolean);

//       if (tokens.length === 0) {
//         console.log('No active riders with valid FCM device tokens found');
//         return { successful: 0, failed: 0 };
//       }

//       // Prepare the message for multiple recipients
//       const message = {
//         notification: {
//           title,
//           body,
//         },
//         data,
//         tokens
//       };

//       try {
//         // Send to multiple devices
//         const response = await admin.messaging().sendEachForMulticast(message);
        
//         console.log('Multicast messages sent:', {
//           successful: response.successCount,
//           failed: response.failureCount
//         });

//         // Handle failed tokens if necessary
//         if (response.failureCount > 0) {
//           const failedTokens = [];
//           response.responses.forEach((resp, idx) => {
//             if (!resp.success) {
//               failedTokens.push({
//                 token: tokens[idx],
//                 error: resp.error
//               });
//             }
//           });
//           console.log('Failed tokens:', failedTokens);

         
//         }

//         return {
//           successful: response.successCount,
//           failed: response.failureCount
//         };
//       } catch (error) {
//         console.error('Error sending multicast messages:', error);
//         throw new ServiceUnavailableException(error);
//       }
//     } catch (error) {
//       console.error('Error in sendNotificationToAllRiders:', error);
//       throw new ServiceUnavailableException(error);
//     }
//   }



//   // Helper method to send new order notification to all riders
//   async notifyAllRidersOfNewOrder(order: OrderEntity): Promise<void> {
//     const title = 'New Order Available!';
//     const body = `New delivery order from ${order.items.map((add)=>add.pickup_address)} to ${order.items.map((add)=>add.dropoff_address)}`;
    
//     const data = {
//       orderID: order.orderID,
//       type: 'new_order',
//       initial_bid: order.items.map((add)=>add.initial_bid_value).toString(),
//       pickup: order.items.map((add)=>add.pickup_address),
//       dropoff: order.items.map((add)=>add.dropoff_address),
//       timestamp: new Date().toISOString()
//     };

//     try {
//       const result = await this.sendNotificationToAllRiders(title, body, data);
//       console.log('New order notification sent to riders:', result);
//     } catch (error) {
//       console.error('Failed to notify riders of new order:', error);
//       // Don't throw here to prevent order creation from failing
//     }
//   }


// async sendNotificationToTargetUsers(
//     tokens: string[],
//     title: string,
//     body: string,
//     data?: any,
//   ): Promise<{ successful: number; failed: number }> {
//     try {
//       if (tokens.length === 0) {
//         console.log('No valid FCM device tokens provided');
//         return { successful: 0, failed: 0 };
//       }

//       // Prepare the message for multiple recipients
//       const message = {
//         notification: {
//           title,
//           body,
//         },
//         data,
//         tokens
//       };

//       try {
//         // Send to multiple devices
//         const response = await admin.messaging().sendEachForMulticast(message);
        
//         console.log('Multicast messages sent:', {
//           successful: response.successCount,
//           failed: response.failureCount
//         });

//         // Handle failed tokens if necessary
//         if (response.failureCount > 0) {
//           const failedTokens = [];
//           response.responses.forEach((resp, idx) => {
//             if (!resp.success) {
//               failedTokens.push({
//                 token: tokens[idx],
//                 error: resp.error
//               });
//             }
//           });
//           console.log('Failed tokens:', failedTokens);
//         }

//         return {
//           successful: response.successCount,
//           failed: response.failureCount
//         };
//       } catch (error) {
//         console.error('Error sending multicast messages:', error);
//         throw new ServiceUnavailableException(error);
//       }
//     } catch (error) {
//       console.error('Error in sendNotificationToTargetUsers:', error);
//       throw new ServiceUnavailableException(error);
//     }
//   }
// }