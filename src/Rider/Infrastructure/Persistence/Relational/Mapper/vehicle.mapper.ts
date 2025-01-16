import { Vehicle } from "src/Rider/Domain/vehicle";
import { VehicleEntity } from "../Entity/vehicle.entity";

export class VehicleMapper {
    static toDomain(raw: VehicleEntity): Vehicle {
      const domainEntity = new Vehicle();
      domainEntity.id = raw.id;
      domainEntity.owner = raw.owner;
      domainEntity.plateNumber = raw.plateNumber;
      domainEntity.vehicleDocuments = raw.vehicleDocuments;
      domainEntity.vehicleID = raw.vehicleID;
      domainEntity.vehiclePicture = raw.vehiclePicture;
      domainEntity.vehicleType = raw.vehicleType;
      domainEntity.createdAt = raw.createdAt;
      domainEntity.updatedAt = raw.updatedAt

    
      return domainEntity;
    }
  
    static toPersistence(domainEntity: Vehicle): VehicleEntity {
      const persistenceEntity = new VehicleEntity();
      if (domainEntity.id && typeof domainEntity.id === 'number') {
        persistenceEntity.id = domainEntity.id;
      }
      persistenceEntity.owner = domainEntity.owner;
      persistenceEntity.plateNumber= domainEntity.plateNumber;
      persistenceEntity.vehicleDocuments = domainEntity.vehicleDocuments;
      persistenceEntity.vehicleID = domainEntity.vehicleID;
      persistenceEntity.vehiclePicture = domainEntity.vehiclePicture;
      persistenceEntity.updatedAt = domainEntity.updatedAt;
      persistenceEntity.createdAt = domainEntity.createdAt;
      persistenceEntity.vehicleType = domainEntity.vehicleType
     
      return persistenceEntity;
    }
  }