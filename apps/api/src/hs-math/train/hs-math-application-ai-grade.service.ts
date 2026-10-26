/**
 * APPLICATION-3A/3D-5：应用题 AI 批改（文字 DeepSeek + 含图 Vision）。
 * 文字：HS_MATH_AI_GRADING_ENABLED + DEEPSEEK_API_KEY。
 * 视觉：HS_MATH_VISION_GRADING_ENABLED + URL + KEY；默认关闭，不扫历史 review_required。
 */
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { DeepseekClientService } from '../../ai-reference/deepseek-client.service'
import {
  HS_MATH_AI_GRADING_ENV_ENABLED,
  HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET_ENV,
  HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS_ENV,
  HS_MATH_APPLICATION_AI_MODE_ENV,
  HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED,
  HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS_ENV,
  HS_MATH_AI_GRADING_MAX_ATTEMPTS,
  HS_MATH_AI_GRADING_TIMEOUT_MS,
  HS_MATH_VISION_GRADING_TEST_SESSION_IDS_ENV,
  HS_MATH_VISION_GRADING_TEST_USER_ID_ENV,
  HS_MATH_VISION_GRADING_TIMEOUT_MS,
  HS_MATH_VISION_MAX_INFLIGHT_DEFAULT,
  HS_MATH_VISION_MAX_INFLIGHT_ENV,
} from '../hs-math.constants'
import { HsMathTrainSession } from '../entities/hs-math-train-session.entity'
import { HsMathTrainSessionItem } from '../entities/hs-math-train-session-item.entity'
import { HsMathTrainSessionItemImage } from '../entities/hs-math-train-session-item-image.entity'
import type { HsMathApplicationAnswerPayload } from '../types/answer-protocol'
import type { HsMathAiInputModality } from '../types/ai-grade-protocol'
import { buildHsMathApplicationAiGradePrompt } from '../util/hs-math-ai-grade.prompt'
import { buildHsMathApplicationVisionAiGradePrompt } from '../util/hs-math-ai-grade-vision.prompt'
import {
  buildDualScoringStudentText,
  buildHsMathApplicationVisionTranscribePrompt,
  evaluateTranscribeForDeepSeek,
  parseVisionTranscribeResult,
  type HsMathRecognitionWarning,
} from '../util/hs-math-ai-grade-vision-transcribe.prompt'
import {
  classifyApplicationSubmitRoute,
  recountHsMathSessionGradeCounts,
  validateHsMathAiGradeResult,
} from '../util/hs-math-ai-grade.validate'
import type { HsMathApplicationGradePipeline } from '../util/hs-math-application-grade-dispatch'
import { extractApplicationImageIds } from '../util/hs-math-application-image-policy'
import { loadVisionImagesForGrading } from '../util/hs-math-vision-image-loader'
import {
  formatAiGradingReason,
  isStaleGradingState,
  shouldRejectClaim,
} from '../util/hs-math-application-vision-submit'
import {
  parseApplicationAiMode,
  resolveApplicationAiAccess,
} from '../util/hs-math-application-ai-owner-scope'
import {
  HsMathVisionLiveHttpBudget,
  parseVisionLiveHttpBudget,
} from '../util/hs-math-vision-live-scope'
import { resolveGradingProviderFromAnswer } from '../util/user-answer.validate'
import { HsMathDeepseekDailyQuotaService } from './hs-math-deepseek-daily-quota.service'
import {
  HsMathQwenVisionClientService,
  type HsMathVisionGradeRequest,
  type HsMathVisionGradeResponse,
} from './hs-math-qwen-vision-client.service'

export type HsMathAiGradeCommitMeta = {
  gradingProvider: 'qwen' | 'deepseek'
  pipeline: HsMathApplicationGradePipeline
  visionModel?: string
  scoringModel?: string
}

export type HsMathAiGradeInvoker = (input: {
  system: string
  user: string
  timeoutMs: number
}) => Promise<{ content: string; model: string }>

export type HsMathVisionGradeInvoker = (
  input: HsMathVisionGradeRequest,
) => Promise<HsMathVisionGradeResponse>

@Injectable()
export class HsMathApplicationAiGradeService {
  private readonly logger = new Logger(HsMathApplicationAiGradeService.name)

  /** 进程内防重入：同一 session_item 同时只跑一次 */
  private readonly inFlight = new Set<string>()

  /** APPLICATION-3D-8：Vision HTTP 进程内并发槽 */
  private visionInFlight = 0
  private readonly visionWaiters: Array<() => void> = []

  /** APPLICATION-3E-3：DeepSeek 文字批改进程内 HTTP 预算 */
  private textLiveBudget: HsMathVisionLiveHttpBudget | null = null

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly deepseek: DeepseekClientService,
    private readonly visionClient: HsMathQwenVisionClientService,
    private readonly deepseekDailyQuota: HsMathDeepseekDailyQuotaService,
  ) {}

  private getTextLiveBudget(): HsMathVisionLiveHttpBudget {
    if (!this.textLiveBudget) {
      const max = parseVisionLiveHttpBudget(
        this.config.get<string>(HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET_ENV, '') ||
          '',
      )
      this.textLiveBudget = new HsMathVisionLiveHttpBudget(max)
    }
    return this.textLiveBudget
  }

  getTextLiveHttpUsed(): number {
    return this.getTextLiveBudget().usedCount
  }

  getTextLiveHttpBudgetMax(): number {
    return this.getTextLiveBudget().max
  }

  /** 日常 owner_only 才启用 MySQL 日额度；测试路径仍用进程 LIVE_HTTP_BUDGET */
  private isOwnerOnlyDailyQuotaActive(): boolean {
    const mode = parseApplicationAiMode(
      this.config.get<string>(HS_MATH_APPLICATION_AI_MODE_ENV, '') || '',
    )
    return mode.ok && mode.mode === 'owner_only'
  }

  /**
   * 真实 DeepSeek 调用前：进程预算 +（owner_only）MySQL 日额度原子扣减，再发 HTTP。
   * 已扣减无论成功/失败/超时均计入；绝不因不确定是否发出而返还。
   */
  private async invokeDeepseekTextWithBudget(
    invoker: HsMathAiGradeInvoker | undefined,
    input: { system: string; user: string; timeoutMs: number },
    quotaUserId: string,
  ): Promise<{ content: string; model: string }> {
    const budget = this.getTextLiveBudget()
    if (!budget.tryConsume()) {
      this.logger.warn(
        `DeepSeek http_budget_exceeded used=${budget.usedCount} max=${budget.max}`,
      )
      throw new Error('ai_budget_exceeded')
    }
    this.logger.warn(
      `DeepSeek http_budget consume used=${budget.usedCount} max=${budget.max || 'unlimited'}`,
    )

    if (this.isOwnerOnlyDailyQuotaActive()) {
      const quota = await this.deepseekDailyQuota.tryConsumeAtomic(quotaUserId)
      if (!quota.ok) {
        this.logger.warn(
          `DeepSeek daily_quota deny user=${quotaUserId} reason=${quota.reason}`,
        )
        throw new Error(
          quota.reason === HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED ||
            quota.reason === 'daily_limit_invalid' ||
            quota.reason === 'quota_table_missing'
            ? HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
            : 'ai_error',
        )
      }
    }

    const run =
      invoker ||
      (async (p) => {
        if (!this.isOutboundEnabled()) {
          throw new Error('ai_disabled')
        }
        return this.deepseek.gradeHsMathApplicationText(p)
      })
    return run(input)
  }

  /**
   * APPLICATION-4C-4B：DeepSeek 日额度预检（regrade / 双阶段 Qwen 前）。
   * 非 owner_only：不挡（测试路径）。
   */
  async peekDeepseekDailyQuota(userId: string): Promise<{
    available: boolean
    reason?: string
    usedCount?: number
    dailyLimit?: number
    quotaDate: string
    enforced: boolean
  }> {
    if (!this.isOwnerOnlyDailyQuotaActive()) {
      return {
        available: true,
        enforced: false,
        quotaDate: '',
        reason: 'quota_not_enforced_outside_owner_only',
      }
    }
    const peek = await this.deepseekDailyQuota.hasAvailableQuota(userId)
    return { ...peek, enforced: true }
  }

  private applicationAiAccessConfig(outboundEnabled: boolean) {
    return {
      modeRaw:
        this.config.get<string>(HS_MATH_APPLICATION_AI_MODE_ENV, '') || '',
      allowedUserIdsRaw:
        this.config.get<string>(
          HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS_ENV,
          '',
        ) || '',
      outboundEnabled,
      testUserId:
        this.config.get<string>(HS_MATH_VISION_GRADING_TEST_USER_ID_ENV, '') ||
        '',
      testSessionIdsRaw:
        this.config.get<string>(
          HS_MATH_VISION_GRADING_TEST_SESSION_IDS_ENV,
          '',
        ) || '',
      testSessionItemIdsRaw:
        this.config.get<string>(
          HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS_ENV,
          '',
        ) || '',
    }
  }

  private visionMaxInFlight(): number {
    const raw = (
      this.config.get<string>(HS_MATH_VISION_MAX_INFLIGHT_ENV, '') || ''
    ).trim()
    const n = raw ? Number(raw) : HS_MATH_VISION_MAX_INFLIGHT_DEFAULT
    if (!Number.isFinite(n) || n < 1) return HS_MATH_VISION_MAX_INFLIGHT_DEFAULT
    return Math.min(8, Math.floor(n))
  }

  private async acquireVisionSlot(): Promise<void> {
    const max = this.visionMaxInFlight()
    if (this.visionInFlight < max) {
      this.visionInFlight += 1
      return
    }
    await new Promise<void>((resolve) => {
      this.visionWaiters.push(() => {
        this.visionInFlight += 1
        resolve()
      })
    })
  }

  private releaseVisionSlot(): void {
    this.visionInFlight = Math.max(0, this.visionInFlight - 1)
    const next = this.visionWaiters.shift()
    if (next) next()
  }

  /**
   * 仅修复本 session 内超时卡住的 grading → grading_failed。
   * 不外发、不扫其它 session、不自动重试。
   */
  async recoverStaleGradingForSession(params: {
    userId: string
    sessionId: string
  }): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return 0

      const items = await manager.getRepository(HsMathTrainSessionItem).find({
        where: { sessionId: params.sessionId },
      })
      const now = new Date()
      let n = 0
      for (const item of items) {
        if (
          !isStaleGradingState({
            gradeResult: item.gradeResult,
            gradeReason: item.gradeReason,
            startedAtFallback: session.submittedAt,
            now,
          })
        ) {
          continue
        }
        item.gradeResult = 'grading_failed'
        item.gradeReason = 'stale_grading'
        item.aiGradeJson = null
        await manager.getRepository(HsMathTrainSessionItem).save(item)
        n += 1
      }
      if (n > 0) await this.recountSessionLocked(manager, session)
      return n
    })
  }

  /** 文字 DeepSeek 是否允许真实外发（默认 false） */
  isOutboundEnabled(): boolean {
    const flag = (
      this.config.get<string>(HS_MATH_AI_GRADING_ENV_ENABLED, '') || ''
    )
      .trim()
      .toLowerCase()
    if (flag !== 'true' && flag !== '1') return false
    const key = (this.config.get<string>('DEEPSEEK_API_KEY', '') || '').trim()
    return !!key
  }

  /** Vision 是否允许真实外发（默认 false；仅 ENABLED+URL+KEY） */
  isVisionOutboundEnabled(): boolean {
    return this.visionClient.isOutboundEnabled()
  }

  /**
   * APPLICATION-3D-9 / 4C-4B：自动 Vision 是否允许本 user+session(+item)。
   * owner_only 或 TEST allowlist；不依赖前端隐藏。
   */
  canAutoVisionGradeSession(
    userId: string,
    sessionId: string,
    sessionItemId?: string | null,
  ): boolean {
    if (!this.isVisionOutboundEnabled()) return false
    const d = resolveApplicationAiAccess(
      this.applicationAiAccessConfig(true),
      userId,
      sessionId,
      sessionItemId,
    )
    return d.allowed
  }

  /**
   * APPLICATION-3E-3 / 4C-4B：文字 DeepSeek 自动批改范围。
   * 与 Vision 共用 MODE / OWNER / TEST 闸门。
   */
  canAutoTextGradeSession(
    userId: string,
    sessionId: string,
    sessionItemId?: string | null,
  ): boolean {
    if (!this.isOutboundEnabled()) return false
    const d = resolveApplicationAiAccess(
      this.applicationAiAccessConfig(true),
      userId,
      sessionId,
      sessionItemId,
    )
    return d.allowed
  }

  scheduleTextGrading(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    invoker?: HsMathAiGradeInvoker
  }): void {
    const ids = [...new Set(params.sessionItemIds.map(String).filter(Boolean))]
    if (!ids.length) return
    if (!this.canAutoTextGradeSession(params.userId, params.sessionId)) {
      this.logger.warn(
        `Text AI schedule skipped (scope) session=${params.sessionId}`,
      )
      return
    }
    void this.runBatch({
      userId: params.userId,
      sessionId: params.sessionId,
      sessionItemIds: ids,
      invoker: params.invoker,
    }).catch((e) => {
      this.logger.warn(
        `AI grade batch error session=${params.sessionId}: ${(e as Error).message}`,
      )
    })
  }

  /** 仅对本 session 刚提交的 Qwen 项调度（含图或纯文字）；不扫历史 review_required */
  scheduleVisionGrading(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    invoker?: HsMathVisionGradeInvoker
  }): void {
    const ids = [...new Set(params.sessionItemIds.map(String).filter(Boolean))]
    if (!ids.length) return
    if (!this.canAutoVisionGradeSession(params.userId, params.sessionId)) {
      this.logger.warn(
        `Vision schedule skipped (scope) session=${params.sessionId}`,
      )
      return
    }
    void this.runVisionBatch({
      userId: params.userId,
      sessionId: params.sessionId,
      sessionItemIds: ids,
      invoker: params.invoker,
    }).catch((e) => {
      this.logger.warn(
        `Vision grade batch error session=${params.sessionId}: ${(e as Error).message}`,
      )
    })
  }

  /** APPLICATION-3E-1：DeepSeek+含图 → Qwen 转写 + DeepSeek 评分 */
  scheduleDualGrading(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    visionInvoker?: HsMathVisionGradeInvoker
    textInvoker?: HsMathAiGradeInvoker
  }): void {
    const ids = [...new Set(params.sessionItemIds.map(String).filter(Boolean))]
    if (!ids.length) return
    if (
      !this.canAutoVisionGradeSession(params.userId, params.sessionId) ||
      !this.canAutoTextGradeSession(params.userId, params.sessionId)
    ) {
      this.logger.warn(
        `Dual schedule skipped (scope/switches) session=${params.sessionId}`,
      )
      return
    }
    void this.runDualBatch({
      userId: params.userId,
      sessionId: params.sessionId,
      sessionItemIds: ids,
      visionInvoker: params.visionInvoker,
      textInvoker: params.textInvoker,
    }).catch((e) => {
      this.logger.warn(
        `Dual grade batch error session=${params.sessionId}: ${(e as Error).message}`,
      )
    })
  }

  async runBatch(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    invoker?: HsMathAiGradeInvoker
  }): Promise<void> {
    for (const id of params.sessionItemIds) {
      await this.gradeOneSessionItem({
        userId: params.userId,
        sessionId: params.sessionId,
        sessionItemId: id,
        invoker: params.invoker,
      })
    }
  }

  async runVisionBatch(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    invoker?: HsMathVisionGradeInvoker
  }): Promise<void> {
    for (const id of params.sessionItemIds) {
      await this.gradeOneVisionSessionItem({
        userId: params.userId,
        sessionId: params.sessionId,
        sessionItemId: id,
        invoker: params.invoker,
      })
    }
  }

  async runDualBatch(params: {
    userId: string
    sessionId: string
    sessionItemIds: string[]
    visionInvoker?: HsMathVisionGradeInvoker
    textInvoker?: HsMathAiGradeInvoker
  }): Promise<void> {
    for (const id of params.sessionItemIds) {
      await this.gradeOneDualSessionItem({
        userId: params.userId,
        sessionId: params.sessionId,
        sessionItemId: id,
        visionInvoker: params.visionInvoker,
        textInvoker: params.textInvoker,
      })
    }
  }

  async gradeOneSessionItem(params: {
    userId: string
    sessionId: string
    sessionItemId: string
    invoker?: HsMathAiGradeInvoker
  }): Promise<{ status: string; reason?: string }> {
    const key = String(params.sessionItemId)
    if (this.inFlight.has(key)) {
      return { status: 'skipped', reason: 'in_flight' }
    }
    this.inFlight.add(key)
    try {
      const claim = await this.claimForGrading(params)
      if (!claim.ok) {
        return { status: 'skipped', reason: claim.reason }
      }

      const { item } = claim
      const std = item.answerPayloadJson
      const user = item.userAnswerPayloadJson
      if (!std || std.kind !== 'application') {
        await this.failGrading(params, 'invalid_standard')
        return { status: 'grading_failed', reason: 'invalid_standard' }
      }
      if (!user || user.kind !== 'application') {
        await this.failGrading(params, 'invalid_user')
        return { status: 'grading_failed', reason: 'invalid_user' }
      }

      const provider = resolveGradingProviderFromAnswer(user)
      if (provider !== 'deepseek') {
        await this.failGrading(params, 'wrong_provider_pipeline')
        return { status: 'grading_failed', reason: 'wrong_provider_pipeline' }
      }

      const route = classifyApplicationSubmitRoute(user)
      if (route === 'vision_ai') {
        // 防御：含图不得走纯文字 DeepSeek（应走 dual）
        await this.markReviewRequired(params, 'awaiting_multimodal')
        return { status: 'review_required' }
      }
      if (route !== 'text_ai' || !user.text?.trim()) {
        await this.failGrading(params, 'empty_text')
        return { status: 'grading_failed', reason: 'empty_text' }
      }

      const appStd = std as HsMathApplicationAnswerPayload
      const { system, user: userPrompt } = buildHsMathApplicationAiGradePrompt({
        stem: item.stem,
        standardAnswer: appStd.standardAnswer,
        maxScore: appStd.maxScore,
        rubric: appStd.rubric,
        studentText: user.text,
      })

      let content: string
      let model: string
      try {
        const out = await this.invokeDeepseekTextWithBudget(
          params.invoker,
          {
            system,
            user: userPrompt,
            timeoutMs: HS_MATH_AI_GRADING_TIMEOUT_MS,
          },
          params.userId,
        )
        content = out.content
        model = out.model
      } catch (e) {
        const msg = (e as Error).message || 'ai_error'
        const reason = /timeout|超时/i.test(msg)
          ? 'ai_timeout'
          : msg === 'ai_disabled'
            ? 'ai_disabled'
            : msg === 'ai_budget_exceeded'
              ? 'ai_budget_exceeded'
              : msg === HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
                ? HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
                : 'ai_error'
        this.logger.warn(`AI grade fail item=${key} reason=${reason}`)
        await this.failGrading(params, reason)
        return { status: 'grading_failed', reason }
      }

      const gradedAt = new Date()
      const validated = validateHsMathAiGradeResult({
        raw: content,
        rubric: appStd.rubric,
        maxScore: appStd.maxScore,
        model,
        gradedAtIso: gradedAt.toISOString(),
        inputModality: 'text',
        imageCount: 0,
      })
      if (!validated.ok) {
        this.logger.warn(
          `AI grade schema fail item=${key} code=${validated.code}`,
        )
        await this.failGrading(params, validated.code)
        return { status: 'grading_failed', reason: validated.code }
      }

      await this.commitGraded(params, validated.value, model, gradedAt, {
        gradingProvider: 'deepseek',
        pipeline: 'deepseek_text',
        scoringModel: model,
      })
      return { status: 'graded' }
    } finally {
      this.inFlight.delete(key)
    }
  }

  /**
   * APPLICATION-3E-1：Qwen 批改（含图 Vision 或纯文字无图）。
   * 纯文字仍走 Vision client + 正式 rubric prompt，不伪装 DeepSeek。
   */
  async gradeOneVisionSessionItem(params: {
    userId: string
    sessionId: string
    sessionItemId: string
    invoker?: HsMathVisionGradeInvoker
  }): Promise<{ status: string; reason?: string }> {
    const key = String(params.sessionItemId)
    if (this.inFlight.has(key)) {
      return { status: 'skipped', reason: 'in_flight' }
    }
    this.inFlight.add(key)
    try {
      const claim = await this.claimForGrading(params)
      if (!claim.ok) {
        return { status: 'skipped', reason: claim.reason }
      }

      const { item } = claim
      const std = item.answerPayloadJson
      const user = item.userAnswerPayloadJson
      if (!std || std.kind !== 'application') {
        await this.failGrading(params, 'invalid_standard')
        return { status: 'grading_failed', reason: 'invalid_standard' }
      }
      if (!user || user.kind !== 'application') {
        await this.failGrading(params, 'invalid_user')
        return { status: 'grading_failed', reason: 'invalid_user' }
      }

      const provider = resolveGradingProviderFromAnswer(user)
      if (provider !== 'qwen') {
        await this.failGrading(params, 'wrong_provider_pipeline')
        return { status: 'grading_failed', reason: 'wrong_provider_pipeline' }
      }

      const imageIds = extractApplicationImageIds(user)
      const studentText =
        typeof user.text === 'string' && user.text.trim()
          ? user.text.trim()
          : null
      const hasImages = imageIds.length > 0
      if (!hasImages && !studentText) {
        await this.failGrading(params, 'empty_answer')
        return { status: 'grading_failed', reason: 'empty_answer' }
      }

      const appStd = std as HsMathApplicationAnswerPayload
      const pipeline: HsMathApplicationGradePipeline = hasImages
        ? 'qwen_vision'
        : 'qwen_text'

      let images: Array<{ mime: string; base64: string; byteLength: number }> =
        []
      let modality: HsMathAiInputModality = 'text'
      let system: string
      let textUser: string

      if (hasImages) {
        const rows = await this.dataSource
          .getRepository(HsMathTrainSessionItemImage)
          .createQueryBuilder('img')
          .where('img.id IN (:...ids)', { ids: imageIds })
          .getMany()

        const loaded = loadVisionImagesForGrading({
          userId: params.userId,
          sessionItemId: String(item.id),
          imageIds,
          rows,
        })
        if (!loaded.ok) {
          this.logger.warn(
            `Vision image load fail item=${key} code=${loaded.code}`,
          )
          await this.failGrading(params, loaded.code)
          return { status: 'grading_failed', reason: loaded.code }
        }
        images = loaded.images.map((im) => ({
          mime: im.mime,
          base64: im.buffer.toString('base64'),
          byteLength: im.sizeBytes,
        }))
        modality = studentText ? 'mixed' : 'image'
        const p = buildHsMathApplicationVisionAiGradePrompt({
          stem: item.stem,
          standardAnswer: appStd.standardAnswer,
          maxScore: appStd.maxScore,
          rubric: appStd.rubric,
          studentText,
          imageCount: images.length,
        })
        system = p.system
        textUser = p.user
      } else {
        const p = buildHsMathApplicationAiGradePrompt({
          stem: item.stem,
          standardAnswer: appStd.standardAnswer,
          maxScore: appStd.maxScore,
          rubric: appStd.rubric,
          studentText: studentText!,
        })
        system = p.system
        textUser = p.user
        modality = 'text'
      }

      let content: string
      let model: string
      await this.acquireVisionSlot()
      try {
        const invoker =
          params.invoker ||
          (async (p) => {
            if (
              !this.canAutoVisionGradeSession(
                params.userId,
                params.sessionId,
                params.sessionItemId,
              )
            ) {
              throw new Error('vision_disabled')
            }
            return this.visionClient.gradeApplicationVision(p)
          })
        const out = await invoker({
          system,
          textUser,
          images,
          timeoutMs: HS_MATH_VISION_GRADING_TIMEOUT_MS,
        })
        content = out.content
        model = out.model
      } catch (e) {
        const msg = (e as Error).message || 'vision_error'
        const reason = /timeout|超时/i.test(msg)
          ? 'ai_timeout'
          : msg === 'vision_disabled'
            ? 'vision_disabled'
            : 'ai_error'
        this.logger.warn(`Vision grade fail item=${key} reason=${reason}`)
        await this.failGrading(params, reason)
        return { status: 'grading_failed', reason }
      } finally {
        this.releaseVisionSlot()
      }

      const gradedAt = new Date()
      const validated = validateHsMathAiGradeResult({
        raw: content,
        rubric: appStd.rubric,
        maxScore: appStd.maxScore,
        model,
        gradedAtIso: gradedAt.toISOString(),
        inputModality: modality,
        imageCount: images.length,
      })
      if (!validated.ok) {
        this.logger.warn(
          `Vision grade schema fail item=${key} code=${validated.code}`,
        )
        await this.failGrading(params, validated.code)
        return { status: 'grading_failed', reason: validated.code }
      }

      if (hasImages && validated.recognitionUncertain) {
        this.logger.warn(
          `Vision uncertain recognition item=${key} → review_required`,
        )
        await this.markReviewRequired(params, 'uncertain_recognition')
        return { status: 'review_required', reason: 'uncertain_recognition' }
      }

      await this.commitGraded(params, validated.value, model, gradedAt, {
        gradingProvider: 'qwen',
        pipeline,
        visionModel: model,
        scoringModel: model,
      })
      return { status: 'graded' }
    } finally {
      this.inFlight.delete(key)
    }
  }

  /** APPLICATION-3E-1：含图 DeepSeek = Qwen 仅转写 → DeepSeek 评分（同一次 claim） */
  async gradeOneDualSessionItem(params: {
    userId: string
    sessionId: string
    sessionItemId: string
    visionInvoker?: HsMathVisionGradeInvoker
    textInvoker?: HsMathAiGradeInvoker
  }): Promise<{ status: string; reason?: string }> {
    const key = String(params.sessionItemId)
    if (this.inFlight.has(key)) {
      return { status: 'skipped', reason: 'in_flight' }
    }
    this.inFlight.add(key)
    try {
      const claim = await this.claimForGrading(params)
      if (!claim.ok) {
        return { status: 'skipped', reason: claim.reason }
      }

      const { item } = claim
      const std = item.answerPayloadJson
      const user = item.userAnswerPayloadJson
      if (!std || std.kind !== 'application') {
        await this.failGrading(params, 'invalid_standard')
        return { status: 'grading_failed', reason: 'invalid_standard' }
      }
      if (!user || user.kind !== 'application') {
        await this.failGrading(params, 'invalid_user')
        return { status: 'grading_failed', reason: 'invalid_user' }
      }

      const provider = resolveGradingProviderFromAnswer(user)
      if (provider !== 'deepseek') {
        await this.failGrading(params, 'wrong_provider_pipeline')
        return { status: 'grading_failed', reason: 'wrong_provider_pipeline' }
      }

      const imageIds = extractApplicationImageIds(user)
      if (!imageIds.length) {
        await this.failGrading(params, 'dual_requires_images')
        return { status: 'grading_failed', reason: 'dual_requires_images' }
      }

      const rows = await this.dataSource
        .getRepository(HsMathTrainSessionItemImage)
        .createQueryBuilder('img')
        .where('img.id IN (:...ids)', { ids: imageIds })
        .getMany()

      const loaded = loadVisionImagesForGrading({
        userId: params.userId,
        sessionItemId: String(item.id),
        imageIds,
        rows,
      })
      if (!loaded.ok) {
        await this.failGrading(params, loaded.code)
        return { status: 'grading_failed', reason: loaded.code }
      }

      const studentText =
        typeof user.text === 'string' && user.text.trim()
          ? user.text.trim()
          : null

      // owner_only：DeepSeek 额度预检（不扣减）。已满则不调 Qwen 转写。
      if (this.isOwnerOnlyDailyQuotaActive()) {
        const peek = await this.deepseekDailyQuota.hasAvailableQuota(
          params.userId,
        )
        if (!peek.available) {
          const reason =
            peek.reason === HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED ||
            peek.reason === 'daily_limit_invalid' ||
            peek.reason === 'quota_table_missing'
              ? HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
              : peek.reason || HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
          this.logger.warn(
            `Dual skip Qwen (DeepSeek quota) item=${key} reason=${reason}`,
          )
          await this.failGrading(params, reason)
          return { status: 'grading_failed', reason }
        }
      }

      const { system: trSystem, user: trUser } =
        buildHsMathApplicationVisionTranscribePrompt({
          stem: item.stem,
          studentText,
          imageCount: loaded.images.length,
        })

      let visionModel: string
      let transcribeRaw: string
      await this.acquireVisionSlot()
      try {
        const invoker =
          params.visionInvoker ||
          (async (p) => {
            if (
              !this.canAutoVisionGradeSession(
                params.userId,
                params.sessionId,
                params.sessionItemId,
              )
            ) {
              throw new Error('vision_disabled')
            }
            return this.visionClient.gradeApplicationVision(p)
          })
        const out = await invoker({
          system: trSystem,
          textUser: trUser,
          images: loaded.images.map((im) => ({
            mime: im.mime,
            base64: im.buffer.toString('base64'),
            byteLength: im.sizeBytes,
          })),
          timeoutMs: HS_MATH_VISION_GRADING_TIMEOUT_MS,
        })
        transcribeRaw = out.content
        visionModel = out.model
      } catch (e) {
        const msg = (e as Error).message || 'vision_error'
        const reason = /timeout|超时/i.test(msg)
          ? 'ai_timeout'
          : msg === 'vision_disabled'
            ? 'vision_disabled'
            : 'ai_error'
        this.logger.warn(`Dual transcribe fail item=${key} reason=${reason}`)
        await this.failGrading(params, reason)
        return { status: 'grading_failed', reason }
      } finally {
        this.releaseVisionSlot()
      }

      const transcribed = parseVisionTranscribeResult(transcribeRaw, {
        imageCount: loaded.images.length,
      })
      if (!transcribed) {
        await this.failGrading(params, 'transcribe_parse_fail')
        return { status: 'grading_failed', reason: 'transcribe_parse_fail' }
      }
      const gate = evaluateTranscribeForDeepSeek(transcribed, {
        imageCount: loaded.images.length,
      })
      if (!gate.ok) {
        if (gate.disposition === 'grading_failed') {
          await this.failGrading(params, gate.reason)
          return { status: 'grading_failed', reason: gate.reason }
        }
        // 3E-4：review_required 时保留转写诊断，便于审计（不调 DeepSeek）
        await this.commitTranscribeReviewRequired(params, {
          reason: gate.reason,
          visionModel,
          transcribed: {
            recognizedWork: transcribed.recognizedWork,
            recognitionUncertain: transcribed.recognitionUncertain,
            recognitionWarnings: transcribed.recognitionWarnings,
            confidence: transcribed.confidence,
            uncertainFieldPresent: transcribed.uncertainFieldPresent,
          },
        })
        return { status: 'review_required', reason: gate.reason }
      }

      const scoringText = buildDualScoringStudentText({
        studentText,
        recognizedWork: transcribed.recognizedWork,
      })
      if (!scoringText.trim()) {
        await this.failGrading(params, 'empty_after_transcribe')
        return { status: 'grading_failed', reason: 'empty_after_transcribe' }
      }

      const appStd = std as HsMathApplicationAnswerPayload
      const { system, user: userPrompt } = buildHsMathApplicationAiGradePrompt({
        stem: item.stem,
        standardAnswer: appStd.standardAnswer,
        maxScore: appStd.maxScore,
        rubric: appStd.rubric,
        studentText: scoringText,
      })

      let content: string
      let scoringModel: string
      try {
        const out = await this.invokeDeepseekTextWithBudget(
          async (p) => {
            if (
              !this.canAutoTextGradeSession(
                params.userId,
                params.sessionId,
                params.sessionItemId,
              )
            ) {
              throw new Error('ai_disabled')
            }
            if (params.textInvoker) return params.textInvoker(p)
            if (!this.isOutboundEnabled()) {
              throw new Error('ai_disabled')
            }
            return this.deepseek.gradeHsMathApplicationText(p)
          },
          {
            system,
            user: userPrompt,
            timeoutMs: HS_MATH_AI_GRADING_TIMEOUT_MS,
          },
          params.userId,
        )
        content = out.content
        scoringModel = out.model
      } catch (e) {
        const msg = (e as Error).message || 'ai_error'
        const reason = /timeout|超时/i.test(msg)
          ? 'ai_timeout'
          : msg === 'ai_disabled'
            ? 'ai_disabled'
            : msg === 'ai_budget_exceeded'
              ? 'ai_budget_exceeded'
              : msg === HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
                ? HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED
                : 'ai_error'
        this.logger.warn(
          `Dual DeepSeek fail item=${key} reason=${reason} (no Qwen retry)`,
        )
        await this.failGrading(params, reason)
        return { status: 'grading_failed', reason }
      }

      const gradedAt = new Date()
      const validated = validateHsMathAiGradeResult({
        raw: content,
        rubric: appStd.rubric,
        maxScore: appStd.maxScore,
        model: scoringModel,
        gradedAtIso: gradedAt.toISOString(),
        inputModality: studentText ? 'mixed' : 'image',
        imageCount: loaded.images.length,
      })
      if (!validated.ok) {
        await this.failGrading(params, validated.code)
        return { status: 'grading_failed', reason: validated.code }
      }

      const gradeValue = {
        ...validated.value,
        recognizedWork: scoringText,
        recognitionWarnings: transcribed.recognitionWarnings.length
          ? transcribed.recognitionWarnings
          : validated.value.recognitionWarnings,
        confidence:
          transcribed.confidence ?? validated.value.confidence ?? null,
        visionCallCount: 1,
        scoringCallCount: 1,
      }

      await this.commitGraded(
        params,
        gradeValue,
        scoringModel,
        gradedAt,
        {
          gradingProvider: 'deepseek',
          pipeline: 'qwen_then_deepseek',
          visionModel,
          scoringModel,
        },
      )
      return { status: 'graded' }
    } finally {
      this.inFlight.delete(key)
    }
  }

  private async claimForGrading(params: {
    userId: string
    sessionId: string
    sessionItemId: string
  }): Promise<
    | { ok: true; item: HsMathTrainSessionItem }
    | { ok: false; reason: string }
  > {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return { ok: false, reason: 'session_not_found' }

      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: params.sessionItemId,
          sessionId: params.sessionId,
        })
        .getOne()
      if (!item) return { ok: false, reason: 'item_not_found' }
      if (item.qtype !== 'application') {
        return { ok: false, reason: 'not_application' }
      }
      const reject = shouldRejectClaim(item.gradeResult)
      if (reject.reject) {
        return { ok: false, reason: reject.reason }
      }

      const attempts = Number(item.aiAttemptCount) || 0
      if (attempts >= HS_MATH_AI_GRADING_MAX_ATTEMPTS) {
        item.gradeResult = 'grading_failed'
        item.gradeReason = 'max_attempts'
        await manager.getRepository(HsMathTrainSessionItem).save(item)
        await this.recountSessionLocked(manager, session)
        return { ok: false, reason: 'max_attempts' }
      }

      item.gradeResult = 'grading'
      item.gradeReason = formatAiGradingReason(Date.now())
      item.aiAttemptCount = attempts + 1
      await manager.getRepository(HsMathTrainSessionItem).save(item)
      await this.recountSessionLocked(manager, session)
      return { ok: true, item }
    })
  }

  private async commitGraded(
    params: { userId: string; sessionId: string; sessionItemId: string },
    grade: Record<string, unknown>,
    model: string,
    gradedAt: Date,
    meta?: HsMathAiGradeCommitMeta,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return

      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: params.sessionItemId,
          sessionId: params.sessionId,
        })
        .getOne()
      if (!item) return
      if (item.gradeResult === 'graded' && item.aiGradeJson) return
      if (item.gradeResult !== 'grading') return

      const payload: Record<string, unknown> = { ...grade }
      if (meta) {
        payload.gradingProvider = meta.gradingProvider
        payload.pipeline = meta.pipeline
        if (meta.visionModel) {
          payload.visionModel = String(meta.visionModel).slice(0, 64)
        }
        if (meta.scoringModel) {
          payload.scoringModel = String(meta.scoringModel).slice(0, 64)
        }
      }

      item.gradeResult = 'graded'
      item.gradeReason = 'ai_graded'
      item.aiGradeJson = payload
      item.aiModel = model.slice(0, 64)
      item.aiGradedAt = gradedAt
      await manager.getRepository(HsMathTrainSessionItem).save(item)
      await this.recountSessionLocked(manager, session)
    })
  }

  private async failGrading(
    params: { userId: string; sessionId: string; sessionItemId: string },
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return

      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: params.sessionItemId,
          sessionId: params.sessionId,
        })
        .getOne()
      if (!item) return
      if (item.gradeResult === 'graded') return

      item.gradeResult = 'grading_failed'
      item.gradeReason = reason.slice(0, 255)
      item.aiGradeJson = null
      await manager.getRepository(HsMathTrainSessionItem).save(item)
      await this.recountSessionLocked(manager, session)
    })
  }

  /**
   * APPLICATION-3E-4：转写质量不足 → review_required，并保留诊断 JSON（无评分、未调 DeepSeek）。
   */
  private async commitTranscribeReviewRequired(
    params: { userId: string; sessionId: string; sessionItemId: string },
    input: {
      reason: string
      visionModel: string
      transcribed: {
        recognizedWork: string
        recognitionUncertain: boolean
        recognitionWarnings: HsMathRecognitionWarning[]
        confidence: number | null
        uncertainFieldPresent: boolean
      }
    },
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return
      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: params.sessionItemId,
          sessionId: params.sessionId,
        })
        .getOne()
      if (!item || item.gradeResult === 'graded') return
      if (item.gradeResult !== 'grading') return

      item.gradeResult = 'review_required'
      item.gradeReason = input.reason.slice(0, 255)
      item.aiModel = String(input.visionModel || '').slice(0, 64) || null
      item.aiGradedAt = null
      item.aiGradeJson = {
        status: 'review_required',
        reason: input.reason,
        gradingProvider: 'deepseek',
        pipeline: 'qwen_then_deepseek',
        visionModel: String(input.visionModel || '').slice(0, 64),
        visionCallCount: 1,
        scoringCallCount: 0,
        recognizedWork: input.transcribed.recognizedWork.slice(0, 8000),
        recognitionUncertain: input.transcribed.recognitionUncertain,
        recognitionWarnings: input.transcribed.recognitionWarnings,
        confidence: input.transcribed.confidence,
        uncertainFieldPresent: input.transcribed.uncertainFieldPresent,
      }
      await manager.getRepository(HsMathTrainSessionItem).save(item)
      await this.recountSessionLocked(manager, session)
    })
  }

  private async markReviewRequired(
    params: {
      userId: string
      sessionId: string
      sessionItemId: string
    },
    reason = 'awaiting_multimodal',
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const session = await manager
        .getRepository(HsMathTrainSession)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id AND s.user_id = :userId', {
          id: params.sessionId,
          userId: params.userId,
        })
        .getOne()
      if (!session) return
      const item = await manager
        .getRepository(HsMathTrainSessionItem)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.id = :id AND i.session_id = :sessionId', {
          id: params.sessionItemId,
          sessionId: params.sessionId,
        })
        .getOne()
      if (!item || item.gradeResult === 'graded') return
      item.gradeResult = 'review_required'
      item.gradeReason = reason.slice(0, 255)
      item.aiGradeJson = null
      await manager.getRepository(HsMathTrainSessionItem).save(item)
      await this.recountSessionLocked(manager, session)
    })
  }

  private async recountSessionLocked(
    manager: import('typeorm').EntityManager,
    session: HsMathTrainSession,
  ): Promise<void> {
    const items = await manager.getRepository(HsMathTrainSessionItem).find({
      where: { sessionId: session.id },
      select: ['gradeResult'],
    })
    const counts = recountHsMathSessionGradeCounts(
      items.map((i) => i.gradeResult),
    )
    session.correctCount = counts.correct
    session.wrongCount = counts.wrong
    session.pendingCount = counts.pending
    await manager.getRepository(HsMathTrainSession).save(session)
  }
}
