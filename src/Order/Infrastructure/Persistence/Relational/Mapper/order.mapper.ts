import { Order } from 'src/Order/Domain/order';
import { OrderEntity } from '../Entity/order.entity';
import { BidMapper } from './bids.mapper';
import { OrderItemsMapper } from './cartItems.mapper';
import { Bid } from 'src/Order/Domain/bids';

export class OrderMapper {
  static toDomain(raw: OrderEntity): Order {
    const domainEntity = new Order();
    domainEntity.id = raw.id;
    domainEntity.Rider = raw.Rider;
    domainEntity.accepted_bid = raw.accepted_bid;
    domainEntity.bid = raw.bid
      ? raw.bid.map((bids) => BidMapper.toDomain(bids))
      : [];
    domainEntity.items = raw.items
      ? raw.items.map((items) => OrderItemsMapper.toDomain(items))
      : [];
    domainEntity.customer = raw.customer;
    domainEntity.orderID = raw.orderID;
    return domainEntity;
  }

  static toPersistence(domainEntity: Order): OrderEntity {
    const persistenceEntity = new OrderEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.Rider = domainEntity.Rider;
    persistenceEntity.customer = domainEntity.customer;
    persistenceEntity.accepted_bid = domainEntity.accepted_bid;
    persistenceEntity.bid = domainEntity.bid
      ? domainEntity.bid.map((bids) => BidMapper.toPeristence(bids))
      : [];
    persistenceEntity.items = domainEntity.items
      ? domainEntity.items.map((items) => OrderItemsMapper.toPeristence(items))
      : [];
    persistenceEntity.orderID = domainEntity.orderID;
    return persistenceEntity;
  }
}
