import { InjectRepository } from '@nestjs/typeorm';
import { CustomerRepository } from '../../customer-repository';
import { CustomerEntity } from '../Entity/customer.entity';
import { Repository } from 'typeorm';
import { Customer } from 'src/Customer/Domain/customer';
import { CustomerMapper } from '../Mapper/customer.mapper';

export class CustomerRelationalRepository implements CustomerRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private customerEntityRepository: Repository<CustomerEntity>,
  ) {}

  async profile(customer: Customer): Promise<Customer> {
    const customerProfile = await this.customerEntityRepository.findOne({
      where: { customerID: customer.customerID },
      relations: ['my_cart'],
    });
    return customerProfile ? CustomerMapper.toDomain(customerProfile) : null;
  }

  async create(customer: Customer): Promise<Customer> {
    const persistenceCustomer = CustomerMapper.toPerisitence(customer);
    const savedCustomer =
      await this.customerEntityRepository.save(persistenceCustomer);
    return CustomerMapper.toDomain(savedCustomer);
  }

  async findByID(id: number): Promise<Customer> {
    const customer = await this.customerEntityRepository.findOne({
      where: { id: id },
    });
    return customer ? CustomerMapper.toDomain(customer) : null;
  }

  async findByEmail(email: string): Promise<Customer> {
    const customer = await this.customerEntityRepository.findOne({
      where: { email: email },
    });
    return customer ? CustomerMapper.toDomain(customer) : null;
  }

  async findbyPasswordResetToken(token: string): Promise<Customer> {
    const customer = await this.customerEntityRepository.findOne({
      where: { resetPasswordToken: token },
    });
    return customer ? CustomerMapper.toDomain(customer) : null;
  }

  async find(): Promise<Customer[]> {
    const customers = await this.customerEntityRepository.find();
    const result = customers.map(CustomerMapper.toDomain);
    return result;
  }

  async update(id: number, customer: Partial<Customer>): Promise<Customer> {
    await this.customerEntityRepository.update(
      id,
      CustomerMapper.toPerisitence(customer as Customer),
    );
    const updatedCustomer = await this.customerEntityRepository.findOne({
      where: { id: id },
    });
    return CustomerMapper.toDomain(updatedCustomer);
  }

  async remove(id: string): Promise<void> {
    await this.customerEntityRepository.delete(id);
  }

  async save(customer: Customer): Promise<Customer> {
    const persistenceCustomer = CustomerMapper.toPerisitence(customer);
    const savedCustomer = await this.customerEntityRepository.save(
      persistenceCustomer,
      { reload: true },
    );

    return CustomerMapper.toDomain(savedCustomer);
  }
}
