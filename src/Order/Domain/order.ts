import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { OrderItemsEntity } from '../Infrastructure/Persistence/Relational/Entity/order.entity';
import { BidEntity } from '../Infrastructure/Persistence/Relational/Entity/bids.entity';
import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
import { CustomerEntity } from 'src/Customer/Infrastructure/Persistence/Relational/Entity/customer.entity';

export class Order {
  @ApiProperty({ type: Number })
  @IsNumber()
  id: number;

  @ApiProperty({ type: String })
  @IsString()
  orderID: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  accepted_bid: number;

  @ApiProperty({ type: () => [OrderItemsEntity] })
  items: OrderItemsEntity[];

  @ApiProperty({ type: () => [BidEntity] })
  bid: BidEntity[];

  @ApiProperty({ type: () => RiderEntity })
  Rider: RiderEntity;

  @ApiProperty({ type: () => CustomerEntity })
  customer: CustomerEntity;

  @ApiProperty()
  createdAT:Date

}
