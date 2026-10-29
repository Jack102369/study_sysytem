import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemTrainService } from './chem-train.service'
import { ChemTrainSessionDiagramService } from './chem-train-session-diagram.service'
import {
  CreateTrainSessionDto,
  ListTrainSessionsQueryDto,
  SaveTrainAnswerDto,
  TrainAvailabilityQueryDto,
} from './dto/train.dto'

@Controller('chemistry/train')
@UseGuards(JwtAuthGuard)
export class ChemTrainController {
  constructor(
    private readonly service: ChemTrainService,
    private readonly sessionDiagrams: ChemTrainSessionDiagramService,
  ) {}

  @Get('test-access')
  testAccess(@CurrentUser() user: JwtPayload) {
    return this.service.testAccess(user.sub)
  }

  @Get('availability')
  availability(
    @CurrentUser() user: JwtPayload,
    @Query() query: TrainAvailabilityQueryDto,
  ) {
    return this.service.availability(user.sub, query)
  }

  @Get('sessions')
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTrainSessionsQueryDto,
  ) {
    return this.service.listSessions(user.sub, query)
  }

  @Post('sessions')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTrainSessionDto) {
    return this.service.createSession(user.sub, dto)
  }

  @Get('sessions/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getSession(user.sub, id)
  }

  @Patch('sessions/:id/answers')
  saveAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SaveTrainAnswerDto,
  ) {
    return this.service.saveAnswer(user.sub, id, dto)
  }

  @Post('sessions/:id/submit')
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.submit(user.sub, id)
  }

  @Post('sessions/:id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancel(user.sub, id)
  }

  /**
   * 学生端受控读取会话题图快照 SVG（JWT + 会话归属 + snapshot 归属）。
   * 禁止依赖公开 /uploads/industrial-svg。
   */
  @Get('sessions/:sessionId/items/:sessionItemId/assets/:assetId/svg')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Content-Security-Policy', "default-src 'none'; sandbox")
  @Header('Cache-Control', 'private, no-store')
  async sessionItemSvg(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
    @Param('assetId') assetId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { svg, contentHash } = await this.sessionDiagrams.readAuthorizedSvg(
      String(user.sub),
      sessionId,
      sessionItemId,
      assetId,
    )
    res.setHeader('ETag', `"${contentHash}"`)
    // Buffer 绕过统一 JSON 包装，供前端 Blob 解析
    return Buffer.from(svg, 'utf8')
  }
}
