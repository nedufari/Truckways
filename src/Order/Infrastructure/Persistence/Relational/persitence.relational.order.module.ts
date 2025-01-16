import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidEntity } from './Entity/bids.entity';
import { OrderEntity, OrderItemsEntity } from './Entity/order.entity';
import { CartItemsEntity } from './Entity/order-cart-items.entity';
import { OrderCartEntity } from './Entity/order-cart.entity';
import {
  BidRepository,
  CartItemRepository,
  OrderCartRepository,
  OrderItemRepository,
  OrderRepository,
} from '../all-order-repositories';
import {
  BidsRelationalRepository,
  CartItemsRelationalRepository,
  OrderCartRelationalRepository,
  OrderItemsRelationalRepository,
  OrderRelationalRepository,
} from './Repository/all-order.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BidEntity,
      OrderEntity,
      OrderItemsEntity,
      CartItemsEntity,
      OrderCartEntity,
    ]),
  ],
  providers: [
    {
      provide: BidRepository,
      useClass: BidsRelationalRepository,
    },
    {
      provide: OrderRepository,
      useClass: OrderRelationalRepository,
    },
    {
      provide: OrderItemRepository,
      useClass: OrderItemsRelationalRepository,
    },
    {
      provide: CartItemRepository,
      useClass: CartItemsRelationalRepository,
    },
    {
      provide: OrderCartRepository,
      useClass: OrderCartRelationalRepository,
    },
  ],
  exports:[OrderRepository,OrderItemRepository,OrderCartRepository,CartItemRepository,BidRepository]
})
export class PersitenceRelationalOrderModule {}
