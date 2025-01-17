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

@ApiTags('Rider')
@ApiBearerAuth()
@UseGuards(JwtGuard)
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
  @ApiOperation({ summary: 'all notifications for a Planner' })
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
}
