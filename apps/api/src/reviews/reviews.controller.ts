import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { ErrorQuestionsService } from '../error-questions/error-questions.service'

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly errorQuestionsService: ErrorQuestionsService) {}

  @Get('today')
  today(@CurrentUser() user: JwtPayload) {
    return this.errorQuestionsService.listTodayReviews(user.sub)
  }
}
