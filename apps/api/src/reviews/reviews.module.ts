import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ErrorQuestionsModule } from '../error-questions/error-questions.module'
import { ReviewsController } from './reviews.controller'

@Module({
  imports: [AuthModule, ErrorQuestionsModule],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
