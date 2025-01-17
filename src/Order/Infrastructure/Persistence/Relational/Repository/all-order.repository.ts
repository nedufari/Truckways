import { InjectRepository } from '@nestjs/typeorm';
import {
  BidRepository,
  CartItemRepository,
  OrderCartRepository,
  OrderItemRepository,
  OrderRepository,
} from '../../all-order-repositories';
import { OrderEntity, OrderItemsEntity } from '../Entity/order.entity';
import { Repository } from 'typeorm';
import { Order } from 'src/Order/Domain/order';
import { OrderMapper } from '../Mapper/order.mapper';
import { PaginationDto } from 'src/utils/shared-dto/pagination.dto';
import { OrderCart } from 'src/Order/Domain/order-cart';
import { OrderCartEntity } from '../Entity/order-cart.entity';
import { OrderCartMapper } from '../Mapper/order-cart.mapper';
import { CartItemsEntity } from '../Entity/order-cart-items.entity';
import { CartItem, Ordertem } from 'src/Order/Domain/order-cart-items';
import { CartItemsMapper, OrderItemsMapper } from '../Mapper/cartItems.mapper';
import { BidEntity } from '../Entity/bids.entity';
import { Bid } from 'src/Order/Domain/bids';
import { BidMapper } from '../Mapper/bids.mapper';

export class OrderRelationalRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private orderEntityRepository: Repository<OrderEntity>,
  ) {}

  async create(order: Order): Promise<Order> {
    const persistenceOrder = OrderMapper.toPersistence(order);
    const savedOrder = await this.orderEntityRepository.save(persistenceOrder);
    return OrderMapper.toDomain(savedOrder);
  }

  async findByID(id: string): Promise<Order> {
    const order = await this.orderEntityRepository.findOne({
      where: { orderID: id },
      relations: ['customer', 'bid', 'items'],
    });
    return order ? OrderMapper.toDomain(order) : null;
  }

  async findAll(dto: PaginationDto): Promise<{ data: Order[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.orderEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['customer', 'bid', 'rider', 'rider.vehicle', 'items'],
    });
    const orders = result.map(OrderMapper.toDomain);
    return { data: orders, total };
  }

  async findAllRelatedToCustomer(
    customerID: string,
    dto: PaginationDto,
  ): Promise<{ data: Order[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.orderEntityRepository.findAndCount({
      where: { customer: { customerID: customerID } },
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['customer', 'bid', 'rider', 'rider.vehicle', 'items'],
    });
    const orders = result.map(OrderMapper.toDomain);
    return { data: orders, total };
  }

  async save(order: Order): Promise<Order> {
    const persistenceOrder = OrderMapper.toPersistence(order);
    const savedOrder = await this.orderEntityRepository.save(persistenceOrder, {
      reload: true,
    });

    return OrderMapper.toDomain(savedOrder);
  }

  async remove(id: string): Promise<void> {
    await this.orderEntityRepository.delete(id);
  }
}

///order cart

export class OrderCartRelationalRepository implements OrderCartRepository {
  constructor(
    @InjectRepository(OrderCartEntity)
    private orderCartEntityRepository: Repository<OrderCartEntity>,
  ) {}

  async create(cart: OrderCart): Promise<OrderCart> {
    const persistenceCart = OrderCartMapper.toPersitence(cart);
    const savedCart =
      await this.orderCartEntityRepository.save(persistenceCart);
    return OrderCartMapper.toDomain(savedCart);
  }

  async findByID(id: string, customerid: string): Promise<OrderCart> {
    const cart = await this.orderCartEntityRepository.findOne({
      where: { orderCartID: id, customer: { customerID: customerid } },
      relations: ['items'],
    });
    return cart ? OrderCartMapper.toDomain(cart) : null;
  }

  async findByCustomer(customerid: string): Promise<OrderCart> {
    const cart = await this.orderCartEntityRepository.findOne({
      where: { customer: { customerID: customerid } },
      relations: ['items'],
    });
    return cart ? OrderCartMapper.toDomain(cart) : null;
  }

  async save(cart: OrderCart): Promise<OrderCart> {
    const persistenceOrder = OrderCartMapper.toPersitence(cart);
    const savedCart = await this.orderCartEntityRepository.save(
      persistenceOrder,
      {
        reload: true,
      },
    );

    return OrderCartMapper.toDomain(savedCart);
  }

  async update(id: string, cart: Partial<OrderCart>): Promise<OrderCart> {
    await this.orderCartEntityRepository.update(
      id,
      OrderCartMapper.toPersitence(cart as OrderCart),
    );
    const updatedCart = await this.orderCartEntityRepository.findOne({
      where: { orderCartID: id },
    });
    return OrderCartMapper.toDomain(updatedCart);
  }

  async remove(id: string): Promise<void> {
    await this.orderCartEntityRepository.delete(id);
  }
}

/// cart item
export class CartItemsRelationalRepository implements CartItemRepository {
  constructor(
    @InjectRepository(CartItemsEntity)
    private cartItemEntityRepository: Repository<CartItemsEntity>,
  ) {}

  async create(item: CartItem): Promise<CartItem> {
    const persistenceItem = CartItemsMapper.toPeristence(item);
    const savedItem = await this.cartItemEntityRepository.save(persistenceItem);
    return CartItemsMapper.toDomain(savedItem);
  }

  async findByID(id: string): Promise<CartItem> {
    const item = await this.cartItemEntityRepository.findOne({
      where: { cartItemID: id },
    });
    return item ? CartItemsMapper.toDomain(item) : null;
  }

  async save(item: CartItem): Promise<CartItem> {
    const persistenceItem = CartItemsMapper.toPeristence(item);
    const savedItem = await this.cartItemEntityRepository.save(
      persistenceItem,
      {
        reload: true,
      },
    );

    return CartItemsMapper.toDomain(savedItem);
  }

  async remove(id: string): Promise<void> {
    await this.cartItemEntityRepository.delete(id);
  }

  async update(id: string, item: Partial<CartItem>): Promise<CartItem> {
    await this.cartItemEntityRepository.update(
      id,
      CartItemsMapper.toPeristence(item as CartItem),
    );
    const updatedItem = await this.cartItemEntityRepository.findOne({
      where: { cartItemID: id },
    });
    return CartItemsMapper.toDomain(updatedItem);
  }
}

//ordder Items
export class OrderItemsRelationalRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemsEntity)
    private orderItemEntityRepository: Repository<OrderItemsEntity>,
  ) {}

  async create(item: Ordertem): Promise<Ordertem> {
    const persistenceItem = OrderItemsMapper.toPeristence(item);
    const savedItem =
      await this.orderItemEntityRepository.save(persistenceItem);
    return OrderItemsMapper.toDomain(savedItem);
  }

  async findByID(id: string): Promise<Ordertem> {
    const item = await this.orderItemEntityRepository.findOne({
      where: { orderItemID: id },
    });
    return item ? OrderItemsMapper.toDomain(item) : null;
  }

  async save(item: Ordertem): Promise<Ordertem> {
    const persistenceItem = OrderItemsMapper.toPeristence(item);
    const savedItem = await this.orderItemEntityRepository.save(
      persistenceItem,
      {
        reload: true,
      },
    );

    return OrderItemsMapper.toDomain(savedItem);
  }

  async remove(id: string): Promise<void> {
    await this.orderItemEntityRepository.delete(id);
  }
}

// bids
export class BidsRelationalRepository implements BidRepository {
  constructor(
    @InjectRepository(BidEntity)
    private bidEntityRepository: Repository<BidEntity>,
  ) {}

  async create(bid: Bid): Promise<Bid> {
    const persistenceBid = BidMapper.toPeristence(bid);
    const savedBid = await this.bidEntityRepository.save(persistenceBid);
    return BidMapper.toDomain(savedBid);
  }

  async findByID(id: string): Promise<Bid> {
    const bid = await this.bidEntityRepository.findOne({
      where: { bidID: id },
    });
    return bid ? BidMapper.toDomain(bid) : null;
  }

  async save(bid: Bid): Promise<Bid> {
    const persistenceBid = BidMapper.toPeristence(bid);
    const savedBid = await this.bidEntityRepository.save(persistenceBid, {
      reload: true,
    });

    return BidMapper.toDomain(savedBid);
  }

  async remove(id: string): Promise<void> {
    await this.bidEntityRepository.delete(id);
  }

  async update(id: string, bid: Partial<Bid>): Promise<Bid> {
    await this.bidEntityRepository.update(
      id,
      BidMapper.toPeristence(bid as Bid),
    );
    const updatedBid = await this.bidEntityRepository.findOne({
      where: { bidID: id },
    });
    return BidMapper.toDomain(updatedBid);
  }
}
