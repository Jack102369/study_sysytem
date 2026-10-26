import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Response } from 'express'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ListHsMathTrainSessionsQueryDto } from '../dto/list-train-sessions.dto'
import {
  CreateHsMathTrainSessionDto,
  SaveHsMathTrainAnswerDto,
} from '../dto/train-session.dto'
import { HS_MATH_APPLICATION_IMAGE_MAX_BYTES } from '../hs-math.constants'
import { HsMathAnalyticsService } from './hs-math-analytics.service'
import { HsMathApplicationImagesService } from './hs-math-application-images.service'
import { HsMathTrainService } from './hs-math-train.service'

@Controller('hs-math/train')
@UseGuards(JwtAuthGuard)
export class HsMathTrainController {
  constructor(
    private readonly service: HsMathTrainService,
    private readonly analyticsService: HsMathAnalyticsService,
    private readonly applicationImages: HsMathApplicationImagesService,
  ) {}

  /** 历史列表：必须在 :id 之前注册 */
  @Get('sessions')
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListHsMathTrainSessionsQueryDto,
  ) {
    return this.service.listSessions(user.sub, query)
  }

  @Post('sessions')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateHsMathTrainSessionDto,
  ) {
    return this.service.createSession(user.sub, dto)
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAnalytics(user.sub)
  }

  /**
   * APPLICATION-2B：应用题图片（须在 sessions/:id 笼统路由前注册更具体路径）。
   * 字段名 file；memoryStorage + 10MB；魔数在 Service 再验。
   */
  @Post('sessions/:sessionId/items/:sessionItemId/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: HS_MATH_APPLICATION_IMAGE_MAX_BYTES },
    }),
  )
  uploadImage(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.applicationImages.upload(
      user.sub,
      sessionId,
      sessionItemId,
      file,
    )
  }

  @Get('sessions/:sessionId/items/:sessionItemId/images')
  listImages(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
  ) {
    return this.applicationImages.list(user.sub, sessionId, sessionItemId)
  }

  @Get('sessions/:sessionId/items/:sessionItemId/images/:imageId')
  @Header('Cache-Control', 'private, no-store')
  async readImage(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
    @Param('imageId') imageId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mimeType, buffer } = await this.applicationImages.getBinary(
      user.sub,
      sessionId,
      sessionItemId,
      imageId,
    )
    res.setHeader('Content-Type', mimeType)
    return new StreamableFile(buffer)
  }

  /** DIAGRAM-1B：题干插图（开训快照；须用 objectId） */
  @Get('sessions/:sessionId/items/:sessionItemId/diagrams/:objectId')
  @Header('Cache-Control', 'private, no-store')
  async readStemDiagram(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
    @Param('objectId') objectId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mimeType, buffer } = await this.service.getSessionDiagramBinary(
      user.sub,
      sessionId,
      sessionItemId,
      objectId,
    )
    res.setHeader('Content-Type', mimeType)
    return new StreamableFile(buffer)
  }

  @Delete('sessions/:sessionId/items/:sessionItemId/images/:imageId')
  deleteImage(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.applicationImages.remove(
      user.sub,
      sessionId,
      sessionItemId,
      imageId,
    )
  }

  @Get('sessions/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getSession(user.sub, id)
  }

  @Patch('sessions/:id/answers')
  saveAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SaveHsMathTrainAnswerDto,
  ) {
    return this.service.saveAnswer(user.sub, id, dto)
  }

  @Post('sessions/:id/submit')
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.submit(user.sub, id)
  }

  /**
   * APPLICATION-4C-2：应用题重新申请 AI 批改（空 Body；沿用已保存答案）。
   * 须在 sessions/:id 笼统路由旁保持具体路径优先。
   */
  @Post('sessions/:sessionId/items/:sessionItemId/regrade')
  requestRegrade(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Param('sessionItemId') sessionItemId: string,
  ) {
    return this.service.requestApplicationRegrade(
      user.sub,
      sessionId,
      sessionItemId,
    )
  }

  @Post('sessions/:id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancel(user.sub, id)
  }
}
