import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import { AdminRepository } from './Infrastructure/Persistence/admin-repository';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { AdminEntity } from './Infrastructure/Persistence/Relational/Entity/admin.entity';
import { NotificationListResponse } from 'src/utils/Types/notification.responsetypes';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { markMultipleNotificationsAsReadDto } from 'src/utils/shared-dto/notification.dto';
import { Admin } from './Domain/admin';
import { updateAdminDto } from './Dto/update-admin.dto';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import {
  BidRepository,
  OrderCartRepository,
  OrderRepository,
} from 'src/Order/Infrastructure/Persistence/all-order-repositories';
import { OrderCart } from 'src/Order/Domain/order-cart';
import { PaginationDto, SearchDto } from 'src/utils/shared-dto/pagination.dto';
import { Bid } from 'src/Order/Domain/bids';
import { BidActionDto } from '../utils/shared-dto/bid-action.dto';
import {
  BidAction,
  BidActionResult,
  BidStatus,
  BidTypeAccepted,
} from 'src/Enums/order.enum';
import { BidEntity } from 'src/Order/Infrastructure/Persistence/Relational/Entity/bids.entity';
import { Order } from 'src/Order/Domain/order';
import { EventsGateway } from 'src/utils/gateway/websocket.gateway';
import { Customer } from 'src/Customer/Domain/customer';
import { CustomerRepository } from 'src/Customer/Infrastructure/Persistence/customer-repository';
import { RiderRepository, TransactionRepository, VehicleRepository } from 'src/Rider/Infrastructure/Persistence/rider-repository';
import { Rider } from 'src/Rider/Domain/rider';
import { Transactions } from 'src/Rider/Domain/transaction';

//import { PushNotificationsService } from 'src/utils/services/push-notification.service';
@Injectable()
export class AdminService {
  constructor(
    private adminRepo: AdminRepository,
    private BidRepository: BidRepository,
    private responseService: ResponseService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
    private geolocationService: GeoLocationService,
    private customerRepo: CustomerRepository,
    private riderRepo:RiderRepository,
    private vehicleRepo:VehicleRepository,
    private transactionRepo:TransactionRepository,
    private orderRepository: OrderRepository,
    private bidRepository:BidRepository,
    private readonly eventsGateway: EventsGateway,
    //private readonly pushNotificationService:PushNotificationsService,
  ) {}

  async fetchAllNotifications(
    admin: AdminEntity,
    query?: { page?: number; limit?: number },
  ): Promise<StandardResponse<NotificationListResponse>> {
    try {
      if (!admin?.adminID) {
        return this.responseService.badRequest('Invalid admin ID provided');
      }

      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 10;

      const { notifications, count, unreadCount } =
        await this.notificationsService.fetchAllAdmin({
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
    admin: AdminEntity,
    notificationId: string,
  ): Promise<StandardResponse<NotificationsEntity>> {
    try {
      if (!admin?.adminID) {
        return this.responseService.badRequest('Invalid admin ID provided');
      }

      const updatedNotification = await this.notificationsService.markAsReadAdmin(
        notificationId,
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
        admin: admin.adminID,
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
   admin: AdminEntity,
    dto: markMultipleNotificationsAsReadDto,
  ): Promise<StandardResponse<void>> {
    try {
      if (!admin?.adminID) {
        return this.responseService.badRequest('Invalid admin ID provided');
      }

      if (
        !Array.isArray(dto.notificationIds) ||
        dto.notificationIds.length === 0
      ) {
        return this.responseService.badRequest(
          'Please provide valid notification IDs',
        );
      }

      await this.notificationsService.markMultipleAsReadAdmin(
        dto.notificationIds,
      
      );

      return this.responseService.success(
        'Notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking multiple notifications as read:', {
        admin: admin.adminID,
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
    admin: AdminEntity,
  ): Promise<StandardResponse<void>> {
    try {
      if (!admin?.adminID) {
        return this.responseService.badRequest('Invalid customerID provided');
      }

      await this.notificationsService.markAllAsRead(admin.adminID);

      return this.responseService.success(
        'All notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', {
        customer: admin.adminID,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking all notifications as read',
        error.message,
      );
    }
  }

  async UpdateAdmin(
    admin: AdminEntity,
    dto: updateAdminDto,
  ): Promise<StandardResponse<Admin>> {
    try {
      // Create a copy of the customer without the address first
      const { address: _, ...adminWithoutAddress } = admin;

      // Create base update object
      const updateObject: any = {
        ...adminWithoutAddress,
        ...dto,
        updatedAT: new Date(),
      };

      // Handle email check
      if (dto.email) {
        const checkemail = await this.adminRepo.findByEmail(dto.email);
        if (checkemail && checkemail.id !== admin.id) {
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
      } else if (admin.address) {
        // Keep existing address if no new address provided
        updateObject.address = admin.address;
      }

      // Perform the update
      await this.adminRepo.update(admin.id, updateObject);

      // Fetch the updated customer to return the latest data
      const updatedAdmin = await this.adminRepo.findByID(admin.id);

      // Save notification
      await this.notificationsService.create({
        message: `${updatedAdmin.name} has updated their record.`,
        subject: 'Account Updated',
        account: updatedAdmin.adminID,
      });

      return this.responseService.success(
        'admin record updated successfully',
        updatedAdmin,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error updating user record',
        error.message,
      );
    }
  }

  async uploadUserProfilePics(
    admin: AdminEntity,
    mediafile: Express.Multer.File,
  ): Promise<StandardResponse<Admin>> {
    try {
      const display_pics = await this.cloudinaryService.uploadFile(mediafile);
      const mediaurl = display_pics.secure_url;

      admin.profilePicture = mediaurl;

      await this.adminRepo.update(admin.id, admin);

      await this.notificationsService.create({
        message: ` ${admin.name},  has uploaded profile pics .`,
        subject: 'Account Updated',
        account: admin.adminID, //saves when the user is created
      });

      return this.responseService.success('profile pics updated', admin);
    } catch (error) {
      return this.responseService.internalServerError(
        'Error uploading profile pics',
        error.message,
      );
    }
  }


  //fetches 

  // fetch all bids
  async Fetchallbids(
    dto: PaginationDto,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    try {
      const { data: bids, total } = await this.BidRepository.fetchALL(
        dto,
        
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
    bidId: string,
  ): Promise<StandardResponse<Bid>> {
    try {
      const bid = await this.BidRepository.findByID(
        bidId,
        
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




  async FetchAllOrders(
    dto: PaginationDto,
   
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.orderRepository.findAll(
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

  async FetchAllAdmins(
    dto: PaginationDto,
   
  ): Promise<StandardResponse<{ data: Admin[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.adminRepo.find(
          dto,
        );

      return this.responseService.success(
        orders.length ? 'Admins retrived successfully' : 'No admins yet',
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
        'Error fetching admins',
        error.message,
      );
    }
  }

  async FetchOneAdmin(
    id: number,
  ): Promise<StandardResponse<Admin>> {
    try {
      const order = await this.adminRepo.findByID(
        id,
      );
      if (!order) return this.responseService.notFound('admin not found');

      return this.responseService.success(
        'single admin retrieved successfully',
        order,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one admin',
        error.message,
      );
    }
  }




  async FetchAllCustomers(
    dto: PaginationDto,
   
  ): Promise<StandardResponse<{ data: Customer[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.customerRepo.find(
          dto,
        );

      return this.responseService.success(
        orders.length ? 'Customers retrived successfully' : 'No customers yet',
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
        'Error fetching customers',
        error.message,
      );
    }
  }

  async FetchOneCustomer(
    id: number,
  ): Promise<StandardResponse<Customer>> {
    try {
      const order = await this.customerRepo.findByID(
        id,
      );
      if (!order) return this.responseService.notFound('Customer not found');

      return this.responseService.success(
        'single customer retrieved successfully',
        order,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one customer',
        error.message,
      );
    }
  }



  async FetchAllRiders(
    dto: PaginationDto,
   
  ): Promise<StandardResponse<{ data: Rider[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.riderRepo.find(
          dto,
        );

      return this.responseService.success(
        orders.length ? 'Riders retrived successfully' : 'No riders yet',
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
        'Error fetching riders',
        error.message,
      );
    }
  }

  async FetchOneRider(
    id:number,
  ): Promise<StandardResponse<Rider>> {
    try {
      const order = await this.riderRepo.findByID(
        id,
      );
      if (!order) return this.responseService.notFound('Rider not found');

      return this.responseService.success(
        'single rider retrieved successfully',
        order,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one order',
        error.message,
      );
    }
  }



  async FetchAllTransactions(
    dto: PaginationDto,
   
  ): Promise<StandardResponse<{ data: Transactions[]; total: number }>> {
    try {
      const { data: orders, total } =
        await this.transactionRepo.find(
          dto,
        );

      return this.responseService.success(
        orders.length ? 'Transactions retrived successfully' : 'No transactions yet',
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
        'Error fetching transactions',
        error.message,
      );
    }
  }

  async FetchOneTransaction(
    orderID: string,
  ): Promise<StandardResponse<Transactions>> {
    try {
      const order = await this.transactionRepo.findByID(
        orderID,
      );
      if (!order) return this.responseService.notFound('transaction not found');

      return this.responseService.success(
        'single transaction retrieved successfully',
        order,
      );
    } catch (error) {
      return this.responseService.internalServerError(
        'Error fetching one order',
        error.message,
      );
    }
  }

  ////searches 


  async searchAdmin(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Admin[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.adminRepo.searchAdmin(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }


  async searchCustomer(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Customer[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.customerRepo.searchCustomer(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }



  async searchRider(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Rider[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.riderRepo.searchRider(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }



  async searchOrder(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.orderRepository.searchOrder(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }



  async searchTrasaction(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Transactions[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.transactionRepo.searchTransactions(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }


  async searchBid(
    searchDto: SearchDto,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    try {
      const { data: tickets, total } =
        await this.bidRepository.searchBid(searchDto);

      if (!tickets.length)
        return this.responseService.notFound(
          `no search result found for the keyword: ${searchDto.keyword}`,
        );

      return this.responseService.success('search result found', {
        data: tickets,
        total,
        currentPage: searchDto.page,
        pageSize: searchDto.Perpage,
      });
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error searching for a ticket',
      );
    }
  }
}
