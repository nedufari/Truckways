import { InjectRepository } from '@nestjs/typeorm';
import {
  BankRepository,
  RiderRepository,
  RidesRepository,
  TransactionRepository,
  VehicleRepository,
  WalletRepository,
} from '../../rider-repository';
import { Repository } from 'typeorm';
import { RiderMapper } from '../Mapper/rider.mapper';
import { RiderEntity } from '../Entity/rider.entity';
import { Rider } from 'src/Rider/Domain/rider';
import { PaginationDto, SearchDto } from 'src/utils/shared-dto/pagination.dto';
import { VehicleEntity } from '../Entity/vehicle.entity';
import { Vehicle } from 'src/Rider/Domain/vehicle';
import { VehicleMapper } from '../Mapper/vehicle.mapper';
import { BankEntity } from '../Entity/bank.entity';
import { Bank } from 'src/Rider/Domain/bank';
import { BankMapper } from '../Mapper/bank.mapper';
import { WalletEntity } from '../Entity/wallet.entity';
import { Wallet } from 'src/Rider/Domain/wallet';
import { WalletMapper } from '../Mapper/wallet.mapper';
import { Transactions } from 'src/Rider/Domain/transaction';
import { TransactionMapper } from '../Mapper/transaction.mapper';
import { TransactionEntity } from '../Entity/transaction.entity';
import { Rides } from 'src/Rider/Domain/rides';
import { RidesMapper } from '../Mapper/rides.mapper';
import { RidesEntity } from '../Entity/rides.entity';

export class RiderRelationalRepository implements RiderRepository {
  constructor(
    @InjectRepository(RiderEntity)
    private riderEntityRepository: Repository<RiderEntity>,
  ) {}

  async profile(rider: Rider): Promise<Rider> {
    const riderProfile = await this.riderEntityRepository.findOne({
      where: { riderID: rider.riderID },
      relations: ['my_wallet', 'vehicle', 'bank_details'],
    });
    return riderProfile ? RiderMapper.toDomain(riderProfile) : null;
  }

  async create(rider: Rider): Promise<Rider> {
    const persistenceRider = RiderMapper.toPerisitence(rider);
    const savedRider = await this.riderEntityRepository.save(persistenceRider);
    return RiderMapper.toDomain(savedRider);
  }

  async findByID(id: number): Promise<Rider> {
    const rider = await this.riderEntityRepository.findOne({
      where: { id: id },
    });
    return rider ? RiderMapper.toDomain(rider) : null;
  }

  async findByEmail(email: string): Promise<Rider> {
    const rider = await this.riderEntityRepository.findOne({
      where: { email: email },
    });
    return rider ? RiderMapper.toDomain(rider) : null;
  }

  async findbyPasswordResetToken(token: string): Promise<Rider> {
    const rider = await this.riderEntityRepository.findOne({
      where: { resetPasswordToken: token },
    });
    return rider ? RiderMapper.toDomain(rider) : null;
  }

  async find(dto: PaginationDto): Promise<{ data: Rider[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.riderEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['wallet', 'vehicle'],
    });
    const riders = result.map(RiderMapper.toDomain);
    return { data: riders, total };
  }

  async update(id: number, rider: Partial<Rider>): Promise<Rider> {
    await this.riderEntityRepository.update(
      id,
      RiderMapper.toPerisitence(rider as Rider),
    );
    const updatedRider = await this.riderEntityRepository.findOne({
      where: { id: id },
    });
    return RiderMapper.toDomain(updatedRider);
  }

  async remove(id: string): Promise<void> {
    await this.riderEntityRepository.delete(id);
  }

  async save(rider: Rider): Promise<Rider> {
    const persistenceRider = RiderMapper.toPerisitence(rider);
    const savedRider = await this.riderEntityRepository.save(persistenceRider, {
      reload: true,
    });

    return RiderMapper.toDomain(savedRider);
  }

  async searchRider(
    searchDto: SearchDto,
  ): Promise<{ data: Rider[]; total: number }> {
    const { keyword, page, Perpage, sort, sortOrder } = searchDto;

    const qb = this.riderEntityRepository.createQueryBuilder('rider');

    if (keyword) {
      qb.where('rider.name ILIKE :keyword', { keyword: `%${keyword}%` });
      qb.orWhere('rider.riderID ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('rider.email ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // Sorting
    qb.orderBy(`rider.${sort}`, sortOrder);

    // Pagination
    if (page && Perpage) {
      qb.skip((page - 1) * Perpage).take(Perpage);
    }

    // Execute the query
    const [riders, total] = await qb.getManyAndCount();

    return { data: riders, total };
  }
}

//vehicle

export class VehicleRelationalRepository implements VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private vehicleEntityRepository: Repository<VehicleEntity>,
  ) {}

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const persistenceVehicle = VehicleMapper.toPersistence(vehicle);
    const savedVehicle =
      await this.vehicleEntityRepository.save(persistenceVehicle);
    return VehicleMapper.toDomain(savedVehicle);
  }

  async findByID(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleEntityRepository.findOne({
      where: { vehicleID: id },
    });
    return vehicle ? VehicleMapper.toDomain(vehicle) : null;
  }

  async find(dto: PaginationDto): Promise<{ data: Vehicle[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.vehicleEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['accepted_orders', 'vehicle', 'bank_details'],
    });
    const vehicles = result.map(VehicleMapper.toDomain);
    return { data: vehicles, total };
  }

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    await this.vehicleEntityRepository.update(
      id,
      VehicleMapper.toPersistence(vehicle as Vehicle),
    );
    const updatedVehicle = await this.vehicleEntityRepository.findOne({
      where: { vehicleID: id },
    });
    return VehicleMapper.toDomain(updatedVehicle);
  }

  async remove(id: string): Promise<void> {
    await this.vehicleEntityRepository.delete(id);
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const persistenceRider = VehicleMapper.toPersistence(vehicle);
    const savedVehicle = await this.vehicleEntityRepository.save(
      persistenceRider,
      { reload: true },
    );

    return VehicleMapper.toDomain(savedVehicle);
  }

  async searchVehicle(
    searchDto: SearchDto,
  ): Promise<{ data: Vehicle[]; total: number }> {
    const { keyword, page, Perpage, sort, sortOrder } = searchDto;

    const qb = this.vehicleEntityRepository.createQueryBuilder('vehicle');

    if (keyword) {
      qb.where('vehicle.vehicleType ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('vehicle.vehicleID ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('vehicle.plateNumber ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // Sorting
    qb.orderBy(`vehicle.${sort}`, sortOrder);

    // Pagination
    if (page && Perpage) {
      qb.skip((page - 1) * Perpage).take(Perpage);
    }

    // Execute the query
    const [vehicles, total] = await qb.getManyAndCount();

    return { data: vehicles, total };
  }
}

//bank
export class BankRelationalRepository implements BankRepository {
  constructor(
    @InjectRepository(BankEntity)
    private bankEntityRepository: Repository<BankEntity>,
  ) {}

  async create(bank: Bank): Promise<Bank> {
    const persistenceBank = BankMapper.toPersistence(bank);
    const savedVehicle = await this.bankEntityRepository.save(persistenceBank);
    return BankMapper.toDomain(savedVehicle);
  }

  async findByID(id: string): Promise<Bank> {
    const bank = await this.bankEntityRepository.findOne({
      where: { bankID: id },
    });
    return bank ? BankMapper.toDomain(bank) : null;
  }

  async find(dto: PaginationDto): Promise<{ data: Bank[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.bankEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['owner'],
    });
    const banks = result.map(BankMapper.toDomain);
    return { data: banks, total };
  }

  async update(id: string, bank: Partial<Bank>): Promise<Bank> {
    await this.bankEntityRepository.update(
      id,
      BankMapper.toPersistence(bank as Bank),
    );
    const updatedBank = await this.bankEntityRepository.findOne({
      where: { bankID: id },
    });
    return BankMapper.toDomain(updatedBank);
  }

  async remove(id: string): Promise<void> {
    await this.bankEntityRepository.delete(id);
  }

  async save(bank: Bank): Promise<Bank> {
    const persistenceBank = BankMapper.toPersistence(bank);
    const savedBank = await this.bankEntityRepository.save(persistenceBank, {
      reload: true,
    });

    return BankMapper.toDomain(savedBank);
  }
}

//wallet
export class WalletRelationalRepository implements WalletRepository {
  constructor(
    @InjectRepository(WalletEntity)
    private walletEntityRepository: Repository<WalletEntity>,
  ) {}

  async create(wallet: Wallet): Promise<Wallet> {
    const persistenceWallet = WalletMapper.toPersistence(wallet);
    const savedWallet =
      await this.walletEntityRepository.save(persistenceWallet);
    return WalletMapper.toDomain(savedWallet);
  }

  async findByID(id: string): Promise<Wallet> {
    const wallet = await this.walletEntityRepository.findOne({
      where: { walletAddrress: id },
    });
    return wallet ? WalletMapper.toDomain(wallet) : null;
  }

  async findByRiderID(id: string): Promise<Wallet> {
    const wallet = await this.walletEntityRepository.findOne({
      where: { rider: { riderID: id } },
      relations: ['rider'],
    });
    return wallet ? WalletMapper.toDomain(wallet) : null;
  }

  async find(dto: PaginationDto): Promise<{ data: Wallet[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.walletEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['owner'],
    });
    const wallets = result.map(WalletMapper.toDomain);
    return { data: wallets, total };
  }

  async update(id: string, wallet: Partial<Wallet>): Promise<Wallet> {
    await this.walletEntityRepository.update(
      id,
      WalletMapper.toPersistence(wallet as Wallet),
    );
    const updatedWallet = await this.walletEntityRepository.findOne({
      where: { walletAddrress: id },
    });
    return WalletMapper.toDomain(updatedWallet);
  }

  async remove(id: string): Promise<void> {
    await this.walletEntityRepository.delete(id);
  }

  async save(wallet: Wallet): Promise<Wallet> {
    const persistenceWallet = WalletMapper.toPersistence(wallet);
    const savedWallet = await this.walletEntityRepository.save(
      persistenceWallet,
      { reload: true },
    );

    return WalletMapper.toDomain(savedWallet);
  }
}

export class TransactionRelationalRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionEntityRepository: Repository<TransactionEntity>,
  ) {}

  async create(transaction: Transactions): Promise<Transactions> {
    const persistencetransaction = TransactionMapper.toPersistence(transaction);
    const savedTransaction = await this.transactionEntityRepository.save(
      persistencetransaction,
    );
    return TransactionMapper.toDomain(savedTransaction);
  }

  async findByID(id: string): Promise<Transactions> {
    const wallet = await this.transactionEntityRepository.findOne({
      where: { transactionID: id },
    });
    return wallet ? TransactionMapper.toDomain(wallet) : null;
  }

  async findByReference(reference: string): Promise<Transactions> {
    const wallet = await this.transactionEntityRepository.findOne({
      where: { reference: reference },
    });
    return wallet ? TransactionMapper.toDomain(wallet) : null;
  }

  async find(
    dto: PaginationDto,
  ): Promise<{ data: Transactions[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.transactionEntityRepository.findAndCount(
      {
        skip: (page - 1) * limit,
        take: limit,
        order: { [sortBy]: sortOrder },
        relations: ['rider'],
      },
    );
    const wallets = result.map(TransactionMapper.toDomain);
    return { data: wallets, total };
  }

  async save(transaction: Transactions): Promise<Transactions> {
    const persistenceWallet = TransactionMapper.toPersistence(transaction);
    const savedWallet = await this.transactionEntityRepository.save(
      persistenceWallet,
      { reload: true },
    );

    return TransactionMapper.toDomain(savedWallet);
  }


  async searchTransactions(
    searchDto: SearchDto,
  ): Promise<{ data: Transactions[]; total: number }> {
    const { keyword, page, Perpage, sort, sortOrder } = searchDto;

    const qb = this.transactionEntityRepository.createQueryBuilder('tran');

    if (keyword) {
      qb.where('tran.transactionID ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('tran.walletAddrress ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('tran.description ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('tran.reference ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // Sorting
    qb.orderBy(`tran.${sort}`, sortOrder);

    // Pagination
    if (page && Perpage) {
      qb.skip((page - 1) * Perpage).take(Perpage);
    }

    // Execute the query
    const [transactions, total] = await qb.getManyAndCount();

    return { data: transactions, total };
  }

}

  export class RidesRelationalRepository implements RidesRepository {
    constructor(
      @InjectRepository(RidesEntity)
      private ridesEntityRepository: Repository<RidesEntity>,
    ) {}
  
    async create(transaction: Rides): Promise<Rides> {
      const persistencetransaction = RidesMapper.toPerisitence(transaction);
      const savedTransaction = await this.ridesEntityRepository.save(
        persistencetransaction,
      );
      return RidesMapper.toDomain(savedTransaction);
    }
  
    async findByID(id: string): Promise<Rides> {
      const wallet = await this.ridesEntityRepository.findOne({
        where: { ridesID: id },
      });
      return wallet ? RidesMapper.toDomain(wallet) : null;
    }
  
  
  
    async find(
      dto: PaginationDto,
    ): Promise<{ data: Rides[]; total: number }> {
      const { page, limit, sortBy, sortOrder } = dto;
      const [result, total] = await this.ridesEntityRepository.findAndCount(
        {
          skip: (page - 1) * limit,
          take: limit,
          order: { [sortBy]: sortOrder },
          relations: ['rider','order'],
        },
      );
      const wallets = result.map(RidesMapper.toDomain);
      return { data: wallets, total };
    }
  
    async save(transaction: Rides): Promise<Rides> {
      const persistenceWallet = RidesMapper.toPerisitence(transaction);
      const savedWallet = await this.ridesEntityRepository.save(
        persistenceWallet,
        { reload: true },
      );
  
      return RidesMapper.toDomain(savedWallet);
    }
  
  
    async searchRides(
      searchDto: SearchDto,
    ): Promise<{ data: Rides[]; total: number }> {
      const { keyword, page, Perpage, sort, sortOrder } = searchDto;
  
      const qb = this.ridesEntityRepository.createQueryBuilder('ride');
  
      if (keyword) {
        qb.where('ride.ridesID ILIKE :keyword', {
          keyword: `%${keyword}%`,
        });
   
      }
  
      // Sorting
      qb.orderBy(`ride.${sort}`, sortOrder);
  
      // Pagination
      if (page && Perpage) {
        qb.skip((page - 1) * Perpage).take(Perpage);
      }
  
      // Execute the query
      const [rides, total] = await qb.getManyAndCount();
  
      return { data: rides, total };
    }


    async update(id: number, wallet: Partial<Rides>): Promise<Rides> {
      await this.ridesEntityRepository.update(
        id,
        WalletMapper.toPersistence(wallet as Wallet),
      );
      const updatedWallet = await this.ridesEntityRepository.findOne({
        where: { id: id },
      });
      return RidesMapper.toDomain(updatedWallet);
    }
}
