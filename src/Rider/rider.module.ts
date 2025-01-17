import { Module } from '@nestjs/common';
import { RelationalPersistenceRiderModule } from './Infrastructure/Persistence/Relational/relational-persistence-rider.module';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { ResponseService } from 'src/utils/services/response.service';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { GeneratorService } from 'src/utils/services/generator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import { PersitenceRelationalOrderModule } from 'src/Order/Infrastructure/Persistence/Relational/persitence.relational.order.module';
import { RiderService } from './rider.service';
import { RiderController } from './rider.controller';

@Module({
  imports: [
    RelationalPersistenceRiderModule,
    PersitenceRelationalOrderModule,
    TypeOrmModule.forFeature([NotificationsEntity]),
  ],
  providers: [
    NotificationsService,
    ResponseService,
    CloudinaryService,
    GeneratorService,
    JwtService,
    GeoLocationService,
    RiderService,

  ],
  controllers: [RiderController],
})
export class RiderModule {}
