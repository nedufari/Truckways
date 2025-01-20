import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import {
  BidRepository,
  CartItemRepository,
  OrderCartRepository,
  OrderItemRepository,
  OrderRepository,
} from './Infrastructure/Persistence/all-order-repositories';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { GeneratorService } from 'src/utils/services/generator.service';
import { AddParcelToCartDto } from './Dto/add-parcel-to-cart.dto';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import { CartItem } from './Domain/order-cart-items';
import { CustomerEntity } from 'src/Customer/Infrastructure/Persistence/Relational/Entity/customer.entity';
import { Order } from './Domain/order';
import { BidStatus } from 'src/Enums/order.enum';
import { Injectable } from '@nestjs/common';
import { PaystackCustomer } from 'src/Payment/paystack/paystack-standard-response';
import { PaystackService } from 'src/Payment/paystack/paystack.service';
import { EventsGateway } from 'src/utils/gateway/websocket.gateway';
//import { PushNotificationsService } from 'src/utils/services/push-notification.service';

@Injectable()
export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: OrderCartRepository,
    private orderItemRepository: OrderItemRepository,
    private cartItemRepositor: CartItemRepository,
    private bidRepository: BidRepository,
    private responseService: ResponseService,
    private notificationService: NotificationsService,
    private generatorService: GeneratorService,
    private cloudinaryService: CloudinaryService,
    private geolocationService: GeoLocationService,
    private paystackService: PaystackService,
    private readonly eventsGateway: EventsGateway,
    //private readonly pushnotificationsService:PushNotificationsService
  ) {}

  //add items to cart
  async AddParcelToCart(
    customer: CustomerEntity,
    dto: AddParcelToCartDto,
    mediafile: Express.Multer.File,
    cartID: string,
  ): Promise<StandardResponse<CartItem>> {
    try {
      const cart = await this.cartRepository.findByID(
        cartID,
        customer.customerID,
      );
      if (!cart) return this.responseService.notFound('cart not found');

      const load_pics = await this.cloudinaryService.uploadFile(mediafile);
      const mediaurl = load_pics.secure_url;

      const pickupCoordinates =
        await this.geolocationService.getYahooCoordinates(dto.pickup_address);
      const dropOffCoordinates =
        await this.geolocationService.getYahooCoordinates(dto.dropoff_address);

      const cartItemID = `TrkCI${await this.generatorService.generateUserID()}`;

      //add items to cart
      const cartItem = await this.cartItemRepositor.create({
        id: 0,
        cartItemID: cartItemID,
        dropoff_address: dto.dropoff_address,
        pickup_address: dto.pickup_address,
        load_image: mediaurl,
        load_type: dto.load_type,
        load_value: dto.load_value,
        recipient_name: dto.recipient_name,
        recipient_number: dto.recipient_number,
        truck_type: dto.truck_type,
        initial_bid_value: dto.initial_bid_value,
        cart: cart,
      });

      //save notification
      await this.notificationService.create({
        message: `Item, added to Cart successfully.`,
        subject: 'Item Added To Cart',
        account: customer.customerID, //saves when the user is created
      });

      return this.responseService.success(
        'customer successfully added an item to cart',
        cartItem,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error while adding item to cart',
        error.message,
      );
    }
  }

  async removeItemFromCart(
    customer: CustomerEntity,
    cartID: string,
    CartItemID: string,
  ): Promise<StandardResponse<boolean>> {
    try {
      const cart = await this.cartRepository.findByID(
        cartID,
        customer.customerID,
      );
      if (!cart) return this.responseService.notFound('cart not found');

      if (cart.checkedOut)
        return this.responseService.badRequest(
          'cart has already been checked out',
        );

      //find the cartitem index
      const cartItemIndex = cart.items.findIndex(
        (item) => item.cartItemID === CartItemID,
      );
      if (cartItemIndex === -1)
        return this.responseService.notFound('item in cart not found');

      const removeItem = cart.items.splice(cartItemIndex, 1)[0];
      if (!removeItem)
        return this.responseService.badRequest(
          'failed to remove item from cart',
        );

      //save the cart now
      await this.cartRepository.save(cart);

      //save notification
      await this.notificationService.create({
        message: `Item, ${removeItem.cartItemID} removed from cart successfully.`,
        subject: 'Item Removed from Cart',
        account: customer.customerID, //saves when the user is created
      });

      return this.responseService.success(
        `item ${removeItem.cartItemID} removed from cart successfully`,
        true,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error while removing item from cart',
        error.message,
      );
    }
  }

  async PlaceOrder(
    customer: CustomerEntity,
    cartID: string,
  ): Promise<StandardResponse<Order>> {
    try {
      const cart = await this.cartRepository.findByID(
        cartID,
        customer.customerID,
      );
      if (!cart) return this.responseService.notFound('cart not found');

      if (cart.items.length === 0)
        return this.responseService.badRequest('cart is empty');

      if (cart.checkedOut)
        return this.responseService.badRequest('cart is already checked out');

      const orderID = `TrkO${await this.generatorService.generateUserID()}`;

      //create order
      const order = await this.orderRepository.create({
        id: 0,
        orderID: orderID,
        accepted_bid: 0,
        bid: [],
        Rider: undefined,
        customer: customer,
        createdAT:new Date(),
        paymentStatus:undefined,
        items: [], //will update after creating the items
      });
      console.log('order', order);

      //save order to get its id
      const savedOrder = await this.orderRepository.save(order);
      console.log('savedOrder', savedOrder);

      // Create order items
      const orderItems = await Promise.all(
        cart.items.map(async (item) => {
          const orderItemID = `TrkOI${await this.generatorService.generateUserID()}`;

          const orderItem = await this.orderItemRepository.create({
            id: 0,
            orderItemID: orderItemID,
            pickup_address: item.pickup_address,
            dropoff_address: item.dropoff_address,
            recipient_name: item.recipient_name,
            recipient_number: item.recipient_number,
            initial_bid_value: item.initial_bid_value,
            load_image: item.load_image,
            load_type: item.load_type,
            load_value: item.load_value,
            truck_type: item.truck_type,
            order: savedOrder, // Link to the saved order
          });

          return await this.orderItemRepository.save(orderItem);
        }),
      );

      console.log('orderItems', orderItems);

      // Create initial bid for each order item
      await Promise.all(
        orderItems.map(async (orderItem) => {
          const bidID = `TrkB${await this.generatorService.generateUserID()}`;

          const initialBid = await this.bidRepository.create({
            id: 0,
            bidID: bidID,
            initialBid_value: orderItem.initial_bid_value,
            bidStatus: BidStatus.BID_SENT,
            order: savedOrder,
            createdAT: new Date(),
            acceptedAT: undefined,
            declinedAT: undefined,
            counteredBid_value: 0,
            counteredAT: undefined,
            bidTypeAccepted: undefined,
            rider: undefined,
          });

          const savedBid = await this.bidRepository.save(initialBid);

           // Emit WebSocket event for new order with initial bid
           this.eventsGateway.emitToAllRiders('newOrder', {
            orderId: savedOrder.orderID,
            pickup: orderItem.pickup_address,
            dropoff: orderItem.dropoff_address,
            openning_bid: orderItem.initial_bid_value,
            itemDetails: {
              loadType: orderItem.load_type,
              truckType: orderItem.truck_type,
              loadValue: orderItem.load_value,
            }
          });


          //push notifications 
          //this.pushnotificationsService.notifyAllRidersOfNewOrder(savedOrder)


          return savedBid
        }),
      );

      // //update cart
      cart.checkedOut = false;
      cart.LastcheckoutedAT = new Date();
      cart.items = [];
      await this.cartRepository.save(cart);

      // Create notification for order placement
      await this.notificationService.create({
        message: `Hello ${customer.name}, your order ${orderID} has been placed successfully.`,
        subject: 'Order Placed',
        account: customer.customerID,
      });

     

      //fetch completed order
      const completedOrder = await this.orderRepository.findByID(
        savedOrder.orderID,
      );
      console.log('completedOrder', completedOrder);

      return this.responseService.success(
        'Order placed successfully',
        completedOrder,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error placing order or checking out ',
        error.message,
      );
    }
  }

  //pay for agreed orders and bids.
  async PayForOrder(
    customer: CustomerEntity,
    orderId: string,
  ): Promise<StandardResponse<any>> {
    try {
      const order = await this.orderRepository.findByID(orderId);
      if (!order) return this.responseService.notFound('order not found');

      if (order.accepted_bid === null)
        return this.responseService.badRequest(
          'The bid for this order has not being finalized yet, so you cannot proceed with payment',
        );

      //initialize payment
      const PaystackCustomer: PaystackCustomer = {
        email: customer.email,
        full_name: customer.name,
        phone: customer.phoneNumber,
      };

      const paymentResponse = await this.paystackService.PayForOrder(
        Number(order.accepted_bid),
        PaystackCustomer,
        order,
      );
      console.log (order.accepted_bid)

      if (paymentResponse) {
        await this.notificationService.create({
          subject: 'Order Payment Initialized',
          message: `Order Payment initialized successfully`,
          account: customer.customerID,
        });
      }

      return this.responseService.success('Payment successfully Initiated', {
        paymentResponse: paymentResponse.data,
      });
    } catch (error) {
      await this.notificationService.create({
        subject: 'Payment Error',
        message: `failed to process Payment for Order`,
        account: customer.customerID,
      });
      console.error(error);
      return this.responseService.internalServerError(
        'Error while initializing order Payment',
      );
    }
  }
}
