import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import { CustomerRepository } from './Infrastructure/Persistence/customer-repository';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { CustomerEntity } from './Infrastructure/Persistence/Relational/Entity/customer.entity';
import { NotificationListResponse } from 'src/utils/Types/notification.responsetypes';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { markMultipleNotificationsAsReadDto } from 'src/utils/shared-dto/notification.dto';
import { Customer } from './Domain/customer';
import { updateCustomerDto } from './Dto/update-customer.dto';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import {
  BidRepository,
  OrderCartRepository,
  OrderRepository,
} from 'src/Order/Infrastructure/Persistence/all-order-repositories';
import { OrderCart } from 'src/Order/Domain/order-cart';
import { PaginationDto } from 'src/utils/shared-dto/pagination.dto';
import { Bid } from 'src/Order/Domain/bids';
import { BidActionDto } from '../utils/shared-dto/bid-action.dto';
import {
  BidAction,
  BidActionResult,
  BidStatus,
  BidTypeAccepted,
  RideStatus,
} from 'src/Enums/order.enum';
import { BidEntity } from 'src/Order/Infrastructure/Persistence/Relational/Entity/bids.entity';
import { Order } from 'src/Order/Domain/order';
import { EventsGateway } from 'src/utils/gateway/websocket.gateway';
import { RidesRepository } from 'src/Rider/Infrastructure/Persistence/rider-repository';
import { GeneratorService } from 'src/utils/services/generator.service';
//import { PushNotificationsService } from 'src/utils/services/push-notification.service';
@Injectable()
export class CustomerService {
  constructor(
    private customerRepo: CustomerRepository,
    private BidRepository: BidRepository,
    private responseService: ResponseService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
    private geolocationService: GeoLocationService,
    private cartRepository: OrderCartRepository,
    private orderRepository: OrderRepository,
    private readonly eventsGateway: EventsGateway,
    private ridesRepo:RidesRepository,
    private generatorService: GeneratorService
    //private readonly pushNotificationService:PushNotificationsService,
  ) {}

  async fetchAllNotifications(
    customer: CustomerEntity,
    query?: { page?: number; limit?: number },
  ): Promise<StandardResponse<NotificationListResponse>> {
    try {
      if (!customer?.customerID) {
        return this.responseService.badRequest('Invalid customer ID provided');
      }

      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 10;

      const { notifications, count, unreadCount } =
        await this.notificationsService.fetchAll(customer.customerID, {
          page,
          limit,
        });

      const totalPages = Math.ceil(count / limit);

      const response: NotificationListResponse = {
        data: notifications,
        count,
        unreadCount,
        currentPage: page,
        totalPages,
      };

      return this.responseService.success(
        notifications.length
          ? 'Notifications retrieved successfully'
          : 'No notifications found for this customer',
        response,
      );
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';

      // Log the error for debugging
      console.error('Notification fetch error:', {
        planner: customer.customerID,
        error: errorMessage,
        stack: error?.stack,
      });

      return this.responseService.internalServerError(
        'Error while fetching notifications',
        errorMessage,
      );
    }
  }

  async markNotificationAsRead(
    customer: CustomerEntity,
    notificationId: string,
  ): Promise<StandardResponse<NotificationsEntity>> {
    try {
      if (!customer?.customerID) {
        return this.responseService.badRequest('Invalid customer ID provided');
      }

      const updatedNotification = await this.notificationsService.markAsRead(
        notificationId,
        customer.customerID,
      );

      return this.responseService.success(
        'Notification marked as read successfully',
        updatedNotification,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.responseService.notFound(error.message);
      }

      console.error('Error marking notification as read:', {
        customer: customer.customerID,
        notificationId,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking notification as read',
        error.message,
      );
    }
  }

  async markMultipleNotificationsAsRead(
    customer: CustomerEntity,
    dto: markMultipleNotificationsAsReadDto,
  ): Promise<StandardResponse<void>> {
    try {
      if (!customer?.customerID) {
        return this.responseService.badRequest('Invalid customer ID provided');
      }

      if (
        !Array.isArray(dto.notificationIds) ||
        dto.notificationIds.length === 0
      ) {
        return this.responseService.badRequest(
          'Please provide valid notification IDs',
        );
      }

      await this.notificationsService.markMultipleAsRead(
        dto.notificationIds,
        customer.customerID,
      );

      return this.responseService.success(
        'Notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking multiple notifications as read:', {
        customer: customer.customerID,
        dto,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking notifications as read',
        error.message,
      );
    }
  }

  async markAllNotificationsAsRead(
    customer: CustomerEntity,
  ): Promise<StandardResponse<void>> {
    try {
      if (!customer?.customerID) {
        return this.responseService.badRequest('Invalid customerID provided');
      }

      await this.notificationsService.markAllAsRead(customer.customerID);

      return this.responseService.success(
        'All notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', {
        customer: customer.customerID,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking all notifications as read',
        error.message,
      );
    }
  }

  async UpdateCustomer(
    customer: CustomerEntity,
    dto: updateCustomerDto,
  ): Promise<StandardResponse<Customer>> {
    try {
      // Create a copy of the customer without the address first
      const { address: _, ...customerWithoutAddress } = customer;

      // Create base update object
      const updateObject: any = {
        ...customerWithoutAddress,
        ...dto,
        updatedAT: new Date(),
      };

      // Handle email check
      if (dto.email) {
        const checkemail = await this.customerRepo.findByEmail(dto.email);
        if (checkemail && checkemail.id !== customer.id) {
          return this.responseService.badRequest('email already exists');
        }
      }

      // Handle address update
      if (dto.address) {
        try {
          const addressCoordinates =
            await this.geolocationService.getYahooCoordinates(dto.address);
          updateObject.address = {
            address: dto.address,
            lat: addressCoordinates.lat,
            lon: addressCoordinates.lon,
          };
        } catch (error) {
          console.error(error);
          return this.responseService.badRequest('Failed to geocode address');
        }
      } else if (customer.address) {
        // Keep existing address if no new address provided
        updateObject.address = customer.address;
      }

      // Perform the update
      await this.customerRepo.update(customer.id, updateObject);

      // Fetch the updated customer to return the latest data
      const updatedCustomer = await this.customerRepo.findByID(customer.id);

      // Save notification
      await this.notificationsService.create({
        message: `${updatedCustomer.name} has updated their record.`,
        subject: 'Account Updated',
        account: updatedCustomer.customerID,
      });

      return this.responseService.success(
        'customer record updated successfully',
        updatedCustomer,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error updating user record',
        error.message,
      );
    }
  }

  async uploadUserProfilePics(
    customer: CustomerEntity,
    mediafile: Express.Multer.File,
  ): Promise<StandardResponse<Customer>> {
    try {
      const display_pics = await this.cloudinaryService.uploadFile(mediafile);
      const mediaurl = display_pics.secure_url;

      customer.profilePicture = mediaurl;

      await this.customerRepo.update(customer.id, customer);

      await this.notificationsService.create({
        message: ` ${customer.name},  has uploaded profile pics .`,
        subject: 'Account Updated',
        account: customer.customerID, //saves when the user is created
      });

      return this.responseService.success('profile pics updated', customer);
    } catch (error) {
      return this.responseService.internalServerError(
        'Error uploading profile pics',
        error.message,
      );
    }
  }

  async fetchMyCart(
    customer: CustomerEntity,
  ): Promise<StandardResponse<OrderCart>> {
    try {
      const cart = await this.cartRepository.findByCustomer(
        customer.customerID,
      );
      if (!cart) return this.responseService.notFound('cart not found');

      return this.responseService.success('cart retrived successfully', cart);
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error fetching cart',
        error.message,
      );
    }
  }

  // fetch all bids
  async FetchallbidsForcustomer(
    customer: CustomerEntity,
    dto: PaginationDto,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    try {
      const { data: bids, total } = await this.BidRepository.fetchALLCustomer(
        dto,
        customer.customerID,
      );

      return this.responseService.success(
        bids.length ? 'Bids retrived successfully' : 'No bids yet',
        {
          data: bids,
          total,
          currentPage: dto.page,
          pageSize: dto.limit,
        },
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error fetching bids',
        error.message,
      );
    }
  }

  //fetch one bid by id
  async FetchOneBid(
    customer: CustomerEntity,
    bidId: string,
  ): Promise<StandardResponse<Bid>> {
    try {
      const bid = await this.BidRepository.findByIDForCustomer(
        bidId,
        customer.customerID,
      );
      if (!bid) return this.responseService.notFound('Bid not found');

      return this.responseService.success(
        'single bid retrieved successfully',
        bid,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one bid',
        error.message,
      );
    }
  }

  //biding action

  async CustomerAcceptOrDeclineBid(
    customer: CustomerEntity,
    bidId: string,
    dto: BidActionDto,
  ): Promise<StandardResponse<BidActionResult>> {
    try {
      const bid = await this.BidRepository.findByIDForCustomer(
        bidId,
        customer.customerID,
      );

      if (!bid) {
        return this.responseService.notFound('Bid not found');
      }

      if (bid.bidStatus !== BidStatus.COUNTERED) {
        return this.responseService.badRequest(
          'Your initial bid must be countered first by a Rider before you can take any action',
        );
      }

      const action = dto.doYouAccept ? BidAction.ACCEPT : BidAction.DECLINE;

      //start websocket conversation between customer and rider 
      this.eventsGateway.startconversation(
        bid.order.orderID,
        bid.rider.riderID,
        customer.customerID
      )

      const result = await this.processBidAction(action, bid, customer);

      return this.responseService.success(result.message, {
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error('CustomerAcceptOrDeclineBid error:', error);
      return this.responseService.internalServerError(
        'Error performing bid action',
        error.message,
      );
    }
  }

  private async processBidAction(
    action: BidAction,
    bid: BidEntity,
    customer: CustomerEntity,
  ): Promise<BidActionResult> {
    const actions = {
      [BidAction.ACCEPT]: async (): Promise<BidActionResult> => {
        await this.BidRepository.update(bid.id, {
          bidStatus: BidStatus.BID_ACCEPTED,
          bidTypeAccepted: BidTypeAccepted.COUNTER,
          acceptedAT: new Date(),
        });
        //update the rorder with rider and the value
        const order = await this.orderRepository.findByID(bid.order.orderID);
        order.accepted_bid = bid.counteredBid_value;
        order.Rider = bid.rider;
        await this.orderRepository.save(order);

         //create a ride 
         const ridesID = `TrkRd${await this.generatorService.generateUserID()}`;
         await this.ridesRepo.create({
           id: 0,
           ridesID:ridesID,
           milestone: undefined,
           status: RideStatus.PENDING,
           rider: order.Rider,
           order: order,
           checkpointStatus: undefined,
           at_dropoff_locationAT: undefined,
           at_pickup_locationAT: undefined,
           enroute_to_dropoff_locationAT: undefined,
           enroute_to_pickup_locationAT: undefined,
           dropped_off_parcelAT: undefined,
           reason_for_cancelling_ride: '',
           isCancelled: false,
           cancelledAt: undefined,
           picked_up_parcelAT: undefined
         })
 

        //emit websocket for accepted counter bid 
        this.eventsGateway.emitToconversation(
          bid.order.orderID,
          'acceptCounterBid',
          {
            orderId:bid.order.orderID,
            bidStatus:true,
            acceptedAmount:bid.counteredBid_value,
            timestamp: new Date().getTime()
          }

        )

        await this.notificationsService.create({
          message: ` ${bid.rider.name},  has accepted a bid placed by ${bid.order.customer.name} .`,
          subject: 'Bid Accepted',
          account: bid.rider.riderID,
        });

        await this.notificationsService.create({
          message: ` ${bid.rider.name},  has declined your bid for order ${bid.order.orderID} .`,
          subject: 'Bid Accepted',
          account: customer.customerID,
        });

        //push notification
        // this.pushNotificationService.sendPushNotification(
        //   bid.rider.deviceToken,
        //   'Bid Accepted',
        //   'counter bid accepted'
        // )

        

        return {
          success: true,
          message:
            'Bid accepted successfully, please proceed to making payment',
        };
      },

      [BidAction.DECLINE]: async (): Promise<BidActionResult> => {
        await this.BidRepository.update(bid.id, {
          bidStatus: BidStatus.BID_DECLINED,
          bidTypeAccepted: BidTypeAccepted.COUNTER,
          declinedAT: new Date(),
          rider: null,
        });


         // Emit WebSocket event for declined counter bid
         this.eventsGateway.emitToconversation(
          bid.order.orderID,
          'declineCounterBid',
          {
            orderId: bid.order.orderID,
            bidstatus: false,
            timestamp: new Date().getTime(),
          }
        );


        await this.notificationsService.create({
          message: ` ${bid.rider.name},  has declined a bid placed by ${bid.order.customer.name}.`,
          subject: 'Bid Declined',
          account: bid.rider.riderID,
        });

        await this.notificationsService.create({
          message: ` ${bid.rider.name},  has declined your bid for order ${bid.order.orderID} .`,
          subject: 'Bid Declined',
          account: customer.customerID,
        });

        
         //push notification
        //  this.pushNotificationService.sendPushNotification(
        //   bid.rider.deviceToken,
        //   'Bid Declined',
        //   'counter bid declined'
        // )

      
        return {
          success: true,
          message: 'Bid declined successfully, please see other offers',
        };
      },
    };

    return actions[action]();
  }

  async FetchAllMyOrders(
    dto: PaginationDto,
    customer: CustomerEntity,
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.orderRepository.findAllRelatedToCustomer(
          customer.customerID,
          dto,
        );

      return this.responseService.success(
        orders.length ? 'Orders retrived successfully' : 'No orders yet',
        {
          data: orders,
          total,
          currentPage: dto.page,
          pageSize: dto.limit,
        },
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async FetchOneOrder(
    orderID: string,
  ): Promise<StandardResponse<Order>> {
    try {
      const order = await this.orderRepository.findByID(
        orderID,
      );
      if (!order) return this.responseService.notFound('Order not found');

      return this.responseService.success(
        'single order retrieved successfully',
        order,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one order',
        error.message,
      );
    }
  }
}
