import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { DeepseekClientService } from '../ai-reference/deepseek-client.service'
import { OcrClientService } from '../ai-reference/ocr-client.service'
import { Attachment } from '../attachments/attachment.entity'
import { AiAccessService } from '../auth/ai-access.service'
import { OcrAccessService } from '../auth/ocr-access.service'
import {
  AI_OCR_GRADE_PROMPT_VERSION,
  AI_OCR_PARSE_PROMPT_VERSION,
  AI_OCR_COMPARE_PROMPT_VERSION,
  AI_OCR_RECOG_PROMPT_VERSION,
  type AiOcrProvider,
  type AiOcrSubject,
} from './ai-ocr.constants'
import { AiOcrQwenTextClient } from './ai-ocr-qwen-text.client'
import { AiOcrAnalysis } from './entities/ai-ocr-analysis.entity'
import { AiOcrGrading } from './entities/ai-ocr-grading.entity'
import { AiOcrRecognition } from './entities/ai-ocr-recognition.entity'
import {
  buildCompareSystemPrompt,
  buildCompareUserPrompt,
  buildGradeSystemPrompt,
  buildGradeUserPrompt,
  buildNoAnswerGradeSystemPrompt,
  buildNoAnswerGradeUserPrompt,
  buildParseSystemPrompt,
  buildParseUserPrompt,
  isImageAttachment,
  normalizeOcrLatexEscapes,
  parseModelAnalysisJson,
  previewModelContent,
  parseModelCompareJson,
  parseModelGradeJson,
  parseModelNoAnswerGradeJson,
  resolveInputSnapshot,
  resolveQuestionSnapshot,
  resolveStudentAnswerSnapshot,
  subjectLabel,
  toSafeErrorMessage,
} from './util/ai-ocr-helpers'

@Injectable()
export class AiOcrService {
  constructor(
    @InjectRepository(AiOcrRecognition)
    private readonly recognitionRepo: Repository<AiOcrRecognition>,
    @InjectRepository(AiOcrAnalysis)
    private readonly analysisRepo: Repository<AiOcrAnalysis>,
    @InjectRepository(AiOcrGrading)
    private readonly gradingRepo: Repository<AiOcrGrading>,
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly ocr: OcrClientService,
    private readonly qwenText: AiOcrQwenTextClient,
    private readonly deepseek: DeepseekClientService,
    private readonly ocrAccess: OcrAccessService,
    private readonly aiAccess: AiAccessService,
  ) {}

  private async assertGates(userId: string) {
    await this.ocrAccess.assertCanUseOcr(userId)
    await this.aiAccess.assertCanUseAi(userId)
  }

  private toRecognitionView(
    row: AiOcrRecognition,
    attachmentUrl?: string | null,
  ) {
    return {
      id: String(row.id),
      subject: row.subject,
      attachmentId: String(row.attachmentId),
      attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
      status: row.status,
      recognizedTextRaw: row.recognizedTextRaw,
      engine: row.engine,
      model: row.model,
      promptVersion: row.promptVersion,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private async loadAttachmentUrlMap(
    userId: string,
    attachmentIds: string[],
  ): Promise<Map<string, string>> {
    const ids = [...new Set(attachmentIds.map((x) => String(x)).filter(Boolean))]
    const map = new Map<string, string>()
    if (!ids.length) return map
    const rows = await this.attachmentRepo.find({
      where: { userId, id: In(ids) },
    })
    for (const r of rows) {
      if (r.url) map.set(String(r.id), String(r.url))
    }
    return map
  }

  private toAnalysisView(row: AiOcrAnalysis) {
    return {
      id: String(row.id),
      recognitionId: String(row.recognitionId),
      provider: row.provider,
      status: row.status,
      inputTextSnapshot: row.inputTextSnapshot,
      aiAnswerText: row.aiAnswerText,
      aiAnalysisText: row.aiAnalysisText,
      knowledgePointsText: row.knowledgePointsText,
      methodSummaryText: row.methodSummaryText,
      selfCheckText: row.selfCheckText,
      comparedAnalysisId: row.comparedAnalysisId
        ? String(row.comparedAnalysisId)
        : null,
      compareVerdict: row.compareVerdict,
      compareNote: row.compareNote,
      revisedByCompare: !!row.revisedByCompare,
      model: row.model,
      promptVersion: row.promptVersion,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private toGradingView(row: AiOcrGrading) {
    return {
      id: String(row.id),
      recognitionId: String(row.recognitionId),
      provider: row.provider,
      status: row.status,
      answerAttachmentId: row.answerAttachmentId
        ? String(row.answerAttachmentId)
        : null,
      studentAnswerRaw: row.studentAnswerRaw,
      studentAnswerSnapshot: row.studentAnswerSnapshot,
      questionTextSnapshot: row.questionTextSnapshot,
      score: row.score,
      verdict: row.verdict,
      feedbackText: row.feedbackText,
      correctAnswerText: row.correctAnswerText,
      correctAnalysisText: row.correctAnalysisText,
      model: row.model,
      promptVersion: row.promptVersion,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private async chatModel(opts: {
    provider: AiOcrProvider
    system: string
    user: string
    maxTokens?: number
  }): Promise<{ content: string; model: string; finishReason: string | null }> {
    if (opts.provider === 'qwen') {
      return this.qwenText.chatText({
        system: opts.system,
        user: opts.user,
        maxTokens: opts.maxTokens,
      })
    }
    const out = await this.deepseek.chatText({
      system: opts.system,
      user: opts.user,
      temperature: 0.2,
      forceJson: true,
    })
    return { content: out.content, model: out.model, finishReason: null }
  }

  async listRecognitions(
    userId: string,
    query: { subject?: AiOcrSubject; page?: number; pageSize?: number },
  ) {
    await this.assertGates(userId)
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where: { userId: string; subject?: AiOcrSubject } = { userId }
    if (query.subject) where.subject = query.subject
    const [rows, total] = await this.recognitionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    const urlMap = await this.loadAttachmentUrlMap(
      userId,
      rows.map((r) => String(r.attachmentId)),
    )
    return {
      items: rows.map((r) =>
        this.toRecognitionView(r, urlMap.get(String(r.attachmentId)) || null),
      ),
      total,
      page,
      pageSize,
    }
  }

  async getRecognition(userId: string, recognitionId: string) {
    await this.assertGates(userId)
    const row = await this.recognitionRepo.findOne({
      where: { id: recognitionId, userId },
    })
    if (!row) throw new NotFoundException('识别记录不存在')
    const urlMap = await this.loadAttachmentUrlMap(userId, [
      String(row.attachmentId),
    ])
    return this.toRecognitionView(
      row,
      urlMap.get(String(row.attachmentId)) || null,
    )
  }

  async createRecognition(
    userId: string,
    dto: {
      subject: AiOcrSubject
      attachmentId: string
      consentAccepted: true
    },
  ) {
    if (dto.consentAccepted !== true) {
      throw new BadRequestException('请先确认隐私提示后再发起识别')
    }
    await this.assertGates(userId)

    const att = await this.attachmentRepo.findOne({
      where: { id: dto.attachmentId, userId },
    })
    if (!att) throw new NotFoundException('附件不存在')
    if (!isImageAttachment({ mimeType: att.mimeType, url: att.url })) {
      throw new BadRequestException('仅支持上传图片进行识别')
    }

    const pending = this.recognitionRepo.create({
      userId,
      subject: dto.subject,
      attachmentId: att.id,
      status: 'pending',
      recognizedTextRaw: null,
      engine: null,
      model: null,
      promptVersion: AI_OCR_RECOG_PROMPT_VERSION,
      errorCode: null,
      errorMessage: null,
    })
    const saved = await this.recognitionRepo.save(pending)

    try {
      const abs = this.ocr.resolveUploadAbsolutePath(att.url)
      const result = await this.ocr.ocrByFile(abs, 'smart')
      if (!result.text || !String(result.text).trim()) {
        saved.status = 'failed'
        saved.errorCode = 'empty_ocr_text'
        saved.errorMessage = '未能识别出文字，请换清晰题目图片后重试'
        saved.engine = result.engine ? String(result.engine).slice(0, 64) : null
        await this.recognitionRepo.save(saved)
        throw new BadRequestException(saved.errorMessage)
      }
      const engine = result.engine ? String(result.engine).slice(0, 64) : null
      let model: string | null = null
      if (engine && engine.includes(':')) {
        model = engine.split(':').slice(1).join(':').slice(0, 64) || null
      }
      saved.status = 'succeeded'
      saved.recognizedTextRaw = normalizeOcrLatexEscapes(String(result.text))
      saved.engine = engine
      saved.model = model
      saved.errorCode = null
      saved.errorMessage = null
      await this.recognitionRepo.save(saved)
      return this.toRecognitionView(saved, att.url)
    } catch (e) {
      if (saved.status === 'succeeded') throw e
      if (saved.status === 'failed' && e instanceof BadRequestException) throw e
      const code =
        e instanceof ServiceUnavailableException
          ? 'ocr_unavailable'
          : e instanceof BadRequestException
            ? 'ocr_bad_request'
            : 'ocr_error'
      const msg = toSafeErrorMessage(
        (e as Error)?.message,
        '题目图片识别失败，请稍后重试',
      )
      saved.status = 'failed'
      saved.errorCode = code
      saved.errorMessage = msg
      await this.recognitionRepo.save(saved)
      if (
        e instanceof BadRequestException ||
        e instanceof ServiceUnavailableException ||
        e instanceof ForbiddenException ||
        e instanceof NotFoundException
      ) {
        throw e
      }
      throw new ServiceUnavailableException(msg)
    }
  }

  async listAnalyses(
    userId: string,
    recognitionId: string,
    query: { page?: number; pageSize?: number },
  ) {
    await this.assertGates(userId)
    const rec = await this.recognitionRepo.findOne({
      where: { id: recognitionId, userId },
    })
    if (!rec) throw new NotFoundException('识别记录不存在')
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [rows, total] = await this.analysisRepo.findAndCount({
      where: { userId, recognitionId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    return {
      items: rows.map((r) => this.toAnalysisView(r)),
      total,
      page,
      pageSize,
    }
  }

  async getAnalysis(
    userId: string,
    recognitionId: string,
    analysisId: string,
  ) {
    await this.assertGates(userId)
    const row = await this.analysisRepo.findOne({
      where: { id: analysisId, userId, recognitionId },
    })
    if (!row) throw new NotFoundException('解析记录不存在')
    return this.toAnalysisView(row)
  }

  async deleteAnalysis(
    userId: string,
    recognitionId: string,
    analysisId: string,
  ) {
    await this.assertGates(userId)
    const row = await this.analysisRepo.findOne({
      where: { id: analysisId, userId, recognitionId },
    })
    if (!row) throw new NotFoundException('解析记录不存在')
    await this.analysisRepo.remove(row)
    return { deleted: true, id: String(analysisId) }
  }

  async createAnalysis(
    userId: string,
    recognitionId: string,
    dto: {
      provider: AiOcrProvider
      inputText?: string
      consentAccepted: true
    },
  ) {
    if (dto.consentAccepted !== true) {
      throw new BadRequestException('请先确认隐私提示后再发起解析')
    }
    await this.assertGates(userId)

    const recognition = await this.recognitionRepo.findOne({
      where: { id: recognitionId, userId },
    })
    if (!recognition) throw new NotFoundException('识别记录不存在')
    if (recognition.status !== 'succeeded') {
      throw new BadRequestException('仅可对识别成功的记录发起解析')
    }
    if (
      !recognition.recognizedTextRaw ||
      !String(recognition.recognizedTextRaw).trim()
    ) {
      throw new BadRequestException('识别文字为空，无法解析')
    }

    const resolved = resolveInputSnapshot({
      inputText: dto.inputText,
      recognizedTextRaw: recognition.recognizedTextRaw,
    })
    if (!resolved.ok) {
      if (resolved.reason === 'empty_input_text') {
        throw new BadRequestException('修正文字不能为空')
      }
      if (resolved.reason === 'input_too_long') {
        throw new BadRequestException('修正文字过长')
      }
      throw new BadRequestException('识别文字为空，无法解析')
    }
    const snapshot = resolved.snapshot

    const pending = this.analysisRepo.create({
      userId,
      recognitionId: recognition.id,
      provider: dto.provider,
      status: 'pending',
      inputTextSnapshot: snapshot,
      aiAnswerText: null,
      aiAnalysisText: null,
      knowledgePointsText: null,
      methodSummaryText: null,
      selfCheckText: null,
      comparedAnalysisId: null,
      compareVerdict: null,
      compareNote: null,
      revisedByCompare: 0,
      model: null,
      promptVersion: AI_OCR_PARSE_PROMPT_VERSION,
      errorCode: null,
      errorMessage: null,
    })
    const saved = await this.analysisRepo.save(pending)

    const system = buildParseSystemPrompt(subjectLabel(recognition.subject))
    const userPrompt = buildParseUserPrompt(snapshot)

    try {
      const { content, model, finishReason } = await this.chatModel({
        provider: dto.provider,
        system,
        user: userPrompt,
        maxTokens: 2048,
      })

      // 先尝试解析；截断时若 answer 已写出则 salvage，避免整单失败
      const parsed = parseModelAnalysisJson(content)
      if (!parsed.ok) {
        if (finishReason === 'length') {
          saved.status = 'failed'
          saved.errorCode = 'model_truncated'
          saved.errorMessage =
            '模型输出被截断，请改用 DeepSeek 或稍后重试'
          saved.model = model.slice(0, 64)
          await this.analysisRepo.save(saved)
          throw new BadRequestException(saved.errorMessage)
        }
        const preview = previewModelContent(content)
        saved.status = 'failed'
        saved.errorCode = `parse_${parsed.reason}`
        saved.errorMessage = preview
          ? `模型返回格式无效（${preview}）`.slice(0, 255)
          : '模型返回格式无效，请稍后重试'
        saved.model = model.slice(0, 64)
        await this.analysisRepo.save(saved)
        throw new BadRequestException('模型返回格式无效，请稍后重试')
      }

      saved.status = 'succeeded'
      saved.aiAnswerText = parsed.value.answer
      saved.aiAnalysisText = parsed.value.analysis
      saved.knowledgePointsText = parsed.value.knowledgePoints
      saved.methodSummaryText = parsed.value.methodSummary
      saved.selfCheckText = parsed.value.selfCheck
      saved.model = model.slice(0, 64)
      saved.errorCode = null
      saved.errorMessage = null
      await this.analysisRepo.save(saved)

      await this.maybeCompareWithPriorAnalysis({
        userId,
        recognitionId: recognition.id,
        subject: recognition.subject,
        questionSnapshot: snapshot,
        current: saved,
        provider: dto.provider,
      })

      return this.toAnalysisView(saved)
    } catch (e) {
      if (saved.status === 'succeeded') throw e
      if (saved.status === 'failed' && e instanceof BadRequestException) throw e
      const code =
        e instanceof ServiceUnavailableException
          ? 'model_unavailable'
          : e instanceof BadRequestException
            ? 'model_bad_request'
            : 'model_error'
      const msg = toSafeErrorMessage(
        (e as Error)?.message,
        '题目解析失败，请稍后重试',
      )
      saved.status = 'failed'
      saved.errorCode = code
      saved.errorMessage = msg
      await this.analysisRepo.save(saved)
      if (
        e instanceof BadRequestException ||
        e instanceof ServiceUnavailableException ||
        e instanceof ForbiddenException ||
        e instanceof NotFoundException
      ) {
        throw e
      }
      throw new ServiceUnavailableException(msg)
    }
  }

  /**
   * 若同题已有更早的成功解答（优先不同 provider），则用当前模型做对比并落库。
   * 只标明异同，不改写任何一方答案；对比失败不推翻本次解答成功。
   */
  private async maybeCompareWithPriorAnalysis(opts: {
    userId: string
    recognitionId: string
    subject: AiOcrSubject
    questionSnapshot: string
    current: AiOcrAnalysis
    provider: AiOcrProvider
  }) {
    const current = opts.current
    if (current.status !== 'succeeded' || !current.aiAnswerText) return

    const priors = await this.analysisRepo.find({
      where: {
        userId: opts.userId,
        recognitionId: opts.recognitionId,
        status: 'succeeded',
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 20,
    })
    const prior =
      priors.find(
        (p) =>
          String(p.id) !== String(current.id) &&
          p.provider !== current.provider &&
          !!p.aiAnswerText,
      ) ||
      priors.find(
        (p) => String(p.id) !== String(current.id) && !!p.aiAnswerText,
      )
    if (!prior?.aiAnswerText) return

    try {
      const label = subjectLabel(opts.subject)
      const system = buildCompareSystemPrompt(label)
      const user = buildCompareUserPrompt({
        question: opts.questionSnapshot,
        priorProvider: prior.provider,
        priorAnswer: prior.aiAnswerText,
        currentProvider: current.provider,
        currentAnswer: current.aiAnswerText,
      })
      const { content, finishReason } = await this.chatModel({
        provider: opts.provider,
        system,
        user,
        maxTokens: 1024,
      })
      if (finishReason === 'length') {
        current.comparedAnalysisId = prior.id
        current.compareVerdict = 'uncertain'
        current.compareNote =
          '对比输出被截断，未能完成与先前解答的核对（仅供参考）。'
        current.revisedByCompare = 0
        await this.analysisRepo.save(current)
        return
      }
      const parsed = parseModelCompareJson(content)
      if (!parsed.ok) {
        current.comparedAnalysisId = prior.id
        current.compareVerdict = 'uncertain'
        current.compareNote =
          '未能解析对比结果，请人工核对与先前解答是否一致（仅供参考）。'
        current.revisedByCompare = 0
        await this.analysisRepo.save(current)
        return
      }
      current.comparedAnalysisId = prior.id
      current.compareVerdict = parsed.value.verdict
      current.compareNote =
        `[${AI_OCR_COMPARE_PROMPT_VERSION}] ${parsed.value.note}`.slice(0, 4000)
      current.revisedByCompare = 0
      await this.analysisRepo.save(current)
    } catch {
      current.comparedAnalysisId = prior.id
      current.compareVerdict = 'uncertain'
      current.compareNote =
        '对比调用失败，请人工核对与先前解答是否一致（仅供参考）。'
      current.revisedByCompare = 0
      try {
        await this.analysisRepo.save(current)
      } catch {
        /* ignore */
      }
    }
  }

  async listGradings(
    userId: string,
    recognitionId: string,
    query: { page?: number; pageSize?: number },
  ) {
    await this.assertGates(userId)
    const rec = await this.recognitionRepo.findOne({
      where: { id: recognitionId, userId },
    })
    if (!rec) throw new NotFoundException('识别记录不存在')
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [rows, total] = await this.gradingRepo.findAndCount({
      where: { userId, recognitionId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    return {
      items: rows.map((r) => this.toGradingView(r)),
      total,
      page,
      pageSize,
    }
  }

  async getGrading(
    userId: string,
    recognitionId: string,
    gradingId: string,
  ) {
    await this.assertGates(userId)
    const row = await this.gradingRepo.findOne({
      where: { id: gradingId, userId, recognitionId },
    })
    if (!row) throw new NotFoundException('批改记录不存在')
    return this.toGradingView(row)
  }

  async createGrading(
    userId: string,
    recognitionId: string,
    dto: {
      provider: AiOcrProvider
      questionText?: string
      studentAnswerText?: string
      answerAttachmentId?: string
      consentAccepted: true
    },
  ) {
    if (dto.consentAccepted !== true) {
      throw new BadRequestException('请先确认隐私提示后再发起批改')
    }
    await this.assertGates(userId)

    const recognition = await this.recognitionRepo.findOne({
      where: { id: recognitionId, userId },
    })
    if (!recognition) throw new NotFoundException('识别记录不存在')
    if (recognition.status !== 'succeeded') {
      throw new BadRequestException('仅可对识别成功的记录发起批改')
    }
    if (
      !recognition.recognizedTextRaw ||
      !String(recognition.recognizedTextRaw).trim()
    ) {
      throw new BadRequestException('识别文字为空，无法批改')
    }

    const qResolved = resolveQuestionSnapshot({
      questionText: dto.questionText,
      recognizedTextRaw: recognition.recognizedTextRaw,
    })
    if (!qResolved.ok) {
      if (qResolved.reason === 'empty_input_text') {
        throw new BadRequestException('题目文字不能为空')
      }
      if (qResolved.reason === 'input_too_long') {
        throw new BadRequestException('题目文字过长')
      }
      throw new BadRequestException('题目文字为空，无法批改')
    }
    const questionSnapshot = qResolved.snapshot

    let answerAttachmentId: string | null = null
    let studentAnswerRaw: string | null = null

    if (dto.answerAttachmentId) {
      const att = await this.attachmentRepo.findOne({
        where: { id: dto.answerAttachmentId, userId },
      })
      if (!att) throw new NotFoundException('作答附件不存在')
      if (!isImageAttachment({ mimeType: att.mimeType, url: att.url })) {
        throw new BadRequestException('作答仅支持上传图片')
      }
      answerAttachmentId = att.id
      try {
        const abs = this.ocr.resolveUploadAbsolutePath(att.url)
        const result = await this.ocr.ocrByFile(abs, 'smart')
        const text = String(result.text || '').trim()
        if (!text) {
          throw new BadRequestException(
            '未能识别作出答文字，请换清晰作答图片或直接填写文字',
          )
        }
        studentAnswerRaw = normalizeOcrLatexEscapes(text)
      } catch (e) {
        if (
          e instanceof BadRequestException ||
          e instanceof ServiceUnavailableException ||
          e instanceof ForbiddenException ||
          e instanceof NotFoundException
        ) {
          throw e
        }
        throw new ServiceUnavailableException(
          toSafeErrorMessage(
            (e as Error)?.message,
            '作答图片识别失败，请稍后重试',
          ),
        )
      }
    }

    const aResolved = resolveStudentAnswerSnapshot({
      studentAnswerText: dto.studentAnswerText,
      studentAnswerRaw,
    })
    if (!aResolved.ok) {
      if (aResolved.reason === 'input_too_long') {
        throw new BadRequestException('作答文字过长')
      }
      throw new BadRequestException('作答文字无效')
    }
    const emptyAnswer = aResolved.empty
    const studentSnapshot = aResolved.snapshot

    const pending = this.gradingRepo.create({
      userId,
      recognitionId: recognition.id,
      provider: dto.provider,
      status: 'pending',
      answerAttachmentId,
      studentAnswerRaw,
      studentAnswerSnapshot: studentSnapshot,
      questionTextSnapshot: questionSnapshot,
      score: null,
      verdict: null,
      feedbackText: null,
      correctAnswerText: null,
      correctAnalysisText: null,
      model: null,
      promptVersion: AI_OCR_GRADE_PROMPT_VERSION,
      errorCode: null,
      errorMessage: null,
    })
    const saved = await this.gradingRepo.save(pending)
    const label = subjectLabel(recognition.subject)

    try {
      if (emptyAnswer) {
        const system = buildNoAnswerGradeSystemPrompt(label)
        const userPrompt = buildNoAnswerGradeUserPrompt(questionSnapshot)
        const { content, model } = await this.chatModel({
          provider: dto.provider,
          system,
          user: userPrompt,
        })
        const parsed = parseModelNoAnswerGradeJson(content)
        if (!parsed.ok) {
          saved.status = 'failed'
          saved.errorCode = `parse_${parsed.reason}`
          saved.errorMessage = '模型返回格式无效，请稍后重试'
          saved.model = model.slice(0, 64)
          await this.gradingRepo.save(saved)
          throw new BadRequestException(saved.errorMessage)
        }
        saved.status = 'succeeded'
        saved.score = 0
        saved.verdict = 'no_answer'
        saved.feedbackText = '未提交作答，得分 0。以下为标准答案与解析。'
        saved.correctAnswerText = parsed.value.correctAnswer
        saved.correctAnalysisText = parsed.value.correctAnalysis
        saved.model = model.slice(0, 64)
        saved.errorCode = null
        saved.errorMessage = null
        await this.gradingRepo.save(saved)
        return this.toGradingView(saved)
      }

      const system = buildGradeSystemPrompt(label)
      const userPrompt = buildGradeUserPrompt({
        question: questionSnapshot,
        studentAnswer: studentSnapshot!,
      })
      const { content, model } = await this.chatModel({
        provider: dto.provider,
        system,
        user: userPrompt,
      })
      const parsed = parseModelGradeJson(content)
      if (!parsed.ok) {
        saved.status = 'failed'
        saved.errorCode = `parse_${parsed.reason}`
        saved.errorMessage = '模型返回格式无效，请稍后重试'
        saved.model = model.slice(0, 64)
        await this.gradingRepo.save(saved)
        throw new BadRequestException(saved.errorMessage)
      }
      saved.status = 'succeeded'
      saved.score = parsed.value.score
      saved.verdict = parsed.value.verdict
      saved.feedbackText = parsed.value.feedback
      saved.correctAnswerText = parsed.value.correctAnswer
      saved.correctAnalysisText = parsed.value.correctAnalysis
      saved.model = model.slice(0, 64)
      saved.errorCode = null
      saved.errorMessage = null
      await this.gradingRepo.save(saved)
      return this.toGradingView(saved)
    } catch (e) {
      if (saved.status === 'succeeded') throw e
      if (saved.status === 'failed' && e instanceof BadRequestException) throw e
      const code =
        e instanceof ServiceUnavailableException
          ? 'model_unavailable'
          : e instanceof BadRequestException
            ? 'model_bad_request'
            : 'model_error'
      const msg = toSafeErrorMessage(
        (e as Error)?.message,
        '作答批改失败，请稍后重试',
      )
      saved.status = 'failed'
      saved.errorCode = code
      saved.errorMessage = msg
      await this.gradingRepo.save(saved)
      if (
        e instanceof BadRequestException ||
        e instanceof ServiceUnavailableException ||
        e instanceof ForbiddenException ||
        e instanceof NotFoundException
      ) {
        throw e
      }
      throw new ServiceUnavailableException(msg)
    }
  }
}
