import { Bank } from 'src/Rider/Domain/bank';
import { BankEntity } from '../Entity/bank.entity';

export class BankMapper {
  static toDomain(raw: BankEntity): Bank {
    const domainEntity = new Bank();
    domainEntity.id = raw.id;
    domainEntity.bankID = raw.bankID;
    domainEntity.accountName = raw.accountName;
    domainEntity.accountNumber = raw.accountNumber;
    domainEntity.bankName = raw.bankName;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.owner = raw.owner;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Bank): BankEntity {
    const persistenceEntity = new BankEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.accountName = domainEntity.accountName;
    persistenceEntity.accountNumber = domainEntity.accountNumber;
    persistenceEntity.bankID = domainEntity.bankID;
    persistenceEntity.bankName = domainEntity.bankName;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.owner = domainEntity.owner;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    return persistenceEntity;
  }
}
