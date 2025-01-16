import { Module } from '@nestjs/common';
import { RelationalPersistenceRiderModule } from './Infrastructure/Persistence/Relational/relational-persistence-rider.module';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { ResponseService } from 'src/utils/services/response.service';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { GeneratorService } from 'src/utils/services/generator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    RelationalPersistenceRiderModule,
    TypeOrmModule.forFeature([NotificationsEntity]),
  ],
  providers: [
    NotificationsService,
    ResponseService,
    CloudinaryService,
    GeneratorService,
    JwtService,
  ],
  controllers: [],
})
export class RiderModule {}
