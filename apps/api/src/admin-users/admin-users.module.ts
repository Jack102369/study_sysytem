import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AdminGuard } from '../auth/admin.guard'
import { BootstrapDefaultsModule } from '../common/bootstrap-defaults.module'
import { ChemTrainTestGrant } from '../chemistry/train/entities/chem-train-test-grant.entity'
import { User } from '../users/user.entity'
import { AdminUsersController } from './admin-users.controller'
import { AdminUsersService } from './admin-users.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ChemTrainTestGrant]),
    AuthModule,
    BootstrapDefaultsModule,
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService, AdminGuard],
})
export class AdminUsersModule {}
