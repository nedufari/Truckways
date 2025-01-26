import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from './Entity/admin.entity';
import { AdminRelationalRepository, PercentageConfigRelationalRepository } from './Repository/admin.repository';
import { AdminRepository, PercentageConfigRepository } from '../admin-repository';
import { PercentageConfigEntity } from './Entity/percentage-configuration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity,PercentageConfigEntity])],
  providers: [
    {
      provide: AdminRepository,
      useClass: AdminRelationalRepository,
    },
    {
      provide:PercentageConfigRepository,
      useClass:PercentageConfigRelationalRepository
    }
  ],
  exports:[AdminRepository,PercentageConfigRepository]
})
export class RelationalPersistenceAdminModule {}
