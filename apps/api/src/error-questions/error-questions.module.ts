import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { AuthModule } from '../auth/auth.module'
import { ErrorCategoriesModule } from '../error-categories/error-categories.module'
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module'
import { PointsModule } from '../points/points.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { Tag } from '../tags/tag.entity'
import { ErrorAttempt } from './error-attempt.entity'
import { ErrorQuestion } from './error-question.entity'
import { ErrorQuestionsController } from './error-questions.controller'
import { ErrorQuestionsService } from './error-questions.service'
import { Extension } from './extension.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([ErrorQuestion, Extension, ErrorAttempt, Tag]),
    AuthModule,
    SubjectsModule,
    ErrorCategoriesModule,
    AiReferenceModule,
    FeatureFlagsModule,
    PointsModule,
  ],
  controllers: [ErrorQuestionsController],
  providers: [ErrorQuestionsService],
  exports: [ErrorQuestionsService],
})
export class ErrorQuestionsModule {}
