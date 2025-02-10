// wallet.service.ts
import { Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from 'src/Enums/transaction.enum';
import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
import {
  TransactionRepository,
  WalletRepository,
} from 'src/Rider/Infrastructure/Persistence/rider-repository';
import { NotificationsService } from 'src/utils/services/notifications.service';
import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import { CashoutDto } from './dto/cashout.dto';
import { PaystackService } from 'src/Payment/paystack/paystack.service';
import { PercentageConfigRepository } from 'src/Admin/Infrastructure/Persistence/admin-repository';
import { GeneratorService } from 'src/utils/services/generator.service';
import { Transactions } from '../Domain/transaction';
import { PercentageType } from 'src/Enums/percentage.enum';
import { OrderRepository } from 'src/Order/Infrastructure/Persistence/all-order-repositories';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly percentageRepository: PercentageConfigRepository,
    private readonly orderRepository: OrderRepository,
    private transactionRepository: TransactionRepository,
    private responseService: ResponseService,
    private notificationsService: NotificationsService,
    private paystackService: PaystackService,
    private generatorService: GeneratorService,
  ) {}

  async FundWallet(
    RiderID: string,
    orderId: string,
  ): Promise<StandardResponse<any>> {
    try {
      const order = await this.orderRepository.findByID(orderId);
      if (!order) return this.responseService.notFound('order not found');
      const existingTransaction =
        await this.transactionRepository.findByReference(order.orderID);
      if (existingTransaction) {
        return this.responseService.badRequest('Transaction already exists');
      }

      const wallet = await this.walletRepository.findByRiderID(RiderID);
      if (!wallet) return this.responseService.notFound('Wallet not found');

      const percentage = await this.percentageRepository.findByType(
        PercentageType.RIDER_INITIAL_REMITTANCE,
      );
      if (!percentage)
        return this.responseService.notFound(
          'Initial rider percentage remittance not found',
        );

      const transferAmount = order.accepted_bid * percentage.percentage;
      const transactionID = `TrkT${await this.generatorService.generateUserID()}`;

      const transaction = await this.transactionRepository.create({
        transactionID,
        amount: transferAmount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        walletAddrress: wallet.walletAddrress,
        reference: order.orderID,
        description: 'Partial payment from order',
        rider: order.Rider,
        metadata: { type: 'wallet_funding', orderReference: order.orderID },
        id: 0,
        createdAT: new Date(),
      });

      await this.transactionRepository.save(transaction);

      await this.notificationsService.create({
        subject: 'Wallet Funding Initiated',
        message: `Processing credit of ${transferAmount} to your wallet`,
        account: order.Rider.riderID,
      });

      return this.responseService.success(
        'Wallet funding initiated',
        transaction,
      );
    } catch (error) {
      console.error('FundWallet Error:', error);
      return this.responseService.internalServerError('Error funding wallet');
    }
  }

  async processFundingSuccess(
    reference: string,
    verifiedAmount: number,
  ): Promise<void> {
    await this.transactionRepository.executeWithTransaction(
      async (repository) => {
        const transaction = await repository.findOne({
          where: { reference },
          lock: { mode: 'pessimistic_write' },
        });

        if (!transaction || transaction.status !== TransactionStatus.PENDING) {
          throw new Error(`Invalid transaction for reference: ${reference}`);
        }

        if (verifiedAmount !== transaction.amount) {
          throw new Error(
            `Amount mismatch: Expected ${transaction.amount}, got ${verifiedAmount}`,
          );
        }

        const wallet = await this.walletRepository.findByRiderID(
          transaction.rider.riderID,
        );
        if (!wallet) throw new Error(`Wallet not found for ${reference}`);

        wallet.balance = Number(wallet.balance) + verifiedAmount;
        await this.walletRepository.save(wallet);

        transaction.status = TransactionStatus.SUCCESSFUL;
        await repository.save(transaction);

        await this.notificationsService.create({
          subject: 'Wallet Funded Successfully',
          message: `Your wallet has been credited with ${verifiedAmount}`,
          account: transaction.rider.riderID,
        });
      },
    );
  }

  async cashout(
    rider: RiderEntity,
    dto: CashoutDto,
  ): Promise<StandardResponse<any>> {
    return this.transactionRepository.executeWithTransaction(
      async (repository) => {
        try {
          const wallet = await this.walletRepository.findByRiderID(
            rider.riderID,
          );
          if (!wallet) return this.responseService.notFound('Wallet not found');
          if (Number(wallet.balance) < dto.amount) {
            return this.responseService.badRequest('Insufficient balance');
          }

          const recipientResponse =
            await this.paystackService.createTransferRecipient({
              accountNumber: dto.accountNumber,
              bankCode: dto.bankCode,
              accountName: dto.accountName,
            });

          if (!recipientResponse.data.recipient_code) {
            return this.responseService.badRequest(
              'Failed to create transfer recipient',
            );
          }

          const transferResponse = await this.paystackService.initiateTransfer({
            amount: dto.amount,
            recipientCode: recipientResponse.data.recipient_code,
            reference: `CT-${await this.generatorService.generateUserID()}`,
          });

          if (!transferResponse.data.status) {
            return this.responseService.badRequest(
              'Transfer initiation failed',
            );
          }

          const transaction = await this.transactionRepository.create({
            transactionID: `TrkW${await this.generatorService.generateUserID()}`,
            amount: dto.amount,
            type: TransactionType.DEBIT,
            status: TransactionStatus.PENDING,
            reference: transferResponse.data.reference,
            description: 'Withdraw to bank account',
            rider: rider,
            metadata: {
              type: 'withdrawal',
              bankDetails: {
                bankCode: dto.bankCode,
                accountNumber: dto.accountNumber,
                accountName: dto.accountName,
              },
              //transferReference: transferResponse.data.reference,
            },
            id: 0,
            createdAT: new Date(),
          });

          await this.transactionRepository.save(transaction);

          await this.notificationsService.create({
            subject: 'Withdrawal Initiated',
            message: `Processing withdrawal of ${dto.amount}`,
            account: rider.riderID,
          });

          return this.responseService.success(
            'Withdrawal initiated',
            transaction,
          );
        } catch (error) {
          console.error('Cashout Error:', error);
          return this.responseService.internalServerError(
            'Withdrawal processing failed',
          );
        }
      },
    );
  }

  async processWithdrawalSuccess(reference: string): Promise<void> {
    await this.transactionRepository.executeWithTransaction(
      async (repository) => {
        const transaction = await repository.findOne({
          where: { reference },
          lock: { mode: 'pessimistic_write' },
        });

        if (!transaction || transaction.status !== TransactionStatus.PENDING) {
          throw new Error(`Invalid transaction for reference: ${reference}`);
        }

        const wallet = await this.walletRepository.findByRiderID(
          transaction.rider.riderID,
        );
        if (!wallet) throw new Error(`Wallet not found for ${reference}`);

        wallet.balance = Number(wallet.balance) - transaction.amount;
        await this.walletRepository.save(wallet);

        transaction.status = TransactionStatus.SUCCESSFUL;
        await repository.save(transaction);

        await this.notificationsService.create({
          subject: 'Withdrawal Successful',
          message: `Withdrawn ${transaction.amount} successfully`,
          account: transaction.rider.riderID,
        });
      },
    );
  }
}
