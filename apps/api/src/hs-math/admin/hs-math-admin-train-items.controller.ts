import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Response } from 'express'
import { AdminGuard } from '../../auth/admin.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { HS_MATH_ITEM_DIAGRAM_MAX_BYTES } from '../hs-math.constants'
import {
  ReorderHsMathItemDiagramsDto,
} from '../dto/admin-train-item-diagram.dto'
import { HsMathAdminTrainItemDiagramsService } from './hs-math-admin-train-item-diagrams.service'
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
  HsMathInventoryStatsQueryDto,
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
    private readonly diagramsService: HsMathAdminTrainItemDiagramsService,
  ) {}

  @Get()
  list(@Query() query: ListHsMathTrainItemsQueryDto) {
    return this.service.list(query)
  }

  /** 题库库存结构统计（只读）；须在 :id 之前注册 */
  @Get('inventory-stats')
  inventoryStats(@Query() query: HsMathInventoryStatsQueryDto) {
    return this.service.getInventoryStats(query)
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

  /** DIAGRAM-1B：题干插图（须在泛型 :id 前注册） */
  @Get(':id/diagrams')
  listDiagrams(@Param('id') id: string) {
    return this.diagramsService.listForItem(id)
  }

  @Post(':id/diagrams')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: HS_MATH_ITEM_DIAGRAM_MAX_BYTES },
    }),
  )
  uploadDiagram(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('altText') altText?: string,
  ) {
    return this.diagramsService.upload(user.sub, id, file, altText)
  }

  @Patch(':id/diagrams/order')
  reorderDiagrams(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReorderHsMathItemDiagramsDto,
  ) {
    return this.diagramsService.reorder(user.sub, id, dto.orderedLinkIds)
  }

  @Post(':id/diagrams/:linkId/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: HS_MATH_ITEM_DIAGRAM_MAX_BYTES },
    }),
  )
  replaceDiagram(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('altText') altText?: string,
  ) {
    return this.diagramsService.replace(user.sub, id, linkId, file, altText)
  }

  @Delete(':id/diagrams/:linkId')
  deleteDiagram(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('linkId') linkId: string,
  ) {
    return this.diagramsService.remove(user.sub, id, linkId)
  }

  @Get(':id/diagrams/:linkId/content')
  @Header('Cache-Control', 'private, no-store')
  async readDiagramContent(
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { mimeType, buffer } = await this.diagramsService.readContentForAdmin(
      id,
      linkId,
    )
    res.setHeader('Content-Type', mimeType)
    return new StreamableFile(buffer)
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
