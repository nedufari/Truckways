import { Injectable } from '@nestjs/common';
import { PayStackConfig } from './paystack.config';
import {
  CustomAxiosResponse,
  CustomAxiosService,
} from './custom.axios-service';
import {
  InitializeTransactionResponse,
  PayStaackStandardResponse,
  PaystackCustomer,
  VerifyTransactionResponse,
} from './paystack-standard-response';
import { v4 as uuidv4 } from 'uuid';
import { OrderEntity } from 'src/Order/Infrastructure/Persistence/Relational/Entity/order.entity';

@Injectable()
export class PaystackService {
  private readonly _config: PayStackConfig;
  private readonly _axiosService: CustomAxiosService;
  constructor(private customAxiosService: CustomAxiosService) {
    //set tapi key in the header

    this._config = PayStackConfig.fromEnv();
    this._axiosService = this.customAxiosService;
    this._axiosService.init({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._config.secretKey}`,
    });
  }

  public PayForOrder = async (
    amount: number,
    customer: PaystackCustomer,
    order: OrderEntity,
  ) => {
    const reference = order.orderID;
    const response = await this._axiosService.post<
      PayStaackStandardResponse<InitializeTransactionResponse>
    >(`${this._config.baseUrl}/transaction/initialize`, {
      amount: amount * 100, // Convert to kobo (Paystack expects amount in kobo)
      email: customer.email,
      reference,
      //callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata: {
        customer_fields: {
          fullname: customer.full_name,
          phone: customer.phone,
        },
        type: 'truckways_order_delivery_payment',
      },
    });

    return response;
  };

  public verifyTransaction = async (reference: string) => {
    const response = await this._axiosService.get<
      PayStaackStandardResponse<VerifyTransactionResponse>
    >(`${this._config.baseUrl}/transaction/verify/${reference}`);

    return response;
  };
}
