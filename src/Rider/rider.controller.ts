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
import { RiderService } from './rider.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/Auth/Guard/jwt.guard';
import { StandardResponse } from 'src/utils/services/response.service';
import { NotificationListResponse } from 'src/utils/Types/notification.responsetypes';
import { PaginationParams } from 'src/utils/services/notifications.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { markMultipleNotificationsAsReadDto } from 'src/utils/shared-dto/notification.dto';
import { Rider } from './Domain/rider';
import { updateRiderProfileDto } from './Dto/update-rider.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Vehicle } from './Domain/vehicle';
import { VehicleDto } from './Dto/vehicle-profile.dto';
import { Bank } from './Domain/bank';
import { BankDto } from './Dto/payment-profile.dto';
import { Bid } from 'src/Order/Domain/bids';
import { PaginationDto } from 'src/utils/shared-dto/pagination.dto';
import {
  BidActionDto,
  CounterBidDto,
} from 'src/utils/shared-dto/bid-action.dto';
import { BidActionResult } from 'src/Enums/order.enum';
import { Order } from 'src/Order/Domain/order';
import { RoleGuard } from 'src/Auth/Guard/role.guard';
import { Roles } from 'src/Auth/Decorator/role.decorator';
import { Role } from 'src/Enums/users.enum';
import { Rides } from './Domain/rides';
import { DropOffCodeDto } from './Dto/dropOff-code.dto';

@ApiTags('Rider')
@ApiBearerAuth()
@UseGuards(JwtGuard, RoleGuard)
@Roles(Role.RIDER)
@Controller({
  path: 'rider/',
  version: '1',
})
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Get('all-rider-notifications')
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
  @ApiOperation({ summary: 'all notifications for a Rider' })
  async fetchAllnotificationsRelatedToaPlanner(
    @Query() dto: PaginationParams,
    @Req() req,
  ): Promise<StandardResponse<NotificationListResponse>> {
    console.log(req.user);
    return await this.riderService.fetchAllNotifications(req.user, dto);
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
    return this.riderService.markNotificationAsRead(req.user, notificationId);
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
    return this.riderService.markMultipleNotificationsAsRead(req.user, dto);
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
    return this.riderService.markAllNotificationsAsRead(req.user);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        name: {
          type: 'string',
          nullable: false,
        },
        city: {
          type: 'string',
          nullable: false,
        },
        state: {
          type: 'string',
          nullable: false,
        },

        phoneNumber: {
          type: 'string',
          nullable: true,
        },

        address: {
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  @Patch('personal-profile/')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rider>) },
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
  @ApiOperation({ summary: 'first onboarding phase. Adding personal profile' })
  // @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('images', 2))
  async riderPersonalProfile(
    @Req() req,
    @UploadedFiles() file: Express.Multer.File[],
    @Body() dto: updateRiderProfileDto,
  ): Promise<StandardResponse<Rider>> {
    return await this.riderService.PersonalProfile(req.user, dto, file);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        vehicleType: {
          type: 'string',
          nullable: false,
        },
        plateNumber: {
          type: 'string',
          nullable: false,
        },
      },
    },
  })
  @Patch('vehicle-profile/')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Vehicle>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Vehicle),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'second onboarding phase. Adding vehicle profile' })
  @UseInterceptors(FilesInterceptor('images', 2))
  async riderVehicleProfile(
    @Req() req,
    @UploadedFiles() file: Express.Multer.File[],
    @Body() dto: VehicleDto,
  ): Promise<StandardResponse<Vehicle>> {
    return await this.riderService.VehicleRofile(req.user, dto, file);
  }

  @Patch('payment-profile/')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Bank>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Bank),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({ summary: 'third onboarding phase. Adding payment profile' })
  async riderPaymentProfile(
    @Req() req,
    @Body() dto: BankDto,
  ): Promise<StandardResponse<Bank>> {
    return await this.riderService.PaymentProfile(req.user, dto);
  }

  @Get('all-available-bids')
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
  @ApiOperation({
    summary: 'all  avialable bids related to an order and a customer',
  })
  async fetchAllAvailableBids(
    @Query() dto: PaginationDto,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    return await this.riderService.FetchallbidsFromcustomer(dto);
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
    return await this.riderService.FetchOneBid(BidId);
  }

  @Get('all-my-involved-bids')
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
  @ApiOperation({ summary: 'all bids i have acepted as a rider' })
  async fetchAllMyBids(
    @Query() dto: PaginationDto,
    @Req() req,
  ): Promise<StandardResponse<{ data: Bid[]; total: number }>> {
    return await this.riderService.FetchallMyInvolvedBids(req.user, dto);
  }

  @Patch('bid-action/:BidID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<BidActionResult>) },
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
    summary: 'accept or decline a bid sent in from the customer ',
  })
  async AcceptOrDeclineBid(
    @Body() dto: BidActionDto,
    @Req() req,
    @Param('BidID') BidId: string,
  ): Promise<StandardResponse<BidActionResult>> {
    return await this.riderService.RiderAcceptOrDeclineBid(
      req.user,
      BidId,
      dto,
    );
  }

  @Patch('counter-bid/:BidID')
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
  @ApiOperation({
    summary: 'counter a bid from a customer ',
  })
  async CounterBid(
    @Body() dto: CounterBidDto,
    @Req() req,
    @Param('BidID') BidId: string,
  ): Promise<StandardResponse<Bid>> {
    return await this.riderService.CounterBid(req.user, BidId, dto);
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
    return await this.riderService.FetchOneOrder(orderId);
  }

  @Get('all-my-accepted-orders')
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
  @ApiOperation({ summary: 'all orders i have acepted as a rider' })
  async fetchAllMyOrder(
    @Query() dto: PaginationDto,
    @Req() req,
  ): Promise<StandardResponse<{ data: Order[]; total: number }>> {
    return await this.riderService.FetchAllMyOrders(dto, req.user);
  }

  @Patch('checkpoint/enroute-to-pickupLocation/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'enroute to pickup location  ',
  })
  async EnrouteToPickup(
    @Req() req,
    @Param('rideID') rideID: string,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.enrouteToPickupLocation(req.user, rideID);
  }

  @Patch('checkpoint/at-pickupLocation/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'at  pickup location  ',
  })
  async AtPickupLocation(
    @Req() req,
    @Param('rideID') rideID: string,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.AtPickupLocation(req.user, rideID);
  }

  @Patch('checkpoint/picked-upParcel/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'picked up parcel  ',
  })
  async PickedUpParcel(
    @Req() req,
    @Param('rideID') rideID: string,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.PickedUpParcel(req.user, rideID);
  }

  @Patch('checkpoint/enroute-to-dropOffLocation/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'enroute to dropOff location  ',
  })
  async EnrouteToDropOffLocation(
    @Req() req,
    @Param('rideID') rideID: string,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.enrouteToDropOffLocation(req.user, rideID);
  }

  @Patch('checkpoint/at-dropOffLocation/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'at dropoff location  ',
  })
  async AtDropOfflocation(
    @Req() req,
    @Param('rideID') rideID: string,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.enrouteToPickupLocation(req.user, rideID);
  }

  @Patch('checkpoint/droppedOff-parcel/:rideID')
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(StandardResponse<Rides>) },
        {
          properties: {
            payload: {
              $ref: getSchemaPath(Rides),
            },
          },
        },
      ],
    },
  })
  @ApiOperation({
    summary: 'droppedOff Parcel  ',
  })
  async DroppedOffParcel(
    @Req() req,
    @Param('rideID') rideID: string,
    @Body() dto: DropOffCodeDto,
  ): Promise<StandardResponse<Rides>> {
    return await this.riderService.dropOffParcel(req.user, rideID, dto);
  }
}
