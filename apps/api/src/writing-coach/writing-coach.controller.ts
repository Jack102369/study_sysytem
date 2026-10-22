import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import {
  CreateWritingCoachDto,
  GaokaoReviewWritingCoachDto,
  GenerateWritingTopicDto,
  ListWritingCoachQueryDto,
  ReviewWritingCoachDto,
  UpdateWritingCoachDto,
} from './dto/writing-coach.dto'
import { WritingCoachService } from './writing-coach.service'

@Controller('writing-coach')
@UseGuards(JwtAuthGuard)
export class WritingCoachController {
  constructor(private readonly service: WritingCoachService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListWritingCoachQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Post('generate-topic')
  generateTopic(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateWritingTopicDto,
  ) {
    return this.service.generateTopic(user.sub, dto)
  }

  @Post('review')
  review(@CurrentUser() user: JwtPayload, @Body() dto: ReviewWritingCoachDto) {
    return this.service.review(user.sub, dto)
  }

  @Post('gaokao-review')
  gaokaoReview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GaokaoReviewWritingCoachDto,
  ) {
    return this.service.gaokaoReview(user.sub, dto)
  }

  @Post('ocr')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  ocr(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.ocrImage(user.sub, file)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateWritingCoachDto) {
    return this.service.create(user.sub, dto)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWritingCoachDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
