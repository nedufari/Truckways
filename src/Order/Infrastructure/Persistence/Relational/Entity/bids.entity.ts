import { ApiProperty } from '@nestjs/swagger';
import { BidStatus, BidTypeAccepted } from 'src/Enums/order.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'bids' })
export class BidEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({ nullable: true })
  bidID: string;

  @ApiProperty({ enum: BidStatus })
  @Column({ type: 'enum', enum: BidStatus, nullable: true })
  bidStatus: BidStatus;

  @ApiProperty()
  @Column({ nullable: true, type: 'timestamp' })
  createdAT: Date;

  @ApiProperty({ type: Number })
  @Column('numeric', { nullable: true })
  initialBid_value: number;

  @ApiProperty()
  @Column({ nullable: true, type: 'timestamp' })
  acceptedAT: Date;

  @ApiProperty()
  @Column({ nullable: true, type: 'timestamp' })
  declinedAT: Date;

  @ApiProperty({ type: Number })
  @Column('numeric', { nullable: true })
  counteredBid_value: number;

  @ApiProperty()
  @Column({ nullable: true, type: 'timestamp' })
  counteredAT: Date;

  @ApiProperty({ enum: BidTypeAccepted })
  @Column({ type: 'enum', enum: BidTypeAccepted, nullable: true })
  bidTypeAccepted:BidTypeAccepted

  @ApiProperty({ type: () => OrderEntity })
  @ManyToOne(() => OrderEntity, (order) => order.bid, { nullable: true }) // Many-to-one relationship with orders// This is optional; it creates a foreign key column in the BidEntity table
  order: OrderEntity;
}
