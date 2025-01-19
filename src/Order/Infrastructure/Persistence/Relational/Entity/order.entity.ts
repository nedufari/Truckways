import { ApiProperty } from '@nestjs/swagger';
import { CustomerEntity } from 'src/Customer/Infrastructure/Persistence/Relational/Entity/customer.entity';
import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BidEntity } from './bids.entity';

@Entity({ name: 'orders' })
export class OrderEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  orderID: string;

  @ApiProperty({ type: Number })
  @Column('numeric', { nullable: true })
  accepted_bid: number;

  @ApiProperty({ type: () => [OrderItemsEntity] })
  @OneToMany(() => OrderItemsEntity, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItemsEntity[];

  @ApiProperty({ type: () => [BidEntity] })
  @OneToMany(() => BidEntity, bid => bid.order) // One-to-many relationship with bids
  bid: BidEntity[];

  @ApiProperty({ type: () => RiderEntity })
  @ManyToOne(() => RiderEntity, (rider) => rider.accepted_orders, {
    nullable: true,
  })
  Rider: RiderEntity;

  @ApiProperty({ type: () => CustomerEntity })
  @ManyToOne(() => CustomerEntity, (owner) => owner.my_orders)
  customer: CustomerEntity;

  @ApiProperty()
  @Column({nullable:true, type:'timestamp'})
  createdAT:Date
}

@Entity({ name: 'order-Items' })
export class OrderItemsEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  orderItemID: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  load_image: string;

  @ApiProperty({ type: Number })
  @Column('decimal', { nullable: true })
  load_value: number;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  load_type: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  truck_type: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  pickup_address: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  dropoff_address: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  recipient_name: string;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  recipient_number: string;

  @ApiProperty({ type: String })
  @Column('decimal', { nullable: true })
  initial_bid_value: number;

  @ApiProperty({ type: () => OrderEntity })
  @ManyToOne(() => OrderEntity, (cart) => cart.items)
  order: OrderEntity;
}
