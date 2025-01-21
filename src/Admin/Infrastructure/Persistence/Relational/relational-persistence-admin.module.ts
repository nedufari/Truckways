import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from './Entity/admin.entity';
import { AdminRelationalRepository } from './Repository/admin.repository';
import { AdminRepository } from '../admin-repository';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity])],
  providers: [
    {
      provide: AdminRepository,
      useClass: AdminRelationalRepository,
    },
  ],
  exports:[AdminRepository]
})
export class RelationalPersistenceAdminModule {}
