import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemWrongQuestionService } from './chem-wrong-question.service'
import {
  CreateWrongPracticeDto,
  CreateWrongVariationPracticeDto,
  WrongQuestionListQueryDto,
  WrongQuestionWeakQueryDto,
} from './dto/wrong-question.dto'

@Controller('chemistry/train/wrong-questions')
@UseGuards(JwtAuthGuard)
export class ChemWrongQuestionController {
  constructor(private readonly service: ChemWrongQuestionService) {}

  @Get('summary')
  summary(@CurrentUser() user: JwtPayload) {
    return this.service.summary(user.sub)
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: WrongQuestionListQueryDto,
  ) {
    return this.service.list(user.sub, query)
  }

  @Get('weak-stats')
  weakStats(
    @CurrentUser() user: JwtPayload,
    @Query() query: WrongQuestionWeakQueryDto,
  ) {
    return this.service.weakStats(user.sub, { limit: query.limit })
  }

  @Post('practice')
  practice(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateWrongPracticeDto,
  ) {
    return this.service.createPracticeSession(user.sub, body.count)
  }

  /** 手动重建错题索引（幂等）；不影响历史答题快照 */
  @Post('rebuild')
  rebuild(@CurrentUser() user: JwtPayload) {
    return this.service.rebuildUserWrongBook(user.sub)
  }

  @Post(':id/variation-practice')
  variationPractice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: CreateWrongVariationPracticeDto,
  ) {
    return this.service.createVariationSession(user.sub, id, body.count)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }
}
