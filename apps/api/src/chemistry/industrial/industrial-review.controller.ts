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
  StreamableFile,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { AdminGuard } from '../../auth/admin.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { JwtPayload } from '../../auth/jwt-auth.guard'
import {
  AdminChecklistDto,
  CaseReviewOverlayDto,
  ExportIndustrialReviewBundleQueryDto,
  FormalImportDto,
  HumanReviewDto,
  IndustrialKbBindDto,
  ListIndustrialReviewQueryDto,
  PatchIndustrialReviewDto,
} from './industrial-review.dto'
import { IndustrialReviewNestService } from './industrial-review.nest'
import { IndustrialKbBindService } from './industrial-kb-bind.service'
import { IndustrialExperimentEnabledGuard } from './industrial-experiment-enabled.guard'

@Controller('chemistry/admin/industrial-candidates')
@UseGuards(JwtAuthGuard, AdminGuard, IndustrialExperimentEnabledGuard)
export class IndustrialReviewController {
  constructor(
    private readonly service: IndustrialReviewNestService,
    private readonly kbBindService: IndustrialKbBindService,
  ) {}

  @Get()
  list(@Query() query: ListIndustrialReviewQueryDto) {
    return this.service.list(query)
  }

  /**
   * PHASE_E2-B7：导出多模型独立审核包 ZIP（只读）。
   * 必须放在 :candidateId 之前，避免被动态路由吞掉。
   */
  @Get('export-review-bundle')
  @Header('Cache-Control', 'private, no-store')
  exportReviewBundle(
    @Query() query: ExportIndustrialReviewBundleQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = this.service.exportMultiModelReviewBundle(query)
    res.setHeader('Content-Type', result.contentType)
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`,
    )
    res.setHeader('X-Industrial-Bundle-Hash', String(result.manifest.bundleContentHash || ''))
    return new StreamableFile(result.zip)
  }

  /** 案例人工意见覆盖层（不升格 published / 不伪造 verified） */
  @Post('case-review')
  caseReview(
    @Body() dto: CaseReviewOverlayDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.caseReview(dto, String(user.sub))
  }

  @Get('svg/:hash')
  @Header('Content-Type', 'image/svg+xml; charset=utf-8')
  svg(@Param('hash') hash: string) {
    return this.service.getSvgByHash(hash)
  }

  /** 正式题图资源查询（STEP_09/10） */
  @Get('train-item-assets/:trainItemId')
  trainItemAssets(@Param('trainItemId') trainItemId: string) {
    return this.service.listTrainItemAssets(trainItemId)
  }

  /**
   * STEP_11：为工业正式题绑定已 published KB（不伪造知识点、不放宽抽题闸门）。
   */
  @Post('kb-bind')
  bindKb(
    @Body() dto: IndustrialKbBindDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.kbBindService.bindPublishedKbLink({
      trainItemId: dto.trainItemId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      adminUserId: String(user.sub),
    })
  }

  @Get(':candidateId')
  detail(@Param('candidateId') candidateId: string) {
    return this.service.get(candidateId)
  }

  @Patch(':candidateId')
  patch(
    @Param('candidateId') candidateId: string,
    @Body() dto: PatchIndustrialReviewDto,
  ) {
    return this.service.patch(candidateId, dto)
  }

  @Post(':candidateId/recheck-quality')
  recheck(@Param('candidateId') candidateId: string) {
    return this.service.recheck(candidateId)
  }

  @Post(':candidateId/human-review')
  humanReview(
    @Param('candidateId') candidateId: string,
    @Body() dto: HumanReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.humanReview(candidateId, dto, String(user.sub))
  }

  /** 审核清单：来源/案例/KB/unknown 意见；不升格入库 */
  @Post(':candidateId/admin-checklist')
  adminChecklist(
    @Param('candidateId') candidateId: string,
    @Body() dto: AdminChecklistDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.adminChecklist(candidateId, dto, String(user.sub))
  }

  @Post(':candidateId/formal-import')
  formalImport(
    @Param('candidateId') candidateId: string,
    @Body() dto: FormalImportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // E2-B2：默认 dry-run；真实写库需 env + confirmRealPublish（本阶段 env 保持关）
    return this.service.formalImport(candidateId, dto, String(user.sub))
  }
}
