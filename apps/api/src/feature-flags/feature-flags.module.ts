import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminGuard } from '../auth/admin.guard'
import { AuthModule } from '../auth/auth.module'
import { User } from '../users/user.entity'
import { FeatureFlag } from './feature-flag.entity'
import { FeatureFlagsController } from './feature-flags.controller'
import { FeatureFlagsService } from './feature-flags.service'

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag, User]), AuthModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, AdminGuard],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
