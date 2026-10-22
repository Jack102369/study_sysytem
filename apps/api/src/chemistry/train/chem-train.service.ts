import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { ChemCategory } from '../chem-category.entity'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemWrongQuestionService } from './chem-wrong-question.service'
import { gradeAnswer } from './chem-train-grade'
import {
  CreateTrainSessionDto,
  ListTrainSessionsQueryDto,
  SaveTrainAnswerDto,
  TrainAvailabilityQueryDto,
} from './dto/train.dto'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './entities/chem-train-session-item.entity'
import { CHEM_TRAIN_TEST_SEEDS } from './chem-train.seed'
import { DIFFICULTY_LABELS } from './train.constants'

@Injectable()
export class ChemTrainService implements OnModuleInit {
  private readonly logger = new Logger(ChemTrainService.name)

  constructor(
    @InjectRepository(ChemTrainItem)
    private readonly itemsRepo: Repository<ChemTrainItem>,
    @InjectRepository(ChemTrainSession)
    private readonly sessionsRepo: Repository<ChemTrainSession>,
    @InjectRepository(ChemTrainSessionItem)
    private readonly sessionItemsRepo: Repository<ChemTrainSessionItem>,
    @InjectRepository(ChemSpecialty)
    private readonly specialtiesRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly categoriesRepo: Repository<ChemCategory>,
    private readonly eligibility: ChemTrainEligibilityService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => ChemWrongQuestionService))
    private readonly wrongQuestions: ChemWrongQuestionService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureTestSeeds()
    } catch (e) {
      this.logger.warn(
        `训练测试题种子未写入：${e instanceof Error ? e.message : String(e)}`,
      )
    }
  }

  async ensureTestSeeds() {
    for (const seed of CHEM_TRAIN_TEST_SEEDS) {
      const existing = await this.itemsRepo.findOne({ where: { code: seed.code } })
      if (existing) continue
      const sp = await this.specialtiesRepo.findOne({
        where: { code: seed.specialtyCode, isActive: true },
      })
      if (!sp) continue
      const cat = await this.categoriesRepo.findOne({
        where: { specialtyId: sp.id, code: seed.categoryCode, isActive: true },
      })
      if (!cat) continue
      await this.itemsRepo.save(
        this.itemsRepo.create({
          code: seed.code,
          pool: 'test',
          qtype: seed.qtype,
          answerType: seed.answerType || 'text',
          stem: seed.stem,
          optionsJson: seed.optionsJson ?? null,
          answer: seed.answer,
          answerAliasesJson: seed.answerAliases ?? null,
          analysis: seed.analysis ?? null,
          difficulty: seed.difficulty,
          specialtyId: sp.id,
          categoryId: cat.id,
          status: 'approved',
          isActive: true,
          curriculumOk: true,
          verifyBlocked: false,
          banDefaultTrain: false,
          gateNote: 'phase1 test seed; not formal',
        }),
      )
    }
  }

  async testAccess(userId: string) {
    const allowed = await this.eligibility.canUseTestPool(userId)
    return { canUseTestPool: allowed }
  }

  async availability(userId: string, query: TrainAvailabilityQueryDto) {
    const poolMode = query.poolMode || 'formal'
    if (poolMode === 'test') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) {
        throw new ForbiddenException('无权使用测试题库')
      }
    }
    const { specialty, category } = await this.resolveSpecCat(
      query.specialtyCode,
      query.categoryCode,
    )
    let eligible = await this.findEligibleItems(
      specialty.id,
      category.id,
      query.difficulty,
      poolMode,
    )
    return {
      specialtyCode: specialty.code,
      specialtyName: specialty.name,
      categoryCode: category.code,
      categoryName: category.name,
      difficulty: query.difficulty,
      difficultyLabel: DIFFICULTY_LABELS[query.difficulty],
      poolMode,
      availableCount: eligible.length,
      emptyMessage:
        eligible.length === 0
          ? poolMode === 'formal'
            ? '该专项暂无已审核的训练题目。'
            : '该二级分类下暂无适用的 AI 试运行题目（已停用/禁止试运行题不计入）。请更换分类或难度，不会用其他分类题目凑数。'
          : null,
    }
  }

  async createSession(userId: string, dto: CreateTrainSessionDto) {
    const poolMode = dto.poolMode || 'formal'
    if (poolMode === 'test') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) throw new ForbiddenException('无权使用测试题库')
    }

    const { specialty, category } = await this.resolveSpecCat(
      dto.specialtyCode,
      dto.categoryCode,
    )

    let eligible = await this.findEligibleItems(
      specialty.id,
      category.id,
      dto.difficulty,
      poolMode,
    )
    if (!eligible.length) {
      throw new BadRequestException(
        poolMode === 'formal'
          ? '该专项暂无已审核的训练题目。'
          : '该分类下暂无可用测试题。可先试「方程式正误判断」或「符号记忆」等已有试运行题的分类。',
      )
    }

    if (dto.mode === 'random') {
      eligible = this.shuffle(eligible)
    }
    const picked = eligible.slice(0, dto.count)
    if (!picked.length) {
      throw new BadRequestException('该专项暂无已审核的训练题目。')
    }

    const now = new Date()
    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        sessionKind: 'specialty',
        dailyDate: null,
        specialtyId: specialty.id,
        categoryId: category.id,
        poolMode,
        difficulty: dto.difficulty,
        plannedCount: dto.count,
        actualCount: picked.length,
        mode: dto.mode,
        status: 'in_progress',
        answeredCount: 0,
        correctCount: 0,
        wrongCount: 0,
        pendingCount: 0,
        durationMs: 0,
        startedAt: now,
        submittedAt: null,
        countsFormalStats: poolMode === 'formal',
      }),
    )

    const rows = picked.map((item, i) =>
      this.sessionItemsRepo.create({
        sessionId: session.id,
        sortOrder: i + 1,
        itemId: item.id,
        itemCode: item.code,
        qtype: item.qtype,
        answerType: item.answerType || 'text',
        stem: item.stem,
        optionsJson: item.optionsJson,
        answer: item.answer,
        answerAliasesJson: item.answerAliasesJson,
        analysis: item.analysis,
        userAnswer: null,
        gradeResult: null,
        gradeReason: null,
        answeredAt: null,
      }),
    )
    await this.sessionItemsRepo.save(rows)

    return this.getSessionForUser(userId, session.id, { includeAnswers: false })
  }

  async listSessions(userId: string, query: ListTrainSessionsQueryDto) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 20))
    const filter = query.poolFilter || 'formal'

    if (filter === 'test' || filter === 'all') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok && filter === 'test') {
        throw new ForbiddenException('无权查看测试训练记录')
      }
      // all：无测试权限时仍只返回 formal
    }

    const kindFilter = query.kindFilter || 'specialty'
    const qb = this.sessionsRepo
      .createQueryBuilder('s')
      .where('s.user_id = :userId', { userId })
      .orderBy('s.started_at', 'DESC')

    if (kindFilter === 'specialty') {
      qb.andWhere(
        "(s.session_kind = 'specialty' OR s.session_kind IS NULL OR s.session_kind = '')",
      )
    } else if (kindFilter === 'advanced') {
      qb.andWhere("s.session_kind = 'advanced'")
    } else if (kindFilter === 'daily') {
      qb.andWhere("s.session_kind = 'daily'")
    } else if (kindFilter === 'wrong_review') {
      qb.andWhere("s.session_kind = 'wrong_review'")
    } else if (kindFilter === 'wrong_variation') {
      qb.andWhere("s.session_kind = 'wrong_variation'")
    } else if (kindFilter === 'all') {
      // 全部类型；仍排除误把 daily 混入默认列表的需求由前端显式选 all
    } else {
      qb.andWhere(
        "(s.session_kind = 'specialty' OR s.session_kind IS NULL OR s.session_kind = '')",
      )
    }

    if (filter === 'formal') {
      qb.andWhere('s.pool_mode = :pm', { pm: 'formal' })
    } else if (filter === 'test') {
      qb.andWhere('s.pool_mode = :pm', { pm: 'test' })
    } else {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) qb.andWhere('s.pool_mode = :pm', { pm: 'formal' })
    }

    const total = await qb.getCount()
    const rows = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany()

    const items = await Promise.all(rows.map((s) => this.toSessionSummary(s)))
    return { total, page, pageSize, items }
  }

  async getSession(userId: string, sessionId: string) {
    return this.getSessionForUser(userId, sessionId, {
      includeAnswers: false,
      includeResultsIfCompleted: true,
    })
  }

  async saveAnswer(userId: string, sessionId: string, dto: SaveTrainAnswerDto) {
    const session = await this.requireOwnSession(userId, sessionId)
    if (session.status !== 'in_progress') {
      throw new BadRequestException('任务已结束，无法继续作答')
    }
    const item = await this.sessionItemsRepo.findOne({
      where: { sessionId, sortOrder: dto.sortOrder },
    })
    if (!item) throw new NotFoundException('题目不存在')

    item.userAnswer = String(dto.answer ?? '').trim()
    item.answeredAt = new Date()
    // 作答阶段不写入 grade_result，提交时统一判题
    item.gradeResult = null
    await this.sessionItemsRepo.save(item)

    const answered = await this.sessionItemsRepo
      .createQueryBuilder('i')
      .where('i.session_id = :sid', { sid: sessionId })
      .andWhere('i.user_answer IS NOT NULL')
      .andWhere("i.user_answer <> ''")
      .getCount()
    session.answeredCount = answered
    await this.sessionsRepo.save(session)

    return this.getSessionForUser(userId, sessionId, { includeAnswers: false })
  }

  async submit(userId: string, sessionId: string) {
    const session = await this.requireOwnSession(userId, sessionId)

    // 幂等：已完成直接返回结果
    if (session.status === 'completed') {
      return this.getSessionForUser(userId, sessionId, {
        includeAnswers: true,
        includeResultsIfCompleted: true,
      })
    }
    if (session.status === 'cancelled') {
      throw new BadRequestException('任务已取消')
    }

    const items = await this.sessionItemsRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
    })
    const unanswered = items.filter((i) => !String(i.userAnswer || '').trim())
    // 允许提交未答题：未答记为 pending_review

    let correct = 0
    let wrong = 0
    let pending = 0
    for (const item of items) {
      const graded = gradeAnswer({
        qtype: item.qtype,
        standardAnswer: item.answer,
        aliasesJson: item.answerAliasesJson,
        userAnswer: item.userAnswer,
        answerType: item.answerType || 'text',
      })
      item.gradeResult = graded.result
      item.gradeReason = graded.reason ?? null
      if (!item.answeredAt && item.userAnswer) item.answeredAt = new Date()
      if (graded.result === 'correct') correct++
      else if (graded.result === 'wrong') wrong++
      else pending++
    }
    await this.sessionItemsRepo.save(items)

    const now = new Date()
    session.status = 'completed'
    session.submittedAt = now
    session.correctCount = correct
    session.wrongCount = wrong
    session.pendingCount = pending
    session.answeredCount = items.filter((i) => String(i.userAnswer || '').trim()).length
    session.durationMs = Math.max(0, now.getTime() - new Date(session.startedAt).getTime())
    await this.sessionsRepo.save(session)

    // 错题索引：失败不回滚训练结果；可 rebuild 补偿
    await this.wrongQuestions.onSessionSubmittedSafe(userId, sessionId)

    return {
      ...(await this.getSessionForUser(userId, sessionId, {
        includeAnswers: true,
        includeResultsIfCompleted: true,
      })),
      submitMeta: {
        unansweredBeforeSubmit: unanswered.length,
        idempotent: false,
        countsFormalStats: session.countsFormalStats,
        note: session.countsFormalStats
          ? '正式训练结果（本阶段未接入积分）'
          : '测试训练不计入正式学习统计与积分',
      },
    }
  }

  async cancel(userId: string, sessionId: string) {
    const session = await this.requireOwnSession(userId, sessionId)
    if (session.status === 'completed') {
      throw new BadRequestException('已完成任务不可取消')
    }
    if (session.status === 'cancelled') {
      return this.getSessionForUser(userId, sessionId, { includeAnswers: false })
    }
    session.status = 'cancelled'
    await this.sessionsRepo.save(session)
    return this.getSessionForUser(userId, sessionId, { includeAnswers: false })
  }

  // —— helpers ——

  private async resolveSpecCat(specialtyCode: string, categoryCode: string) {
    const specialty = await this.specialtiesRepo.findOne({
      where: { code: specialtyCode, isActive: true },
    })
    if (!specialty) throw new NotFoundException('专项不存在')
    const category = await this.categoriesRepo.findOne({
      where: {
        specialtyId: specialty.id,
        code: categoryCode,
        isActive: true,
      },
    })
    if (!category) throw new NotFoundException('二级分类不存在')
    return { specialty, category }
  }

  private async requireOwnSession(userId: string, sessionId: string) {
    const session = await this.sessionsRepo.findOne({ where: { id: sessionId } })
    if (!session || session.userId !== userId) {
      throw new NotFoundException('训练任务不存在')
    }
    if (session.poolMode === 'test') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) throw new ForbiddenException('无权访问测试训练')
    }
    return session
  }

  private async getSessionForUser(
    userId: string,
    sessionId: string,
    opts: { includeAnswers: boolean; includeResultsIfCompleted?: boolean },
  ) {
    const session = await this.requireOwnSession(userId, sessionId)
    const isDaily = session.sessionKind === 'daily'
    const isAdvanced = session.sessionKind === 'advanced'
    const isWrongReview = session.sessionKind === 'wrong_review'
    const isWrongVariation = session.sessionKind === 'wrong_variation'
    const specialty = session.specialtyId
      ? await this.specialtiesRepo.findOne({ where: { id: session.specialtyId } })
      : null
    const category = session.categoryId
      ? await this.categoriesRepo.findOne({ where: { id: session.categoryId } })
      : null
    const items = await this.sessionItemsRepo.find({
      where: { sessionId },
      order: { sortOrder: 'ASC' },
    })

    // 跨专项会话：按 item 关联真实专项/分类（不造虚拟分类）
    const itemMeta = new Map<
      string,
      { specialtyName: string; categoryName: string; specialtyCode: string; categoryCode: string; difficulty: number }
    >()
    if ((isAdvanced || isWrongReview || isWrongVariation) && items.length) {
      const ids = items.map((i) => i.itemId).filter(Boolean) as string[]
      if (ids.length) {
        const rows: Array<{
          id: string
          difficulty: number
          sp_code: string
          sp_name: string
          cat_code: string
          cat_name: string
        }> = await this.dataSource.query(
          `SELECT i.id, i.difficulty, s.code AS sp_code, s.name AS sp_name,
                  c.code AS cat_code, c.name AS cat_name
           FROM chem_train_items i
           JOIN chem_specialties s ON s.id = i.specialty_id
           JOIN chem_categories c ON c.id = i.category_id
           WHERE i.id IN (${ids.map(() => '?').join(',')})`,
          ids,
        )
        for (const r of rows) {
          itemMeta.set(String(r.id), {
            specialtyCode: r.sp_code,
            specialtyName: r.sp_name,
            categoryCode: r.cat_code,
            categoryName: r.cat_name,
            difficulty: Number(r.difficulty),
          })
        }
      }
    }

    const showKey =
      opts.includeAnswers ||
      (opts.includeResultsIfCompleted && session.status === 'completed')

    const graded = session.status === 'completed'
    const scored = session.correctCount + session.wrongCount
    const accuracy =
      scored > 0 ? Math.round((session.correctCount / scored) * 1000) / 10 : null

    return {
      id: session.id,
      status: session.status,
      sessionKind: session.sessionKind || 'specialty',
      dailyDate: session.dailyDate,
      poolMode: session.poolMode,
      countsFormalStats: session.countsFormalStats,
      specialtyCode: isDaily
        ? 'daily_review'
        : isWrongReview
          ? 'wrong_review'
          : isWrongVariation
            ? 'wrong_variation'
            : isAdvanced
              ? specialty?.code || 'advanced'
              : specialty?.code,
      specialtyName: isDaily
        ? '每日10分钟'
        : isWrongReview
          ? '错题复练'
          : isWrongVariation
            ? '变式训练'
            : isAdvanced
              ? specialty?.name || '提高与挑战'
              : specialty?.name,
      categoryCode: isDaily
        ? 'basic'
        : isWrongReview
          ? 'review'
          : isWrongVariation
            ? 'variation'
            : isAdvanced
              ? category?.code || 'mixed'
              : category?.code,
      categoryName: isDaily
        ? '基础巩固'
        : isWrongReview
          ? '原题巩固'
          : isWrongVariation
            ? '同知识变式'
            : isAdvanced
              ? category?.name || '跨专项'
              : category?.name,
      difficulty: session.difficulty,
      difficultyLabel: isDaily
        ? '基础巩固'
        : isWrongReview
          ? '错题复练'
          : isWrongVariation
            ? '变式训练'
            : DIFFICULTY_LABELS[session.difficulty] || String(session.difficulty),
      sourceWrongItemId: session.sourceWrongItemId || null,
      mode: session.mode,
      plannedCount: session.plannedCount,
      actualCount: session.actualCount,
      answeredCount: session.answeredCount,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      pendingCount: session.pendingCount,
      accuracyPercent: graded ? accuracy : null,
      accuracyNote: graded
        ? '正确率按「正确/(正确+错误)」计算，排除待复核题'
        : null,
      durationMs: session.durationMs,
      durationNote: '用时为开始训练到提交的经过时间，非专注时长统计。',
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      items: items.map((it) => {
        const meta = it.itemId ? itemMeta.get(String(it.itemId)) : undefined
        const base: Record<string, unknown> = {
          id: it.id,
          sortOrder: it.sortOrder,
          qtype: it.qtype,
          answerType: it.answerType || 'text',
          stem: it.stem,
          options: it.optionsJson,
          userAnswer: it.userAnswer,
          answered: !!String(it.userAnswer || '').trim(),
          specialtyCode: meta?.specialtyCode,
          specialtyName: meta?.specialtyName,
          categoryCode: meta?.categoryCode,
          categoryName: meta?.categoryName,
          itemDifficulty: meta?.difficulty,
        }
        if (showKey) {
          base.gradeResult = it.gradeResult
          base.gradeReason = it.gradeReason
          base.standardAnswer = it.answer
          base.answerAliases = it.answerAliasesJson
          base.analysis = it.analysis
        }
        return base
      }),
    }
  }

  private async toSessionSummary(session: ChemTrainSession) {
    const isDaily = session.sessionKind === 'daily'
    const isAdvanced = session.sessionKind === 'advanced'
    const isWrongReview = session.sessionKind === 'wrong_review'
    const isWrongVariation = session.sessionKind === 'wrong_variation'
    const specialty = session.specialtyId
      ? await this.specialtiesRepo.findOne({ where: { id: session.specialtyId } })
      : null
    const category = session.categoryId
      ? await this.categoriesRepo.findOne({ where: { id: session.categoryId } })
      : null
    const scored = session.correctCount + session.wrongCount
    const accuracy =
      session.status === 'completed' && scored > 0
        ? Math.round((session.correctCount / scored) * 1000) / 10
        : null
    return {
      id: session.id,
      status: session.status,
      sessionKind: session.sessionKind || 'specialty',
      dailyDate: session.dailyDate,
      poolMode: session.poolMode,
      countsFormalStats: session.countsFormalStats,
      sourceWrongItemId: session.sourceWrongItemId || null,
      specialtyCode: isDaily
        ? 'daily_review'
        : isWrongReview
          ? 'wrong_review'
          : isWrongVariation
            ? 'wrong_variation'
            : isAdvanced
              ? specialty?.code || 'advanced'
              : specialty?.code,
      specialtyName: isDaily
        ? '每日10分钟'
        : isWrongReview
          ? '错题复练'
          : isWrongVariation
            ? '变式训练'
            : isAdvanced
              ? specialty?.name || '提高与挑战'
              : specialty?.name,
      categoryCode: isDaily
        ? 'basic'
        : isWrongReview
          ? 'review'
          : isWrongVariation
            ? 'variation'
            : isAdvanced
              ? category?.code || 'mixed'
              : category?.code,
      categoryName: isDaily
        ? '基础巩固'
        : isWrongReview
          ? '原题巩固'
          : isWrongVariation
            ? '同知识变式'
            : isAdvanced
              ? category?.name || '跨专项'
              : category?.name,
      difficulty: session.difficulty,
      difficultyLabel: isDaily
        ? '基础巩固'
        : isWrongReview
          ? '错题复练'
          : isWrongVariation
            ? '变式训练'
            : DIFFICULTY_LABELS[session.difficulty] || String(session.difficulty),
      plannedCount: session.plannedCount,
      actualCount: session.actualCount,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      pendingCount: session.pendingCount,
      accuracyPercent: accuracy,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      durationMs: session.durationMs,
      durationNote: '用时为开始训练到提交的经过时间，非专注时长统计。',
    }
  }

  /**
   * 抽题：专项+分类+难度精确匹配（正式池与测试池相同）。
   * 所选难度无题时返回空，禁止回退到其他难度凑数。
   * 已停用 / trial_access:block 的题不进入候选。
   */
  private async findEligibleItems(
    specialtyId: string,
    categoryId: string,
    difficulty: number,
    poolMode: 'formal' | 'test',
  ) {
    const exact = await this.itemsRepo.find({
      where: {
        specialtyId,
        categoryId,
        difficulty,
        pool: poolMode,
        status: 'approved',
        isActive: true,
      },
      order: { id: 'ASC' },
    })
    return this.eligibility.filterEligibleItems(exact, poolMode)
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}


