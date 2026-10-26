import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../../auth/admin.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ReplaceHsMathTrainItemKpsDto } from '../dto/admin-train-item-kps.dto'
import {
  PutHsMathTrainItemContentMetaDto,
  ReplaceHsMathTrainItemMethodsDto,
} from '../dto/admin-train-item-methods.dto'
import {
  ConfirmHsMathTrainItemsImportDto,
  PreviewHsMathTrainItemsImportDto,
} from '../dto/admin-train-item-import.dto'
import { ListHsMathReviewQueueQueryDto } from '../dto/admin-review-queue.dto'
import { CreateHsMathTrainItemReviewDto } from '../dto/admin-train-item-review.dto'
import {
  CreateHsMathTrainItemDto,
  ListHsMathTrainItemsQueryDto,
  PatchHsMathTrainItemStatusDto,
  UpdateHsMathTrainItemDto,
} from '../dto/admin-train-item.dto'
import { HsMathAdminTrainItemReviewsService } from './hs-math-admin-train-item-reviews.service'
import { HsMathAdminTrainItemsImportService } from './hs-math-admin-train-items-import.service'
import { HsMathAdminTrainItemsService } from './hs-math-admin-train-items.service'

@Controller('hs-math/admin/train-items')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HsMathAdminTrainItemsController {
  constructor(
    private readonly service: HsMathAdminTrainItemsService,
    private readonly importService: HsMathAdminTrainItemsImportService,
    private readonly reviewsService: HsMathAdminTrainItemReviewsService,
  ) {}

  @Get()
  list(@Query() query: ListHsMathTrainItemsQueryDto) {
    return this.service.list(query)
  }

  /** 须在 :id 之前注册 */
  @Get('review-queue')
  reviewQueue(@Query() query: ListHsMathReviewQueueQueryDto) {
    return this.reviewsService.listReviewQueue(query)
  }

  /** 须在 :id 之前注册 */
  @Post('import/preview')
  previewImport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PreviewHsMathTrainItemsImportDto,
  ) {
    return this.importService.preview(user.sub, dto)
  }

  @Post('import/confirm')
  confirmImport(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmHsMathTrainItemsImportDto,
  ) {
    return this.importService.confirm(user.sub, dto)
  }

  @Get(':id/review-panel')
  reviewPanel(@Param('id') id: string) {
    return this.reviewsService.getReviewPanel(id)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateHsMathTrainItemDto,
  ) {
    return this.service.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateHsMathTrainItemDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Put(':id/knowledge-points')
  replaceKnowledgePoints(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplaceHsMathTrainItemKpsDto,
  ) {
    return this.service.replaceKnowledgePoints(user.sub, id, dto)
  }

  @Put(':id/methods')
  replaceMethods(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplaceHsMathTrainItemMethodsDto,
  ) {
    return this.service.replaceMethods(user.sub, id, dto)
  }

  /** 来源+方法原子更新（单次 content_version+1） */
  @Put(':id/content-meta')
  putContentMeta(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PutHsMathTrainItemContentMetaDto,
  ) {
    return this.service.putContentMeta(user.sub, id, dto)
  }

  /** 人工审核记录（不改 status；须在 :id/status 前注册更具体路径） */
  @Get(':id/reviews')
  listReviews(@Param('id') id: string) {
    return this.reviewsService.listForItem(id)
  }

  @Post(':id/reviews')
  submitReview(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateHsMathTrainItemReviewDto,
  ) {
    return this.reviewsService.submitReview(user.sub, id, dto)
  }

  @Patch(':id/status')
  patchStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PatchHsMathTrainItemStatusDto,
  ) {
    return this.service.patchStatus(user.sub, id, dto)
  }
}
