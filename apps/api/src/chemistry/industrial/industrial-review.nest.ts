import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  attemptFormalImport,
  getIndustrialReviewAdminDetail,
  humanReviewIndustrialCandidate,
  listIndustrialReviews,
  patchIndustrialReview,
  recheckIndustrialReviewQuality,
  recordIndustrialAdminChecklist,
  recordIndustrialCaseReviewForAdmin,
} from './industrial-review.service'
import { buildIndustrialMultiModelReviewExport } from './industrial-review-export.service'
import type {
  AdminChecklistDto,
  CaseReviewOverlayDto,
  ExportIndustrialReviewBundleQueryDto,
  FormalImportDto,
  HumanReviewDto,
  ListIndustrialReviewQueryDto,
  PatchIndustrialReviewDto,
} from './industrial-review.dto'
import { readImmutableIndustrialSvg } from './industrial-svg-asset.service'
import {
  FORMAL_ALLOWED_DESIGN_NOTE,
  type IndustrialFormalImportDbPayload,
} from './industrial-formal-import.service'
import {
  INDUSTRIAL_FORMAL_REAL_PUBLISH_NOTE,
  isIndustrialFormalRealPublishEnabled,
} from './industrial-formal-publish.config'
import { IndustrialFormalImportDbService } from './industrial-formal-import.db'
import { IndustrialItemAssetQueryService } from './industrial-item-asset.query'

function mapErr(e: unknown): never {
  const msg = String((e as Error).message || e)
  if (msg.includes('NOT_FOUND')) throw new NotFoundException(msg)
  if (
    msg.includes('REVISION_CONFLICT') ||
    msg.includes('CASE_HASH_MISMATCH') ||
    msg.includes('CASE_REVIEW_CONFLICT')
  ) {
    throw new ConflictException(msg)
  }
  throw new BadRequestException(msg)
}

@Injectable()
export class IndustrialReviewNestService {
  constructor(
    private readonly formalDb: IndustrialFormalImportDbService,
    private readonly assetQuery: IndustrialItemAssetQueryService,
  ) {}

  list(query: ListIndustrialReviewQueryDto) {
    try {
      return {
        items: listIndustrialReviews({
          status: query.status,
          categoryCode: query.categoryCode,
          qtype: query.qtype,
          batchId: query.batchId,
        }),
        formalAllowedDesignNote: FORMAL_ALLOWED_DESIGN_NOTE,
        svgSessionContract: this.assetQuery.sessionContract(),
        e2bNote:
          'PHASE_E2-B2：案例有效审核可解除可信度闸门；real publish 默认关闭；AI 不得冒充管理员',
        realPublishEnabled: isIndustrialFormalRealPublishEnabled(),
        realPublishNote: INDUSTRIAL_FORMAL_REAL_PUBLISH_NOTE,
        defaultFormalBatchId: 'industrial_formal_candidate_20261029_121958',
      }
    } catch (e) {
      mapErr(e)
    }
  }

  get(candidateId: string) {
    const r = getIndustrialReviewAdminDetail(candidateId)
    if (!r) throw new NotFoundException('CANDIDATE_NOT_FOUND')
    return r
  }

  async patch(candidateId: string, dto: PatchIndustrialReviewDto) {
    try {
      return await patchIndustrialReview(candidateId, dto)
    } catch (e) {
      mapErr(e)
    }
  }

  async recheck(candidateId: string) {
    try {
      return await recheckIndustrialReviewQuality(candidateId)
    } catch (e) {
      mapErr(e)
    }
  }

  humanReview(candidateId: string, dto: HumanReviewDto, userId: string) {
    try {
      return humanReviewIndustrialCandidate(candidateId, {
        decision: dto.decision,
        note: dto.note,
        expectedRevision: dto.expectedRevision,
        reviewerUserId: userId,
      })
    } catch (e) {
      mapErr(e)
    }
  }

  adminChecklist(candidateId: string, dto: AdminChecklistDto, userId: string) {
    try {
      return recordIndustrialAdminChecklist(candidateId, {
        expectedRevision: dto.expectedRevision,
        reviewerUserId: userId,
        note: dto.note,
        sourceOutcome: dto.sourceOutcome,
        caseOutcome: dto.caseOutcome,
        kbPlanOk: dto.kbPlanOk,
        kbPlanNote: dto.kbPlanNote,
        unknownAcknowledgedCheckIds: dto.unknownAcknowledgedCheckIds || [],
        apparatusNotes: dto.apparatusNotes,
        flowNotes: dto.flowNotes,
      })
    } catch (e) {
      mapErr(e)
    }
  }

  caseReview(dto: CaseReviewOverlayDto, userId: string) {
    try {
      return recordIndustrialCaseReviewForAdmin({
        caseCode: dto.caseCode,
        contentHashAtReview: dto.contentHashAtReview,
        decision: dto.decision,
        note: dto.note,
        sourceNotes: dto.sourceNotes || [],
        reviewedBy: userId,
        expectedPriorContentHash: dto.expectedPriorContentHash,
      })
    } catch (e) {
      mapErr(e)
    }
  }

  /**
   * 正式入库：默认 dry-run。
   * 真实写库仅当 dryRun===false && confirmRealPublish===true &&
   * INDUSTRIAL_FORMAL_REAL_PUBLISH 开启；E2-B2 不得开启 env。
   */
  async formalImport(
    candidateId: string,
    dto: FormalImportDto,
    userId: string,
  ) {
    const r = getIndustrialReviewAdminDetail(candidateId)
    if (!r) throw new NotFoundException('CANDIDATE_NOT_FOUND')
    if (Number(r.revision) !== dto.expectedRevision) {
      throw new ConflictException(`REVISION_CONFLICT: expected ${r.revision}`)
    }
    const wantReal =
      dto.dryRun === false && dto.confirmRealPublish === true
    const envOn = isIndustrialFormalRealPublishEnabled()
    if (wantReal && !envOn) {
      throw new BadRequestException(
        'REAL_PUBLISH_DISABLED: set INDUSTRIAL_FORMAL_REAL_PUBLISH=true and confirmRealPublish (E2-C only)',
      )
    }
    const dryRun = !(wantReal && envOn)
    try {
      const result = await attemptFormalImport(candidateId, {
        dryRun,
        reviewerUserId: userId,
        dbWriter: dryRun
          ? undefined
          : (payload: IndustrialFormalImportDbPayload) =>
              this.formalDb.writeFormalItemWithAsset(payload),
      })
      return {
        ...result,
        publishMode: dryRun ? 'DRY_RUN' : 'REAL_PUBLISH',
        realPublishEnvEnabled: envOn,
      }
    } catch (e) {
      mapErr(e)
    }
  }

  getSvgByHash(hash: string) {
    const svg = readImmutableIndustrialSvg(hash)
    if (!svg) throw new NotFoundException('SVG_NOT_FOUND')
    return svg
  }

  async listTrainItemAssets(trainItemId: string) {
    return this.assetQuery.listByTrainItemId(trainItemId)
  }

  /** PHASE_E2-B7：只读导出 ZIP；不改审核态 / 不写 DB */
  exportMultiModelReviewBundle(query: ExportIndustrialReviewBundleQueryDto) {
    try {
      return buildIndustrialMultiModelReviewExport(query.batchId)
    } catch (e) {
      mapErr(e)
    }
  }
}
