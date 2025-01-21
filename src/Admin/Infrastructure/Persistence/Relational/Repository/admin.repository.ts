import { InjectRepository } from '@nestjs/typeorm';
import { AdminRepository} from '../../admin-repository';
import { AdminEntity } from '../Entity/admin.entity';
import { Repository } from 'typeorm';
import { AdminMapper } from '../Mapper/customer.mapper';
import { Admin } from 'src/Admin/Domain/admin';
import { PaginationDto, SearchDto } from 'src/utils/shared-dto/pagination.dto';

export class AdminRelationalRepository implements AdminRepository {
  constructor(
    @InjectRepository(AdminEntity)
    private adminEntityRepository: Repository<AdminEntity>,
  ) {}

  async profile(admin: Admin): Promise<Admin> {
    const customerProfile = await this.adminEntityRepository.findOne({
      where: { adminID: admin.adminID},
    });
    return customerProfile ? AdminMapper.toDomain(customerProfile) : null;
  }

  async create(customer: Admin): Promise<Admin> {
    const persistenceCustomer = AdminMapper.toPerisitence(customer);
    const savedCustomer =
      await this.adminEntityRepository.save(persistenceCustomer);
    return AdminMapper.toDomain(savedCustomer);
  }

  async findByID(id: number): Promise<Admin> {
    const customer = await this.adminEntityRepository.findOne({
      where: { id: id },
    });
    return customer ? AdminMapper.toDomain(customer) : null;
  }

  async findByEmail(email: string): Promise<Admin> {
    const customer = await this.adminEntityRepository.findOne({
      where: { email: email },
    });
    return customer ? AdminMapper.toDomain(customer) : null;
  }

  async findbyPasswordResetToken(token: string): Promise<Admin> {
    const customer = await this.adminEntityRepository.findOne({
      where: { resetPasswordToken: token },
    });
    return customer ? AdminMapper.toDomain(customer) : null;
  }

  async find(dto: PaginationDto): Promise<{ data: Admin[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = dto;
    const [result, total] = await this.adminEntityRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['owner'],
    });
    const wallets = result.map(AdminMapper.toDomain);
    return { data: wallets, total };
  }

  async update(id: number, customer: Partial<Admin>): Promise<Admin> {
    await this.adminEntityRepository.update(
      id,
      AdminMapper.toPerisitence(customer as Admin),
    );
    const updatedCustomer = await this.adminEntityRepository.findOne({
      where: { id: id },
    });
    return AdminMapper.toDomain(updatedCustomer);
  }

  async remove(id: string): Promise<void> {
    await this.adminEntityRepository.delete(id);
  }

  async save(customer: Admin): Promise<Admin> {
    const persistenceCustomer = AdminMapper.toPerisitence(customer);
    const savedCustomer = await this.adminEntityRepository.save(
      persistenceCustomer,
      { reload: true },
    );

    return AdminMapper.toDomain(savedCustomer);
  }



  async searchAdmin(
    searchDto: SearchDto,
  ): Promise<{ data: Admin[]; total: number }> {
    const { keyword, page, Perpage, sort, sortOrder } = searchDto;

    const qb = this.adminEntityRepository.createQueryBuilder('admin');

    if (keyword) {
      qb.where('admin.name ILIKE :keyword', { keyword: `%${keyword}%` });
      qb.orWhere('admin.adminID ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
      qb.orWhere('admin.email ILIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // Sorting
    qb.orderBy(`admin.${sort}`, sortOrder);

    // Pagination
    if (page && Perpage) {
      qb.skip((page - 1) * Perpage).take(Perpage);
    }

    // Execute the query
    const [admins, total] = await qb.getManyAndCount();

    return { data: admins, total };
  }
}
