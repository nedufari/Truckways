import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
 import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
 import { OrderEntity } from 'src/Order/Infrastructure/Persistence/Relational/Entity/order.entity';



// // Initialize Firebase Admin SDK

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "trucky-948cd",
    clientEmail: "firebase-adminsdk-3qqpw@trucky-948cd.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjb4+/8qLuT8CD\nY93EL9YkLaYJTr+tOKtF56HLpupKeEWZl93y2VaFTLw8HPHeGXKWCq2KAeIgYoYL\n/bXDbsqXv1zLHC+wzohDBqPttcqNa/9XIwKWWS85uZr9UeHmUyigbtyvovUh0kfk\nZpJ7U/85ZA6N5LtJBbz7DZNgoEg43hx8DTXHXcEWpiW1JGXz54Z/Fa7ifuMGKWmV\nf+7DeoZcAoNxF5XApKMM5Mw07zPR5Dnx8j1SGOCy34aDH8JsatbN/62MaF1E3r5d\nYUTC9mS8yGJTTRoIwHtUOagzhl7gE4qqMGWhrcSWFyHw700bCjRYuujZmTlxGQK4\nZYS/Fo85AgMBAAECggEAUaVETzQjv+CYgCrOGRl6pUUmqoSsDZl/OmNOOQIQDhbK\nUkIDTzPS3LGqYW9mRrk4vIrmCckKEXqWk3vxpwl8bNVcwly42F88xBsXnoNQBlk6\nzGmBe+FezbwSmNUkgF7vr0Hivl0uj3BQmOHC8JhUKnP5L1piU0bqExLDmqRHoBxL\n8WezIjdvrh/w+EXVwUAp0d0SRd36pwZ5uQENGtkn+prV7furuCm5tPcmFVHG2r6N\nR3l3Mk9HdWFAM15UexwHLUkFUHtD5NeHRH/wQEYxRdIC0JeRwhNuDBjts0/uv4Jc\nRpDOALCb2FivkfnjpD0rpBE+LtwcfXYxTv3MollzlwKBgQDi0OkWvAVAsaIFu5Rj\nqCrlJFQMI4NTUDU+heNfZ8rp+/uNxlUgPpsbZq/03Y/4JHAWfoJNhdw/eKD12MQH\nEAAipEHY+XBNtRJzLsHKOCtpzbxQVn2n/pJEn8ybSlF0kuGIvCGuUuvHmHLBgz+C\nvipkbAo5y5A/I5xAW4ZT7BMrZwKBgQC4dvg4MRzFTTyWW340RrGrxgW8ot7MRG2i\nnEVUt9Sa9TCK21cTMXq0G7lLvFn/KfAK/fBJCI4b1TmnaS8ovOQqon5SO/GGWwiz\nacY8q5dlWrd54bymJ35dTfdJGCAYi5uv4/BNZi/7aWFNqS8eeljAF7B9gsxjHK2G\nrjcWJMZsXwKBgDFLG80wEagssryyNp6t9pyUF5wHv8vEe73Z1T9vzD6r39DBENEQ\nKh97YrRBzr8sFBwfZGw6slItAjZL5NZwGMdukUz5cPnCZ38W41DygiTdbJa9JVP0\nVI+LdyksrqU6Ir/Xuy4qoUlgjVgXER91+rqWbGaBIhlGwPePrJLilIvzAoGAcVlx\nl53eLwMR+taHy3mxTXsmJU7zlxNpRyW9mJxJgVqvFHRJolqiKrBqgTZhGuFbRnXa\nRBaEtGemwM9qkh7YGba15rQ86rFfvFd/3+IU6sv+uF9U+8iC5rS1Am5Xsp1+8msf\nS4BCdbvAdedDM/g8NvWXlthb3X9OxdahtPKuFwMCgYEAqZ/5ftLjfGxHvNchhz6J\nZEdcODjmTsIO38QZ2bYBMG3b1luvLzP64BiiaaYI355X5AO5Y/+Ra8sib96dqnVF\ntUJvAJS8q8b5TQIJBgH9etuDDMkIKKILbphr8G41Qv4V2qQqAP9foojIQ1D0N8Fb\nT1/kZJVQAiNw/J7sFeumoEQ=\n-----END PRIVATE KEY-----\n"
    .replace(/\\n/g, '\n'),
  }),
});

@Injectable()
export class PushNotificationsService {
  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepository: Repository<RiderEntity>,
  ) {}

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<string> {
    const message = {
      notification: {
        title,
        body,
      },
      token,
      data,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new ServiceUnavailableException(error);
    }
  }

  async sendNotificationToAllRiders(
    title: string,
    body: string,
    data?: any,
  ): Promise<{ successful: number; failed: number }> {
    try {
      // Get all active riders with FCM tokens
      const riders = await this.riderRepository.find({
        where: { 
          emailConfirmed: true,
          isAprroved:true,
          deviceToken: Not(IsNull()) 
        },
        select: ['riderID', 'deviceToken', 'name']
      });

      const tokens = riders.map(rider => rider.deviceToken).filter(Boolean);

      if (tokens.length === 0) {
        console.log('No active riders with valid FCM device tokens found');
        return { successful: 0, failed: 0 };
      }

      // Prepare the message for multiple recipients
      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens
      };

      try {
        // Send to multiple devices
        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log('Multicast messages sent:', {
          successful: response.successCount,
          failed: response.failureCount
        });

        // Handle failed tokens if necessary
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push({
                token: tokens[idx],
                error: resp.error
              });
            }
          });
          console.log('Failed tokens:', failedTokens);

         
        }

        return {
          successful: response.successCount,
          failed: response.failureCount
        };
      } catch (error) {
        console.error('Error sending multicast messages:', error);
        throw new ServiceUnavailableException(error);
      }
    } catch (error) {
      console.error('Error in sendNotificationToAllRiders:', error);
      throw new ServiceUnavailableException(error);
    }
  }



  // Helper method to send new order notification to all riders
  async notifyAllRidersOfNewOrder(order: OrderEntity): Promise<void> {
    const title = 'New Order Available!';
    const body = `New delivery order from ${order.items.map((add)=>add.pickup_address)} to ${order.items.map((add)=>add.dropoff_address)}`;
    
    const data = {
      orderID: order.orderID,
      type: 'new_order',
      initial_bid: order.items.map((add)=>add.initial_bid_value).toString(),
      pickup: order.items.map((add)=>add.pickup_address),
      dropoff: order.items.map((add)=>add.dropoff_address),
      timestamp: new Date().toISOString()
    };

    try {
      const result = await this.sendNotificationToAllRiders(title, body, data);
      console.log('New order notification sent to riders:', result);
    } catch (error) {
      console.error('Failed to notify riders of new order:', error);
      // Don't throw here to prevent order creation from failing
    }
  }


async sendNotificationToTargetUsers(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<{ successful: number; failed: number }> {
    try {
      if (tokens.length === 0) {
        console.log('No valid FCM device tokens provided');
        return { successful: 0, failed: 0 };
      }

      // Prepare the message for multiple recipients
      const message = {
        notification: {
          title,
          body,
        },
        data,
        tokens
      };

      try {
        // Send to multiple devices
        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log('Multicast messages sent:', {
          successful: response.successCount,
          failed: response.failureCount
        });

        // Handle failed tokens if necessary
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push({
                token: tokens[idx],
                error: resp.error
              });
            }
          });
          console.log('Failed tokens:', failedTokens);
        }

        return {
          successful: response.successCount,
          failed: response.failureCount
        };
      } catch (error) {
        console.error('Error sending multicast messages:', error);
        throw new ServiceUnavailableException(error);
      }
    } catch (error) {
      console.error('Error in sendNotificationToTargetUsers:', error);
      throw new ServiceUnavailableException(error);
    }
  }
}