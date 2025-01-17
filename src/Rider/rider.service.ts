import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BankRepository,
  RiderRepository,
  VehicleRepository,
  WalletRepository,
} from './Infrastructure/Persistence/rider-repository';
import {
  ResponseService,
  StandardResponse,
} from 'src/utils/services/response.service';
import { CloudinaryService } from 'src/utils/services/cloudinary.service';
import { NotificationsService } from 'src/utils/services/notifications.service';
import { GeoLocationService } from 'src/utils/services/geolocation.service';
import { RiderEntity } from './Infrastructure/Persistence/Relational/Entity/rider.entity';
import { Rider } from './Domain/rider';
import { updateRiderProfileDto } from './Dto/update-rider.dto';
import { Multer } from 'multer';
import { VehicleDto } from './Dto/vehicle-profile.dto';
import { Vehicle } from './Domain/vehicle';
import { GeneratorService } from 'src/utils/services/generator.service';
import { BankDto } from './Dto/payment-profile.dto';
import { Bank } from './Domain/bank';
import { NotificationListResponse } from 'src/utils/Types/notification.responsetypes';
import { NotificationsEntity } from 'src/utils/shared-entities/notification.entity';
import { markMultipleNotificationsAsReadDto } from 'src/utils/shared-dto/notification.dto';
import { BidRepository } from 'src/Order/Infrastructure/Persistence/all-order-repositories';
@Injectable()
export class RiderService {
  constructor(
    private riderRepository: RiderRepository,
    private bankRepository: BankRepository,
    private walletRepository: WalletRepository,
    private vehicleRepository: VehicleRepository,
    private responseService: ResponseService,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
    private geolocationService: GeoLocationService,
    private generatorService: GeneratorService,
    private bidRepository:BidRepository
  ) {}


  //notifications 

  async fetchAllNotifications(
    rider: RiderEntity,
    query?: { page?: number; limit?: number },
  ): Promise<StandardResponse<NotificationListResponse>> {
    try {
      if (!rider?.riderID) {
        return this.responseService.badRequest('Invalid rider ID provided');
      }

      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 10;

      const { notifications, count, unreadCount } =
        await this.notificationsService.fetchAll(rider.riderID, {
          page,
          limit,
        });

      const totalPages = Math.ceil(count / limit);

      const response: NotificationListResponse = {
        data: notifications,
        count,
        unreadCount,
        currentPage: page,
        totalPages,
      };

      return this.responseService.success(
        notifications.length
          ? 'Notifications retrieved successfully'
          : 'No notifications found for this rider',
        response,
      );
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error occurred';

      // Log the error for debugging
      console.error('Notification fetch error:', {
        planner: rider.riderID,
        error: errorMessage,
        stack: error?.stack,
      });

      return this.responseService.internalServerError(
        'Error while fetching notifications',
        errorMessage,
      );
    }
  }

  async markNotificationAsRead(
    rider: RiderEntity,
    notificationId: string,
  ): Promise<StandardResponse<NotificationsEntity>> {
    try {
      if (!rider?.riderID) {
        return this.responseService.badRequest('Invalid rider ID provided');
      }

      const updatedNotification = await this.notificationsService.markAsRead(
        notificationId,
        rider.riderID,
      );

      return this.responseService.success(
        'Notification marked as read successfully',
        updatedNotification,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.responseService.notFound(error.message);
      }

      console.error('Error marking notification as read:', {
        customer: rider.riderID,
        notificationId,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking notification as read',
        error.message,
      );
    }
  }

  async markMultipleNotificationsAsRead(
    rider: RiderEntity,
    dto: markMultipleNotificationsAsReadDto,
  ): Promise<StandardResponse<void>> {
    try {
      if (!rider?.riderID) {
        return this.responseService.badRequest('Invalid rider ID provided');
      }

      if (
        !Array.isArray(dto.notificationIds) ||
        dto.notificationIds.length === 0
      ) {
        return this.responseService.badRequest(
          'Please provide valid notification IDs',
        );
      }

      await this.notificationsService.markMultipleAsRead(
        dto.notificationIds,
        rider.riderID,
      );

      return this.responseService.success(
        'Notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking multiple notifications as read:', {
        customer: rider.riderID,
        dto,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking notifications as read',
        error.message,
      );
    }
  }

  async markAllNotificationsAsRead(
    rider: RiderEntity,
  ): Promise<StandardResponse<void>> {
    try {
      if (!rider?.riderID) {
        return this.responseService.badRequest('Invalid riderID provided');
      }

      await this.notificationsService.markAllAsRead(rider.riderID);

      return this.responseService.success(
        'All notifications marked as read successfully',
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', {
        customer: rider.riderID,
        error: error.message,
        stack: error.stack,
      });

      return this.responseService.internalServerError(
        'Error marking all notifications as read',
        error.message,
      );
    }
  }




  //onboarding

  async PersonalProfile(
    rider: RiderEntity,
    dto: updateRiderProfileDto,
    mediafile: Express.Multer.File[],
  ): Promise<StandardResponse<Rider>> {
    try {
      const fileUploadPromises = mediafile.map((file) =>
        this.cloudinaryService.uploadFile(file),
      );

      const uploadResults = await Promise.all(fileUploadPromises);
      const driverlicencefront = uploadResults[0].secure_url;
      const driverlicenceback = uploadResults[1].secure_url;

      // Create a copy of the rider without the address first
      const { address: _, ...RiderWithoutAddress } = rider;

      // Create base update object
      const updateObject: any = {
        ...RiderWithoutAddress,
        ...dto,
        driversLicenceFront: driverlicencefront,
        driversLicenceBack: driverlicenceback,
        updatedAT: new Date(),
      };

      // Handle email check
    //   if (dto.email) {
    //     const checkemail = await this.riderRepository.findByEmail(dto.email);
    //     if (checkemail && checkemail.id !== rider.id) {
    //       return this.responseService.badRequest('email already exists');
    //     }
    //   }

      // Handle address update
      if (dto.address) {
        try {
          const addressCoordinates =
            await this.geolocationService.getYahooCoordinates(dto.address);
          updateObject.address = {
            address: dto.address,
            lat: addressCoordinates.lat,
            lon: addressCoordinates.lon,
          };
        } catch (error) {
          console.error(error);
          return this.responseService.badRequest('Failed to geocode address');
        }
      } else if (rider.address) {
        // Keep existing address if no new address provided
        updateObject.address = rider.address;
      }

      // Perform the update
      await this.riderRepository.save( updateObject);

      // Fetch the updated customer to return the latest data
      const updatedRider = await this.riderRepository.findByID(rider.id);

      // Save notification
      await this.notificationsService.create({
        message: `${updatedRider.name} has updated their record.`,
        subject: 'Account Updated',
        account: updatedRider.riderID,
      });

      return this.responseService.success(
        'Rider record updated successfully',
        updatedRider,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error providing Personal Profile',
      );
    }
  }

  async VehicleRofile(
    rider: RiderEntity,
    dto: VehicleDto,
    mediafile: Express.Multer.File[],
  ): Promise<StandardResponse<Vehicle>> {
    try {
      const fileUploadPromises = mediafile.map((file) =>
        this.cloudinaryService.uploadFile(file),
      );

      const uploadResults = await Promise.all(fileUploadPromises);
      const vehiclePictureurl = uploadResults[0].secure_url;
      const vehicleDocumentsurl = uploadResults[1].secure_url;

      const vehicleIdcustom = `TrkRV${await this.generatorService.generateUserID()}`;

      const vehicle = await this.vehicleRepository.create({
        id: 0,
        vehicleID: vehicleIdcustom,
        plateNumber: dto.plateNumber,
        vehicleDocuments: vehicleDocumentsurl,
        vehicleType: dto.vehicleType,
        vehiclePicture: vehiclePictureurl,
        createdAT: new Date(),
        updatedAT: undefined,
        owner: rider,
      });

      // Save notification
      await this.notificationsService.create({
        message: `${rider.name} has updated their vehicle profile`,
        subject: 'Vehicle Profile Updated',
        account: rider.riderID,
      });

      return this.responseService.success(
        'Rider vehicle Profile updated successfully',
        vehicle,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error providing Vehicle Profile',
      );
    }
  }

  async PaymentProfile(
    rider: RiderEntity,
    dto: BankDto,
  ): Promise<StandardResponse<Bank>> {
    try {
      const bankIdcustom = `TrkRB${await this.generatorService.generateUserID()}`;

      const bank = await this.bankRepository.create({
        id: 0,
        bankID: bankIdcustom,
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        createdAT: new Date(),
        updatedAT: undefined,
        owner: rider,
      });

      // Save notification
      await this.notificationsService.create({
        message: `${rider.name} has updated their Payment profile`,
        subject: 'Payment Profile Updated',
        account: rider.riderID,
      });

      return this.responseService.success(
        'Rider Payment Profile updated successfully',
        bank,
      );
    } catch (error) {
      console.error(error);
      return this.responseService.internalServerError(
        'Error providing payment Profile',
      );
    }
  }
}
