import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/Auth/Guard/jwt.guard';
import { AdminService } from './admin.service';
import { StandardResponse } from 'src/utils/services/response.service';
import { NotificationListResponse } from 'src/utils/Types/notification.responsetypes';
import { PaginationParams } from 'src/utils/services/notifications.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { markMultipleNotificationsAsReadDto } from 'src/utils/shared-dto/notification.dto';
import { Admin } from './Domain/admin';
import { FileInterceptor } from '@nestjs/platform-express';
import { updateAdminDto } from './Dto/update-admin.dto';
import { OrderCart } from 'src/Order/Domain/order-cart';
import { Bid } from 'src/Order/Domain/bids';
import { PaginationDto, SearchDto } from 'src/utils/shared-dto/pagination.dto';
import { BidActionResult } from 'src/Enums/order.enum';
import { BidActionDto } from 'src/utils/shared-dto/bid-action.dto';
import { Order } from 'src/Order/Domain/order';
import { RoleGuard } from 'src/Auth/Guard/role.guard';
import { Roles } from 'src/Auth/Decorator/role.decorator';
import { Role } from 'src/Enums/users.enum';
import { Customer } from 'src/Customer/Domain/customer';
import { Rider } from 'src/Rider/Domain/rider';
import { Transactions } from 'src/Rider/Domain/transaction';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtGuard,RoleGuard)
@Roles(Role.ADMIN)
@Controller({
  path: 'admin/',
  version: '1',
})
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  //fetch all notifications

  @Get('all-notifications')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<NotificationListResponse>),
        },
        {
          properties: {
            payload: {
              // $ref: getSchemaPath(),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiOperation({ summary: 'all notifications' })
  async fetchAllnotificationsRelatedToaPlanner(
    @Query() dto: PaginationParams,
    @Req() req,
  ): Promise<StandardResponse<NotificationListResponse>> {
    console.log(req.user);
    return await this.adminService.fetchAllNotifications(req.user, dto);
  }

  @Patch('/mark-as-read/:notificationId')
  @ApiParam({
    name: 'notificationId',
    required: true,
    description: 'The ID of the notification to mark as read',
    schema: { type: 'string' }, // Define the type of the param, here it's a number
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<NotificationsEntity>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(NotificationsEntity),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'mark a notification as read' })
  async markAsRead(
    @Req() req,
    @Param('notificationId') notificationId: string,
  ) {
    return this.adminService.markNotificationAsRead(
      req.user,
      notificationId,
    );
  }

  @Patch('mark-multiple-as-read')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notificationIds: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<NotificationsEntity>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(NotificationsEntity),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'mark some selected notifications as read' })
  async markMultipleAsRead(
    @Req() req,
    @Body() dto: markMultipleNotificationsAsReadDto,
  ) {
    return this.adminService.markMultipleNotificationsAsRead(req.user, dto);
  }

  @Patch('mark-all-as-read')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<void>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(NotificationsEntity),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'mark all notifications as read' })
  async markAllAsRead(@Req() req) {
    return this.adminService.markAllNotificationsAsRead(req.user);
  }

  @Patch('update-record')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Admin>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Admin),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'update admin records' })
  // @HttpCode(HttpStatus.OK)
  async UpdateRecord(
    @Body() dto: updateAdminDto,
    @Req() req,
  ): Promise<StandardResponse<Admin>> {
    return await this.adminService.UpdateAdmin(req.user, dto);
  }

  //update including adding pics
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profilePics: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Patch('upload-profilePics')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Admin>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Admin),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'upload admin profile pics' })
  // @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePics'))
  async UploadProfilePics(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<StandardResponse<Admin>> {
    return await this.adminService.uploadUserProfilePics(req.user, file);
  }


  @Get('all-bids')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Bid[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Bid),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all bids related to an order and a customer' })
  async fetchAlBids(
    @Query() dto: PaginationDto,
    
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
   ;
    return await this.adminService.Fetchallbids( dto);
  }

  @Get('one-bid/:BidID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Bid>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Bid),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one bid' })
  async FetccOneBid(
  
    @Param('BidID') BidId: string,
  ): Promise<StandardResponse<Bid>> {
    return await this.adminService.FetchOneBid( BidId);
  }

  




  @Get('one-order/:orderID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Order>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Order),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one order' })
  async FetccOneOrder(
    @Param('orderD') orderId: string,
  ): Promise<StandardResponse<Order>> {
    return await this.adminService.FetchOneOrder(orderId);
  }



  @Get('all-orders')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Order[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Order),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all orders i have placed' })
  async fetchAllMyOrder(
    @Query() dto: PaginationDto,
    @Req()req
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    return await this.adminService.FetchAllOrders(dto);
  }



  @Get('one-customer/:customerID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Customer>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Customer),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one customer' })
  async FetchOneCustome(
    @Param('customerID') orderId: number,
  ): Promise<StandardResponse<Customer>> {
    return await this.adminService.FetchOneCustomer(orderId);
  }



  @Get('all-customers')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Customer[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(
                Customer),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all customers' })
  async fetchAllcustomers(
    @Query() dto: PaginationDto,
    @Req()req
  ): Promise<StandardResponse<{ data: Customer[]; total: number }>> {
    return await this.adminService.FetchAllCustomers(dto);
  }





  @Get('one-admin/:adminID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Admin>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Customer),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one admin' })
  async FetchOneAdmin(
    @Param('adminID') orderId: number,
  ): Promise<StandardResponse<Admin>> {
    return await this.adminService.FetchOneAdmin(orderId);
  }



  @Get('all-admins')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Admin[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(
                Admin),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all admins' })
  async fetchAllAdmins(
    @Query() dto: PaginationDto,
    @Req()req
  ): Promise<StandardResponse<{ data: Admin[]; total: number }>> {
    return await this.adminService.FetchAllAdmins(dto);
  }

  @Get('one-rider/:riderID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Customer>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Customer),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one rider' })
  async FetchOneRider(
    @Param('riderID') orderId: number,
  ): Promise<StandardResponse<Rider>> {
    return await this.adminService.FetchOneRider(orderId);
  }



  @Get('all-riders')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Rider[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(
                Rider),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all riders' })
  async fetchAllriders(
    @Query() dto: PaginationDto,
    @Req()req
  ): Promise<StandardResponse<{ data: Rider[]; total: number }>> {
    return await this.adminService.FetchAllRiders(dto);
  }



  @Get('one-transaction/:tranID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Transactions>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Transactions),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'fetch one transaction' })
  async FetchOneTransaction(
    @Param('tranID') orderId: string,
  ): Promise<StandardResponse<Transactions>> {
    return await this.adminService.FetchOneTransaction(orderId);
  }



  @Get('all-transactions')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(StandardResponse<{ data: Customer[]; total: number }>),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(
                Customer),
            },
          },
        },
      ],
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  @ApiOperation({ summary: 'all transactions' })
  async fetchAlltransations(
    @Query() dto: PaginationDto,
    @Req()req
  ): Promise<StandardResponse<{ data: Transactions[]; total: number }>> {
    return await this.adminService.FetchAllTransactions(dto);
  }




///searches and queries 
  @Get('search-admin')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Admin[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Admin),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for an admin, by name, adminID, email',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchAdmin(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Admin[]; total: number }>> {
    return await this.adminService.searchAdmin(dto);
  }


  @Get('search-customer')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Customer[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Customer),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for a customer, by name, customerID, email',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchCustomer(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Customer[]; total: number }>> {
    return await this.adminService.searchCustomer(dto);
  }




  @Get('search-rider')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Rider[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rider),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for a rider, by name, riderID, email',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchRider(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Rider[]; total: number }>> {
    return await this.adminService.searchRider(dto);
  }



  @Get('search-order')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Order[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Order),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for an order, by orderID',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchOrder(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    return await this.adminService.searchOrder(dto);
  }




  @Get('search-transaction')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Transactions[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Transactions),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for a transation, by reference , type, wallet address',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchTrasactions(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Transactions[]; total: number }>> {
    return await this.adminService.searchTrasaction(dto);
  }



  @Get('search-bid')
  @ApiOkResponse({
    schema: {
      allOf: [
        {
          $ref: getSchemaPath(
            StandardResponse<{ data: Bid[]; total: number }>,
          ),
        },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Bid),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'search for a bid, bidID',
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search keyword' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'perPage',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: 'string',
    description: 'Sorting field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sorting order',
  })
  async searchBid(
    @Query() dto: SearchDto,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    return await this.adminService.searchBid(dto);
  }




}
