import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderEntity } from './Entity/rider.entity';
import {
  BankRepository,
  RiderRepository,
  VehicleRepository,
  WalletRepository,
} from '../rider-repository';
import {
  BankRelationalRepository,
  RiderRelationalRepository,
  VehicleRelationalRepository,
  WalletRelationalRepository,
} from './Repository/rider.repository';
import { VehicleEntity } from './Entity/vehicle.entity';
import { BankEntity } from './Entity/bank.entity';
import { WalletEntity } from './Entity/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiderEntity,
      VehicleEntity,
      BankEntity,
      WalletEntity,
    ]),
  ],
  providers: [
    {
      provide: RiderRepository,
      useClass: RiderRelationalRepository,
    },
    {
      provide: VehicleRepository,
      useClass: VehicleRelationalRepository,
    },
    {
      provide: BankRepository,
      useClass: BankRelationalRepository,
    },
    {
      provide: WalletRepository,
      useClass: WalletRelationalRepository,
    },
  ],
  exports:[RiderRepository,BankRepository,VehicleRepository,WalletRepository]
})
export class RelationalPersistenceRiderModule {}
