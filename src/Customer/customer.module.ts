import { Module } from '@nestjs/common';
import { RelationalPersistenceCustomerModule } from './Infrastructure/Persistence/Relational/relational-persistence-customer.module';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { ResponseService } from 'src/utils/services/response.service';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { GeneratorService } from 'src/utils/services/generator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { GeoLocationService } from 'src/utils/services/geolocation.service';

@Module({
  imports: [RelationalPersistenceCustomerModule, TypeOrmModule.forFeature([NotificationsEntity])],
  providers: [
    NotificationsService,
    ResponseService,
    CloudinaryService,
    GeneratorService,
    JwtService,
    CustomerService,
    GeoLocationService
  ],
  controllers: [CustomerController],
})
export class CustomerModule {}
