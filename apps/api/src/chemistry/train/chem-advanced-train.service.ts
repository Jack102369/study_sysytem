import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChemCategory } from '../chem-category.entity'
import { ChemSpecialty } from '../chem-specialty.entity'
import { ChemTrainEligibilityService } from './chem-train-eligibility.service'
import { ChemTrainService } from './chem-train.service'
import {
  AdvancedAvailabilityQueryDto,
  AdvancedDifficultyMode,
  AdvancedItemScope,
  CreateAdvancedTrainSessionDto,
} from './dto/advanced-train.dto'
import { ChemTrainItem } from './entities/chem-train-item.entity'
import { ChemTrainSession } from './entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './entities/chem-train-session-item.entity'
import { DIFFICULTY_LABELS } from './train.constants'

const MIX_RAISE_RATIO = 0.7

function isS60Item(item: ChemTrainItem): boolean {
  const note = String(item.gateNote || '')
  const code = String(item.code || '')
  return /\[s60\]/i.test(note) || /^train\.ai_trial\.s60\./i.test(code)
}

@Injectable()
export class ChemAdvancedTrainService {
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
    private readonly trainService: ChemTrainService,
  ) {}

  async availability(userId: string, query: AdvancedAvailabilityQueryDto) {
    const poolMode = query.poolMode || 'formal'
    await this.assertPoolAccess(userId, poolMode)
    const scope = query.itemScope || 'all'
    const resolved = await this.resolveScope(query.specialtyCode, query.categoryCode)

    const raise = await this.loadEligible({
      poolMode,
      itemScope: scope,
      specialtyId: resolved.specialtyId,
      categoryId: resolved.categoryId,
      difficulties: [2],
    })
    const challenge = await this.loadEligible({
      poolMode,
      itemScope: scope,
      specialtyId: resolved.specialtyId,
      categoryId: resolved.categoryId,
      difficulties: [3],
    })
    const mixCount = raise.length + challenge.length
    const availableCount = this.countForMode(query.difficultyMode, raise.length, challenge.length)

    return {
      sessionKind: 'advanced' as const,
      specialtyCode: resolved.specialtyCode,
      specialtyName: resolved.specialtyName,
      categoryCode: resolved.categoryCode,
      categoryName: resolved.categoryName,
      difficultyMode: query.difficultyMode,
      difficultyLabel: this.modeLabel(query.difficultyMode),
      itemScope: scope,
      poolMode,
      raiseCount: raise.length,
      challengeCount: challenge.length,
      mixCount,
      availableCount,
      plannedHint: '可用题量与计划训练题量分开；无对应难度时显示 0，不会回退到基础题。',
      emptyMessage:
        availableCount === 0
          ? poolMode === 'formal'
            ? '当前筛选条件下暂无已审核的提高/挑战题目。'
            : '当前筛选条件下暂无可用的提高/挑战试运行题（不会用基础题凑数）。'
          : null,
    }
  }

  async createSession(userId: string, dto: CreateAdvancedTrainSessionDto) {
    const poolMode = dto.poolMode || 'formal'
    await this.assertPoolAccess(userId, poolMode)
    const scope = dto.itemScope || 'all'
    const resolved = await this.resolveScope(dto.specialtyCode, dto.categoryCode)

    const raisePool = await this.loadEligible({
      poolMode,
      itemScope: scope,
      specialtyId: resolved.specialtyId,
      categoryId: resolved.categoryId,
      difficulties: [2],
    })
    const challengePool = await this.loadEligible({
      poolMode,
      itemScope: scope,
      specialtyId: resolved.specialtyId,
      categoryId: resolved.categoryId,
      difficulties: [3],
    })

    const availableCount = this.countForMode(
      dto.difficultyMode,
      raisePool.length,
      challengePool.length,
    )
    if (availableCount <= 0) {
      throw new BadRequestException(
        poolMode === 'formal'
          ? '当前筛选条件下暂无已审核的提高/挑战题目。'
          : '当前筛选条件下暂无可用的提高/挑战试运行题。',
      )
    }

    const picked = this.pickItems({
      mode: dto.mode,
      difficultyMode: dto.difficultyMode,
      count: dto.count,
      raisePool,
      challengePool,
      allSpecialties: !resolved.specialtyId,
    })
    if (!picked.length) {
      throw new BadRequestException('暂无可用题目，无法开始提高与挑战训练')
    }

    // 硬校验：绝不为凑题抽 difficulty=1
    if (picked.some((p) => p.difficulty === 1)) {
      throw new BadRequestException('组卷异常：禁止抽取基础题')
    }
    if (dto.difficultyMode === 'raise' && picked.some((p) => p.difficulty !== 2)) {
      throw new BadRequestException('组卷异常：提高模式仅允许 difficulty=2')
    }
    if (dto.difficultyMode === 'challenge' && picked.some((p) => p.difficulty !== 3)) {
      throw new BadRequestException('组卷异常：挑战模式仅允许 difficulty=3')
    }
    if (
      dto.difficultyMode === 'mix' &&
      picked.some((p) => p.difficulty !== 2 && p.difficulty !== 3)
    ) {
      throw new BadRequestException('组卷异常：混合模式仅允许 difficulty=2/3')
    }

    const now = new Date()
    const sessionDifficulty =
      dto.difficultyMode === 'raise' ? 2 : dto.difficultyMode === 'challenge' ? 3 : 0

    const session = await this.sessionsRepo.save(
      this.sessionsRepo.create({
        userId,
        sessionKind: 'advanced',
        dailyDate: null,
        specialtyId: resolved.specialtyId,
        categoryId: resolved.categoryId,
        poolMode,
        difficulty: sessionDifficulty,
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

    const detail = await this.trainService.getSession(userId, session.id)
    return {
      ...detail,
      pickMeta: {
        planned: dto.count,
        actual: picked.length,
        shortfall:
          picked.length < dto.count
            ? `可用题不足，本次实际 ${picked.length} 道（计划 ${dto.count}）`
            : null,
        difficultyMix: {
          basic: 0,
          raise: picked.filter((x) => x.difficulty === 2).length,
          challenge: picked.filter((x) => x.difficulty === 3).length,
        },
        difficultyMode: dto.difficultyMode,
        itemScope: scope,
      },
    }
  }

  private countForMode(
    mode: AdvancedDifficultyMode,
    raise: number,
    challenge: number,
  ) {
    if (mode === 'raise') return raise
    if (mode === 'challenge') return challenge
    return raise + challenge
  }

  private modeLabel(mode: AdvancedDifficultyMode) {
    if (mode === 'raise') return DIFFICULTY_LABELS[2]
    if (mode === 'challenge') return DIFFICULTY_LABELS[3]
    return DIFFICULTY_LABELS[0]
  }

  private async assertPoolAccess(userId: string, poolMode: 'formal' | 'test') {
    if (poolMode === 'test') {
      const ok = await this.eligibility.canUseTestPool(userId)
      if (!ok) throw new ForbiddenException('无权使用测试题库')
    }
  }

  private async resolveScope(specialtyCode?: string, categoryCode?: string) {
    const code = String(specialtyCode || '').trim()
    const allSpec = !code || code === 'all'

    if (allSpec) {
      if (categoryCode && String(categoryCode).trim()) {
        throw new BadRequestException('选择全部专项时不能再指定二级分类')
      }
      return {
        specialtyId: null as string | null,
        categoryId: null as string | null,
        specialtyCode: 'all',
        specialtyName: '全部专项',
        categoryCode: 'all',
        categoryName: '跨专项',
      }
    }

    const specialty = await this.specialtiesRepo.findOne({
      where: { code, isActive: true },
    })
    if (!specialty) throw new NotFoundException('专项不存在')

    const catCode = String(categoryCode || '').trim()
    if (!catCode || catCode === 'all') {
      return {
        specialtyId: specialty.id,
        categoryId: null as string | null,
        specialtyCode: specialty.code,
        specialtyName: specialty.name,
        categoryCode: 'all',
        categoryName: '全部二级分类',
      }
    }

    const category = await this.categoriesRepo.findOne({
      where: {
        specialtyId: specialty.id,
        code: catCode,
        isActive: true,
      },
    })
    if (!category) throw new NotFoundException('二级分类不存在')

    return {
      specialtyId: specialty.id,
      categoryId: category.id,
      specialtyCode: specialty.code,
      specialtyName: specialty.name,
      categoryCode: category.code,
      categoryName: category.name,
    }
  }

  private async loadEligible(opts: {
    poolMode: 'formal' | 'test'
    itemScope: AdvancedItemScope
    specialtyId: string | null
    categoryId: string | null
    difficulties: number[]
  }) {
    const qb = this.itemsRepo
      .createQueryBuilder('i')
      .where('i.pool = :pool', { pool: opts.poolMode })
      .andWhere('i.status = :st', { st: 'approved' })
      .andWhere('i.is_active = 1')
      .andWhere('i.difficulty IN (:...diffs)', { diffs: opts.difficulties })
      .orderBy('i.id', 'ASC')

    if (opts.specialtyId) {
      qb.andWhere('i.specialty_id = :sid', { sid: opts.specialtyId })
    }
    if (opts.categoryId) {
      qb.andWhere('i.category_id = :cid', { cid: opts.categoryId })
    }

    const rows = await qb.getMany()
    let eligible = await this.eligibility.filterEligibleItems(rows, opts.poolMode)
    // 硬规则：提高与挑战绝不包含基础题
    eligible = eligible.filter((i) => i.difficulty === 2 || i.difficulty === 3)
    eligible = eligible.filter((i) => opts.difficulties.includes(i.difficulty))
    if (opts.itemScope === 's60') {
      eligible = eligible.filter(isS60Item)
    }
    return eligible
  }

  private pickItems(opts: {
    mode: 'sequential' | 'random'
    difficultyMode: AdvancedDifficultyMode
    count: number
    raisePool: ChemTrainItem[]
    challengePool: ChemTrainItem[]
    allSpecialties: boolean
  }): ChemTrainItem[] {
    const { difficultyMode, count, mode, allSpecialties } = opts
    let raise = [...opts.raisePool]
    let challenge = [...opts.challengePool]

    if (mode === 'sequential') {
      raise = this.sortStable(raise)
      challenge = this.sortStable(challenge)
    } else {
      raise = this.shuffle(raise)
      challenge = this.shuffle(challenge)
    }

    let picked: ChemTrainItem[] = []

    if (difficultyMode === 'raise') {
      picked = this.takeBalanced(raise, count, allSpecialties, mode)
    } else if (difficultyMode === 'challenge') {
      picked = this.takeBalanced(challenge, count, allSpecialties, mode)
    } else {
      const targetRaise = Math.round(count * MIX_RAISE_RATIO)
      const targetChallenge = count - targetRaise
      const fromRaise = this.takeBalanced(raise, targetRaise, allSpecialties, mode)
      const raiseIds = new Set(fromRaise.map((x) => String(x.id)))
      const challengeLeft = challenge.filter((c) => !raiseIds.has(String(c.id)))
      let fromChallenge = this.takeBalanced(
        challengeLeft,
        targetChallenge,
        allSpecialties,
        mode,
      )

      // 题量不足时在提高/挑战之间调整比例，绝不抽基础题
      let need = count - fromRaise.length - fromChallenge.length
      if (need > 0) {
        const raiseRest = raise.filter(
          (r) =>
            !fromRaise.some((x) => String(x.id) === String(r.id)) &&
            !fromChallenge.some((x) => String(x.id) === String(r.id)),
        )
        const extraRaise = this.takeBalanced(raiseRest, need, allSpecialties, mode)
        fromRaise.push(...extraRaise)
        need = count - fromRaise.length - fromChallenge.length
      }
      if (need > 0) {
        const chalRest = challenge.filter(
          (c) =>
            !fromRaise.some((x) => String(x.id) === String(c.id)) &&
            !fromChallenge.some((x) => String(x.id) === String(c.id)),
        )
        const extraChal = this.takeBalanced(chalRest, need, allSpecialties, mode)
        fromChallenge = fromChallenge.concat(extraChal)
      }

      picked = [...fromRaise, ...fromChallenge]
      if (mode === 'random') {
        picked = this.shuffle(picked)
      } else {
        picked = this.sortStable(picked)
      }
      picked = picked.slice(0, count)
    }

    return picked
  }

  /**
   * 软均衡：优先覆盖不同一级专项，其次二级分类。
   * 不使用停用/无权限/不合格题（候选池已准入过滤）。
   */
  private takeBalanced(
    pool: ChemTrainItem[],
    n: number,
    allSpecialties: boolean,
    mode: 'sequential' | 'random',
  ): ChemTrainItem[] {
    if (n <= 0 || !pool.length) return []
    if (!allSpecialties || pool.length <= n) {
      const base = mode === 'sequential' ? this.sortStable(pool) : [...pool]
      return base.slice(0, n)
    }

    const bySpec = new Map<string, ChemTrainItem[]>()
    for (const item of pool) {
      const key = String(item.specialtyId)
      if (!bySpec.has(key)) bySpec.set(key, [])
      bySpec.get(key)!.push(item)
    }
    for (const [, list] of bySpec) {
      if (mode === 'sequential') {
        list.sort((a, b) => {
          const c = String(a.categoryId).localeCompare(String(b.categoryId))
          if (c !== 0) return c
          return String(a.id).localeCompare(String(b.id))
        })
      }
    }

    const picked: ChemTrainItem[] = []
    const pickedIds = new Set<string>()
    const specUsed = new Map<string, number>()
    const catUsed = new Map<string, number>()
    const queues = [...bySpec.entries()].map(([sid, items]) => ({
      sid,
      items: [...items],
      idx: 0,
    }))

    // round-robin 跨专项，同专项内优先少用二级分类
    while (picked.length < n) {
      queues.sort((a, b) => {
        const ua = specUsed.get(a.sid) || 0
        const ub = specUsed.get(b.sid) || 0
        if (ua !== ub) return ua - ub
        return a.sid.localeCompare(b.sid)
      })
      let progressed = false
      for (const q of queues) {
        if (picked.length >= n) break
        // 在该专项队列中找下一个未选、且二级分类使用较少的题
        let bestIdx = -1
        let bestCatUse = Number.POSITIVE_INFINITY
        for (let i = q.idx; i < q.items.length; i++) {
          const it = q.items[i]
          if (pickedIds.has(String(it.id))) continue
          const cu = catUsed.get(String(it.categoryId)) || 0
          if (cu < bestCatUse) {
            bestCatUse = cu
            bestIdx = i
            if (cu === 0) break
          }
        }
        if (bestIdx < 0) continue
        const item = q.items[bestIdx]
        // 将已跳过位置推进
        q.idx = Math.min(bestIdx + 1, q.items.length)
        picked.push(item)
        pickedIds.add(String(item.id))
        specUsed.set(q.sid, (specUsed.get(q.sid) || 0) + 1)
        catUsed.set(
          String(item.categoryId),
          (catUsed.get(String(item.categoryId)) || 0) + 1,
        )
        progressed = true
        if (mode === 'random' && picked.length < n) {
          // 随机模式下每轮只取一题后重新排序，增强随机性
          break
        }
      }
      if (!progressed) break
    }

    return picked
  }

  private sortStable(items: ChemTrainItem[]) {
    return [...items].sort((a, b) => {
      const s = String(a.specialtyId).localeCompare(String(b.specialtyId))
      if (s !== 0) return s
      const c = String(a.categoryId).localeCompare(String(b.categoryId))
      if (c !== 0) return c
      return String(a.id).localeCompare(String(b.id))
    })
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
