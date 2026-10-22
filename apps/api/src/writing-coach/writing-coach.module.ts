import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { AuthModule } from '../auth/auth.module'
import { PointsModule } from '../points/points.module'
import { WritingCoachSession } from './writing-coach-session.entity'
import { WritingCoachController } from './writing-coach.controller'
import { WritingCoachService } from './writing-coach.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([WritingCoachSession]),
    AuthModule,
    AiReferenceModule,
    PointsModule,
  ],
  controllers: [WritingCoachController],
  providers: [WritingCoachService],
})
export class WritingCoachModule {}
