import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { PointsModule } from '../points/points.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { Tag } from '../tags/tag.entity'
import { AssessmentSubjectScore } from './assessment-subject-score.entity'
import { Assessment } from './assessment.entity'
import { AssessmentsController } from './assessments.controller'
import { AssessmentsService } from './assessments.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Assessment, AssessmentSubjectScore, Tag]),
    AuthModule,
    SubjectsModule,
    PointsModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
