import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomAxiosService } from 'src/Payment/paystack/custom.axios-service';
import { PayStackConfig } from 'src/Payment/paystack/paystack.config';
import { PaystackService } from 'src/Payment/paystack/paystack.service';


@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    PaystackService, CustomAxiosService,
    {
      provide: PayStackConfig,
      useFactory: () => PayStackConfig.fromEnv(),
    },
  ],
  exports: [PayStackConfig,PaystackService,CustomAxiosService],
})
export class PaystackModule {}
