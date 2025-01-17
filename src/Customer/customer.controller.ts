import { Body, Controller, Get, Param, Patch, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { JwtGuard } from "src/Auth/Guard/jwt.guard";
import { CustomerService } from "./customer.service";
import { StandardResponse } from "src/utils/services/response.service";
import { NotificationListResponse } from "src/utils/Types/notification.responsetypes";
import { PaginationParams } from "src/utils/services/notifications.service";
import { NotificationsEntity } from "src/utils/shared-entities/notification.entity";
import { markMultipleNotificationsAsReadDto } from "src/utils/shared-dto/notification.dto";
import { Customer } from "./Domain/customer";
import { FileInterceptor } from "@nestjs/platform-express";
import { updateCustomerDto } from "./Dto/update-customer.dto";
import { OrderCart } from "src/Order/Domain/order-cart";

 

 @ApiTags('Customer')
 @ApiBearerAuth()
 @UseGuards(JwtGuard)
 @Controller({
   path: 'customer/',
   version: '1',
 })
 export class CustomerController {
   constructor(private readonly customerService: CustomerService) {}
 //fetch all notifications

 @Get('all-customer-notifications')
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
   return await this.customerService.fetchAllNotifications(req.user, dto);
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
   return this.customerService.markNotificationAsRead(req.user, notificationId);
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
   return this.customerService.markMultipleNotificationsAsRead(req.user, dto);
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
   return this.customerService.markAllNotificationsAsRead(req.user);
 }


 @Patch('update-record')
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
 @ApiOperation({ summary: 'update customer records' })
 // @HttpCode(HttpStatus.OK)
 async UpdateRecord(
   @Body() dto: updateCustomerDto,
   @Req() req,
 ): Promise<StandardResponse<Customer>> {
   return await this.customerService.UpdateCustomer(req.user, dto);
 }


 @Get('my-cart')
 @ApiOkResponse({
   schema: {
     allOf: [
       { $ref: getSchemaPath(StandardResponse<OrderCart>) },
       {
         properties: {
           payload: {
             $ref: getSchemaPath(OrderCart),
           },
         },
       },
     ],
   },
 })
 @ApiOperation({ summary: 'fetch my cart' })
 async FetchMyCart(
   @Req() req,
 ): Promise<StandardResponse<OrderCart>> {
   return await this.customerService.fetchMyCart(req.user);
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
 @ApiOperation({ summary: 'upload user profile pics' })
 // @HttpCode(HttpStatus.OK)
 @UseInterceptors(FileInterceptor('profilePics'))
 async UploadProfilePics(
   @Req() req,
   @UploadedFile() file: Express.Multer.File,
 ): Promise<StandardResponse<Customer>> {
   return await this.customerService.uploadUserProfilePics(req.user, file);
 }

}