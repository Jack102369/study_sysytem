import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import {
  CreateAttemptDto,
  CreateErrorQuestionDto,
  CreateExtensionDto,
  LinkAttachmentDto,
  ListErrorQuestionsQueryDto,
  OcrAttachmentDto,
  UpdateErrorQuestionDto,
} from './dto/error-question.dto'
import { ErrorQuestionsService } from './error-questions.service'

@Controller('error-questions')
@UseGuards(JwtAuthGuard)
export class ErrorQuestionsController {
  constructor(private readonly service: ErrorQuestionsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListErrorQuestionsQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Get('stats/overview')
  stats(@CurrentUser() user: JwtPayload) {
    return this.service.stats(user.sub)
  }

  /** OCR 可选：服务未启动时仅本接口失败，不影响其它功能 */
  @Post('ocr-attachment')
  ocrAttachment(@CurrentUser() user: JwtPayload, @Body() dto: OcrAttachmentDto) {
    return this.service.ocrAttachment(user.sub, dto.attachmentId, dto.mode || 'general')
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateErrorQuestionDto) {
    return this.service.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateErrorQuestionDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }

  @Post(':id/extensions')
  addExtension(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateExtensionDto,
  ) {
    return this.service.addExtension(user.sub, id, dto)
  }

  @Delete(':id/extensions/:extensionId')
  removeExtension(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('extensionId') extensionId: string,
  ) {
    return this.service.removeExtension(user.sub, id, extensionId)
  }

  @Post(':id/attempts')
  addAttempt(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateAttemptDto,
  ) {
    return this.service.addAttempt(user.sub, id, dto)
  }

  @Post(':id/attachments')
  linkAttachment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: LinkAttachmentDto,
  ) {
    return this.service.linkAttachment(
      user.sub,
      id,
      dto.attachmentId,
      dto.role,
      dto.sortOrder ?? 0,
    )
  }

  @Delete(':id/attachments/:attachmentId')
  unlinkAttachment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.unlinkAttachment(user.sub, id, attachmentId)
  }
}
