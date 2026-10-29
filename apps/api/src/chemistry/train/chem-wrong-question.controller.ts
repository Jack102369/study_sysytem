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
import { IndustrialWrongVariationService } from '../industrial/industrial-wrong-variation.service'
import {
  CreateWrongPracticeDto,
  CreateWrongVariationPracticeDto,
  WrongQuestionListQueryDto,
  WrongQuestionWeakQueryDto,
} from './dto/wrong-question.dto'

@Controller('chemistry/train/wrong-questions')
@UseGuards(JwtAuthGuard)
export class ChemWrongQuestionController {
  constructor(
    private readonly service: ChemWrongQuestionService,
    private readonly industrialVariation: IndustrialWrongVariationService,
  ) {}

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

  /**
   * 工业实验：申请 AI 变式候选进入审核仓（禁止直接 formal）。
   * 学生「开始变式训练」仍只抽已审核题库变式。
   */
  @Post(':id/industrial-variation-candidate')
  industrialVariationCandidate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.industrialVariation.requestCandidateFromWrong(user.sub, id)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }
}
