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
import { WalletEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/wallet.entity';


interface TransferRecipientParams {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}

interface TransferParams {
  amount: number;
  recipientCode: string;
  reference: string;
}


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





  public TransferToWallet = async (
    amount: number,
    customer: PaystackCustomer,
    wallet: WalletEntity,
  ) => {
    const reference = wallet.walletAddrress;
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
        type: 'wallet_transfer',
      },
    });

    return response;
  };

  async createTransferRecipient(details: TransferRecipientParams) {
    return this.customAxiosService.post<any>(`${this._config.baseUrl}/transferrecipient`, {
      type: 'nuban',
      name: details.accountName,
      account_number: details.accountNumber,
      bank_code: details.bankCode,
      currency: 'NGN'
    });
  }

  async initiateTransfer(params: TransferParams) {
    return this.customAxiosService.post<any>(`${this._config.baseUrl}/transfer`, {
      source: 'balance',
      amount: params.amount * 100,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: 'Wallet withdrawal'
    });
  }


  public verifyTransaction = async (reference: string) => {
    const response = await this._axiosService.get<
      PayStaackStandardResponse<VerifyTransactionResponse>
    >(`${this._config.baseUrl}/transaction/verify/${reference}`);

    return response;
  };
}
