import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomAxiosService } from 'src/Payment/paystack/custom.axios-service';
import { PayStackConfig } from 'src/Payment/paystack/paystack.config';
import { PaystackService } from 'src/Payment/paystack/paystack.service';
import { RelationalPersistenceRiderModule } from 'src/Rider/Infrastructure/Persistence/Relational/relational-persistence-rider.module';
import { WalletService } from 'src/Rider/wallet/wallet.service';
import { ResponseService } from '../services/response.service';
import { NotificationsService } from '../services/notifications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsEntity } from '../shared-entities/notification.entity';
import { GeneratorService } from '../services/generator.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    RelationalPersistenceRiderModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([NotificationsEntity]),
  ],
  providers: [
    PaystackService,
    CustomAxiosService,
    WalletService,
    ResponseService,
    NotificationsService,
    GeneratorService,
    JwtService,
    {
      provide: PayStackConfig,
      useFactory: () => PayStackConfig.fromEnv(),
    },
  ],
  exports: [PayStackConfig, PaystackService, CustomAxiosService],
})
export class PaystackModule {}
