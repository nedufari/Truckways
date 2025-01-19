import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { GeneratorService } from 'src/utils/services/generator.service';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { ResponseService } from 'src/utils/services/response.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { PersitenceRelationalOrderModule } from './Infrastructure/Persistence/Relational/persitence.relational.order.module';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PaystackService } from 'src/Payment/paystack/paystack.service';
import { CustomAxiosService } from 'src/Payment/paystack/custom.axios-service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationsEntity]),
    PersitenceRelationalOrderModule,
  ],
  providers: [
    ResponseService,
    NotificationsService,
    CloudinaryService,
    JwtService,
    GeneratorService,
    GeoLocationService,
    OrderService,
    PaystackService,
    CustomAxiosService,
  ],
  controllers: [OrderController],
})
export class OrderModule {}
