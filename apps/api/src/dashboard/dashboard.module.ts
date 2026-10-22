import { Module } from '@nestjs/common'
import { AssessmentsModule } from '../assessments/assessments.module'
import { AuthModule } from '../auth/auth.module'
import { ErrorQuestionsModule } from '../error-questions/error-questions.module'
import { PointsModule } from '../points/points.module'
import { StudyPrefsModule } from '../study-prefs/study-prefs.module'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [
    AuthModule,
    ErrorQuestionsModule,
    AssessmentsModule,
    StudyPrefsModule,
    PointsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
