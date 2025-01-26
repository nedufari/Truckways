import { Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from 'src/Enums/transaction.enum';
import { Wallet } from 'src/Rider/Domain/wallet';
import { RiderEntity } from 'src/Rider/Infrastructure/Persistence/Relational/Entity/rider.entity';
import {
  RiderRepository,
  TransactionRepository,
  WalletRepository,
} from 'src/Rider/Infrastructure/Persistence/rider-repository';
import { NotificationsService } from 'src/utils/services/notifications.service';
import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import { CashoutDto } from './dto/cashout.dto';
import { PaystackCustomer } from 'src/Payment/paystack/paystack-standard-response';
import { PaystackService } from 'src/Payment/paystack/paystack.service';
import { Transactions } from 'src/Rider/Domain/transaction';
import { PercentageConfigRepository } from 'src/Admin/Infrastructure/Persistence/admin-repository';
import { PercentageType } from 'src/Enums/percentage.enum';
import { GeneratorService } from 'src/utils/services/generator.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly RiderRepository: RiderRepository,
    private readonly percentageRepository:PercentageConfigRepository,
    private transactionRepository: TransactionRepository,
    private responseService: ResponseService,
    private notificationsService: NotificationsService,
    private paystackService: PaystackService,
    private generatorService:GeneratorService,
  ) {}

  //fund wallet
  //this will be funded from the webhook when payment has been confirmed, the admin will have one purse that all the money will go inside in
  async FundWallet(
    Rider: RiderEntity,
    orderAmount: number,
    orderReference: string,
  ): Promise<StandardResponse<Transactions>> {
    try {
      const wallet = await this.walletRepository.findByRiderID(Rider.riderID);
      if (!wallet) return this.responseService.notFound('Wallet not found');

      const percentage = await this.percentageRepository.findByType(PercentageType.RIDER_INITIAL_REMITTANCE)
      if (!percentage) return this.responseService.notFound('initial rider percenatge remitance not found')
      const transferAmount = orderAmount * percentage.percentage;

      //transaction
      const transactionID = `TrkT${await this.generatorService.generateUserID()}`;
      const transaction = await this.transactionRepository.create({
        id: 0,
        transactionID: transactionID,
        amount: transferAmount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.PENDING,
        reference: orderReference,
        description: 'Partial payment from order',
        createdAT: new Date(),
        rider: wallet.rider,
        metadata: {
          type: 'wallet_funding',
          orderReference: orderReference,
        },
      });
      await this.transactionRepository.save(transaction);

      await this.notificationsService.create({
        subject: 'Wallet Funding Initiated',
        message: `Processing credit of ${transferAmount} to your wallet`,
        account: wallet.rider.riderID,
      });

      return this.responseService.success(
        'Wallet funding initiated',
        transaction,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError('Error funding wallet');
    }
  }




  // Process successful wallet funding (called by webhook)
  async processFundingSuccess(
    reference: string,
    verifiedAmount: number,
  ): Promise<void> {
    try {
      const transaction = await this.transactionRepository.findByID(reference);

      if (!transaction || transaction.status !== TransactionStatus.PENDING) {
        throw new Error(
          `Invalid transaction or status for reference: ${reference}`,
        );
      }

      const wallet = await this.walletRepository.findByRiderID(
        transaction.rider.riderID,
      );

      if (!wallet) {
        throw new Error(`Wallet not found for transaction: ${reference}`);
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + verifiedAmount;
      wallet.updatedAT = new Date();
      await this.walletRepository.save(wallet);

      // Update transaction status
      transaction.status = TransactionStatus.SUCCESSFUL;
      await this.transactionRepository.save(transaction);

      // Send success notification
      await this.notificationsService.create({
        subject: 'Wallet Funded Successfully',
        message: `Your wallet has been credited with ${verifiedAmount}`,
        account: transaction.rider.id.toString(),
      });
    } catch (error) {
      console.error('Error processing wallet funding success:', error);
      // Send notification to admin about failed processing
      await this.notificationsService.create({
        subject: 'Wallet Funding Processing Error',
        message: `Error processing wallet funding for reference: ${reference}. Error: ${error.message}`,
        account: 'admin',
      });
      throw error;
    }
  }

  async cashout(
    rider: RiderEntity,
    dto: CashoutDto,
  ): Promise<StandardResponse<Transactions>> {
    try {
      const wallet = await this.walletRepository.findByRiderID(rider.riderID);

      if (!wallet) return this.responseService.badRequest('wallet not found');

      if (Number(wallet.balance) < dto.amount) {
        return this.responseService.badRequest('Insufficient wallet balance');
      }

      const customer: PaystackCustomer = {
        email: rider.email,
        full_name: rider.name,
        phone: rider.phoneNumber,
      };

      //initiate transfer with paystack
      const transferResponse = await this.paystackService.TransferToWallet(
        dto.amount,
        customer,
        wallet,
      );

      if (!transferResponse.data.status) {
        return this.responseService.badRequest('Transfer initiation failed');
      }

      //transaction
      const transactionID = `TrkT${await this.generatorService.generateUserID()}`;
      const transaction = await this.transactionRepository.create({
        id: 0,
        transactionID: transactionID,
        amount: dto.amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.PENDING,
        reference: transferResponse.data.reference,
        description: 'Withdraw to bank account',
        createdAT: new Date(),
        rider: wallet.rider,
        metadata: {
          type: 'wallet_funding',
          bankDetails:{
            bankCode:dto.bankCode,
            accountName:dto.accountName,
            accountNumber:dto.accountNumber

          },
          orderReference: transferResponse.data.reference,
        },
      });
      await this.transactionRepository.save(transaction);

      await this.notificationsService.create({
        subject: 'Fund Withdrawal Initiated',
        message: `Processing debit of ${dto.amount} to your bank account`,
        account: wallet.rider.riderID,
      });

      return this.responseService.success(
        'Wallet funding initiated',
        transaction,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error cashing out',
        error.message,
      );
    }
  }


   // Process successful withdrawal (called by webhook)
   async processWithdrawalSuccess(reference: string): Promise<void> {
    try {
        const transaction = await this.transactionRepository.findByReference(reference)

        if (!transaction || transaction.status !== TransactionStatus.PENDING) {
            throw new Error(`Invalid transaction or status for reference: ${reference}`);
        }

        const wallet = await this.walletRepository.findByRiderID(transaction.rider.riderID)
        if (!wallet) {
            throw new Error(`Wallet not found for transaction: ${reference}`);
        }

        // Update wallet balance
        wallet.balance = Number(wallet.balance) - transaction.amount;
        wallet.updatedAT = new Date();
        await this.walletRepository.save(wallet);

        // Update transaction status
        transaction.status = TransactionStatus.SUCCESSFUL;
        await this.transactionRepository.save(transaction);

        // Send success notification
        await this.notificationsService.create({
            subject: 'Withdrawal Successful',
            message: `Your withdrawal of ${transaction.amount} has been processed successfully`,
            account: transaction.rider.riderID
        });

    } catch (error) {
        console.error('Error processing withdrawal success:', error);
        // Send notification to admin about failed processing
        await this.notificationsService.create({
            subject: 'Withdrawal Processing Error',
            message: `Error processing withdrawal for reference: ${reference}. Error: ${error.message}`,
            account: 'admin'
        });
        throw error;
    }
}
  
}
