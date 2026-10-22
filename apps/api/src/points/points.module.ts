import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import {
  PointLedger,
  RewardTier,
  UserPoints,
  UserRewardUnlock,
} from './point.entities'
import { PointsController } from './points.controller'
import { PointsService } from './points.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPoints, PointLedger, RewardTier, UserRewardUnlock]),
    AuthModule,
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
