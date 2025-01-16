import { Customer } from 'src/Customer/Domain/customer';
import { CustomerEntity } from '../Entity/customer.entity';

export class CustomerMapper {
  static toDomain(raw: CustomerEntity): Customer {
    const domainEntity = new Customer();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.address = raw.address;
    domainEntity.phoneNumber = raw.phoneNumber;
    domainEntity.altrnatePhoneNumber = raw.altrnatePhoneNumber;
    domainEntity.email = raw.email;
    domainEntity.password = raw.password;
    domainEntity.profilePicture = raw.profilePicture;
    domainEntity.resetPasswordToken = raw.resetPasswordToken;
    domainEntity.resetPasswordTokenExpTime = raw.resetPasswordTokenExpTime;
    domainEntity.createdAT = raw.createdAT;
    domainEntity.updatedAT = raw.updatedAT;
    domainEntity.customerID = raw.customerID;
    domainEntity.isVerified = raw.isVerified;
    domainEntity.role = raw.role;
    return domainEntity;
  }

  static toPerisitence(domainEntity: Customer): CustomerEntity {
    const persistenceEntity = new CustomerEntity();

    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.customerID = domainEntity.customerID;
    persistenceEntity.address = domainEntity.address;
    persistenceEntity.altrnatePhoneNumber = domainEntity.altrnatePhoneNumber;
    persistenceEntity.phoneNumber = domainEntity.phoneNumber;
    persistenceEntity.email = domainEntity.email;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.isVerified = domainEntity.isVerified;
    persistenceEntity.profilePicture = domainEntity.profilePicture;
    persistenceEntity.resetPasswordToken = domainEntity.resetPasswordToken;
    persistenceEntity.resetPasswordTokenExpTime =
      domainEntity.resetPasswordTokenExpTime;
    persistenceEntity.role = domainEntity.role;
    persistenceEntity.updatedAT = domainEntity.updatedAT;
    persistenceEntity.createdAT = domainEntity.createdAT;
    return persistenceEntity;
  }
}
