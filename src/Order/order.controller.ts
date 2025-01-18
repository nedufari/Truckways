import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { Body, Controller, Delete, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { JwtGuard } from "src/Auth/Guard/jwt.guard";
import { StandardResponse } from "src/utils/services/response.service";
import { CartItem } from "./Domain/order-cart-items";
import { FileInterceptor } from "@nestjs/platform-express";
import { AddParcelToCartDto } from "./Dto/add-parcel-to-cart.dto";
import { Order } from "./Domain/order";
import { RoleGuard } from "src/Auth/Guard/role.guard";
import { Roles } from "src/Auth/Decorator/role.decorator";
import { Role } from "src/Enums/users.enum";

@ApiTags('Order Service')
@ApiBearerAuth()
@UseGuards(JwtGuard,RoleGuard)
@Roles(Role.CUSTOMER)
@Controller({
  path: 'order/',
  version: '1.0',
})
export class OrderController{
    constructor(private readonly orderService:OrderService){}

    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          load_image: {
            type: 'string',
            format: 'binary',
          },
          load_type: {
            type: 'string',
            nullable: false,
          },
          load_value: {
            type: 'number',
            nullable: false,
          },
  
          truck_type: { 
            type: 'string', 
            nullable: true 
          },
          
          pickup_address: {
            type: 'string',
            nullable: true,
          },
          dropoff_address: {
            type: 'string',
            nullable: true,
          },
          recipient_name: {
            type: 'string',
            nullable: true,
          },
          recipient_number: {
            type: 'string',
            nullable: true,
          },
          initial_bid_value: {
            type: 'number',
            nullable: true,
          },

        },
      },
    })
    @Patch('add-parcel-to-cart/:CartID')
    @ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(StandardResponse<CartItem>) },
          {
            properties: {
              payload: {
                $ref: getSchemaPath(CartItem),
              },
            },
          },
        ],
      },
    })
    @ApiOperation({ summary: 'add parcel to cart' })
    // @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('load_image'))
    async AddParcelToCart(
      @Req() req,
      @UploadedFile() file: Express.Multer.File,
      @Body()dto:AddParcelToCartDto,
      @Param('cartID')cartID:string
    ): Promise<StandardResponse<CartItem>> {
      return await this.orderService.AddParcelToCart(req.user,dto, file,cartID);
    }


    @Delete('remove-parcel-from-cart/:CartID/:cartItemID')
    @ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(StandardResponse<boolean>) },
          {
            properties: {
              payload: {
                $ref: getSchemaPath(CartItem),
              },
            },
          },
        ],
      },
    })
    @ApiOperation({ summary: 'remove parcel from cart' })
    async RempoveParcelFromCart(
      @Req() req,
      @Param('cartID')cartID:string,
      @Param('cartItemID')cartItemID:string
      
    ): Promise<StandardResponse<boolean>> {
      return await this.orderService.removeItemFromCart(req.user,cartID,cartItemID);
    }



    @Post('placeOrder/:cartID')
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
    @ApiOperation({ summary: 'checkout from cart and place order, this will create an order and also create the inital bid' })
    async PlaceOrder(
      @Req() req,
      @Param('cartID')cartID:string,
   
      
    ): Promise<StandardResponse<Order>> {
      return await this.orderService.PlaceOrder(req.user,cartID);
    }
    
}