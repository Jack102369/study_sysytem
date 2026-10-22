import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { PointsService } from '../points/points.service'
import { SubjectsService } from '../subjects/subjects.service'
import { Tag } from '../tags/tag.entity'
import { AssessmentSubjectScore } from './assessment-subject-score.entity'
import { Assessment } from './assessment.entity'
import {
  CreateAssessmentDto,
  ListAssessmentsQueryDto,
  ScoreItemDto,
  TrendsQueryDto,
  UpdateAssessmentDto,
} from './dto/assessment.dto'

function formatDateYmd(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(value)
  const matched = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (matched) return `${matched[1]}-${matched[2]}-${matched[3]}`
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return s.slice(0, 10)
}

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(AssessmentSubjectScore)
    private readonly scoreRepo: Repository<AssessmentSubjectScore>,
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
    private readonly subjectsService: SubjectsService,
    private readonly dataSource: DataSource,
    private readonly points: PointsService,
  ) {}

  async list(userId: string, query: ListAssessmentsQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const idQb = this.assessmentRepo
      .createQueryBuilder('a')
      .select('a.id', 'id')
      .where('a.user_id = :userId', { userId })

    if (query.typeId) idQb.andWhere('a.type_id = :typeId', { typeId: query.typeId })
    if (query.dateFrom) idQb.andWhere('a.held_at >= :dateFrom', { dateFrom: query.dateFrom })
    if (query.dateTo) idQb.andWhere('a.held_at <= :dateTo', { dateTo: query.dateTo })

    const total = await idQb.clone().getCount()
    const idRows = await idQb
      .orderBy('a.held_at', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<{ id: string }>()

    const ids = idRows.map((r) => String(r.id))
    if (!ids.length) {
      return { items: [], total, page, pageSize }
    }

    const rows = await this.assessmentRepo.find({
      where: { userId, id: In(ids) },
      relations: ['scores', 'tags'],
    })
    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    rows.sort(
      (a, b) => (orderMap.get(String(a.id)) ?? 0) - (orderMap.get(String(b.id)) ?? 0),
    )

    return {
      items: rows.map((r) => this.toView(r)),
      total,
      page,
      pageSize,
    }
  }

  async detail(userId: string, id: string) {
    const row = await this.assessmentRepo.findOne({
      where: { id, userId },
      relations: ['scores', 'tags'],
    })
    if (!row) throw new NotFoundException('测评不存在')
    return this.toView(row)
  }

  async create(userId: string, dto: CreateAssessmentDto) {
    await this.assertType(userId, dto.typeId)
    const tags = await this.resolveTags(userId, dto.tagIds)
    await this.assertScores(userId, dto.scores)

    const assessment = this.assessmentRepo.create({
      userId,
      typeId: dto.typeId,
      title: dto.title,
      heldAt: dto.heldAt,
      note: dto.note ?? null,
      totalScore: dto.totalScore == null ? null : String(dto.totalScore),
      classRank: dto.classRank ?? null,
      schoolRank: dto.schoolRank ?? null,
      tags,
    })
    const saved = await this.assessmentRepo.save(assessment)
    await this.replaceScores(String(saved.id), dto.scores)
    await this.points.awardAssessmentCreate(userId, String(saved.id))
    return this.detail(userId, String(saved.id))
  }

  async update(userId: string, id: string, dto: UpdateAssessmentDto) {
    const entity = await this.assessmentRepo.findOne({
      where: { id, userId },
      relations: ['tags'],
    })
    if (!entity) throw new NotFoundException('测评不存在')

    if (dto.typeId !== undefined) {
      await this.assertType(userId, dto.typeId)
      entity.typeId = dto.typeId
    }
    if (dto.title !== undefined) entity.title = dto.title
    if (dto.heldAt !== undefined) entity.heldAt = dto.heldAt
    if (dto.note !== undefined) entity.note = dto.note
    if (dto.totalScore !== undefined) {
      entity.totalScore = dto.totalScore == null ? null : String(dto.totalScore)
    }
    if (dto.classRank !== undefined) entity.classRank = dto.classRank
    if (dto.schoolRank !== undefined) entity.schoolRank = dto.schoolRank
    if (dto.tagIds !== undefined) entity.tags = await this.resolveTags(userId, dto.tagIds)

    await this.assessmentRepo.save(entity)
    if (dto.scores) {
      await this.assertScores(userId, dto.scores)
      await this.replaceScores(id, dto.scores)
    }
    return this.detail(userId, id)
  }

  async remove(userId: string, id: string) {
    const entity = await this.assessmentRepo.findOne({ where: { id, userId } })
    if (!entity) throw new NotFoundException('测评不存在')
    await this.assessmentRepo.remove(entity)
    return { id }
  }

  async trends(userId: string, query: TrendsQueryDto) {
    const params: unknown[] = [userId]
    let sql = `
      SELECT a.id AS assessmentId, a.title, a.held_at AS heldAt, a.type_id AS typeId,
             a.total_score AS storedTotalScore,
             a.class_rank AS assessmentClassRank,
             a.school_rank AS assessmentSchoolRank,
             s.subject_id AS subjectId, s.score, s.full_score AS fullScore,
             s.class_rank AS classRank, s.school_rank AS schoolRank
      FROM assessments a
      INNER JOIN assessment_subject_scores s ON s.assessment_id = a.id
      WHERE a.user_id = ?`
    if (query.subjectId) {
      sql += ' AND s.subject_id = ?'
      params.push(query.subjectId)
    }
    if (query.typeId) {
      sql += ' AND a.type_id = ?'
      params.push(query.typeId)
    }
    if (query.dateFrom) {
      sql += ' AND a.held_at >= ?'
      params.push(query.dateFrom)
    }
    if (query.dateTo) {
      sql += ' AND a.held_at <= ?'
      params.push(query.dateTo)
    }
    sql += ' ORDER BY a.held_at ASC, a.id ASC'
    const rows = await this.dataSource.query(sql, params)

    const byAssessment = new Map<
      string,
      {
        assessmentId: string
        title: string
        heldAt: string
        typeId: string
        totalScore: number
        totalFull: number
        classRank: number | null
        schoolRank: number | null
        subjects: Array<{
          subjectId: string
          score: number
          fullScore: number | null
          classRank: number | null
          schoolRank: number | null
        }>
      }
    >()

    for (const r of rows as Array<Record<string, unknown>>) {
      const id = String(r.assessmentId)
      if (!byAssessment.has(id)) {
        byAssessment.set(id, {
          assessmentId: id,
          title: String(r.title),
          heldAt: formatDateYmd(r.heldAt),
          typeId: String(r.typeId),
          totalScore: 0,
          totalFull: 0,
          classRank:
            r.assessmentClassRank == null ? null : Number(r.assessmentClassRank),
          schoolRank:
            r.assessmentSchoolRank == null ? null : Number(r.assessmentSchoolRank),
          subjects: [],
        })
      }
      const item = byAssessment.get(id)!
      const score = Number(r.score)
      const full = r.fullScore == null ? null : Number(r.fullScore)
      item.totalScore += score
      if (full != null) item.totalFull += full
      item.subjects.push({
        subjectId: String(r.subjectId),
        score,
        fullScore: full,
        classRank: r.classRank == null ? null : Number(r.classRank),
        schoolRank: r.schoolRank == null ? null : Number(r.schoolRank),
      })
      // 若库中存了测评级总分，优先使用
      if (r.storedTotalScore != null && r.storedTotalScore !== '') {
        item.totalScore = Number(r.storedTotalScore)
      }
    }

    return [...byAssessment.values()]
  }

  async insight(userId: string, subjectId: string) {
    await this.subjectsService.findOwnedOrFail(userId, subjectId)
    const scoreTrend = await this.trends(userId, { subjectId })
    const errorTrend = await this.dataSource.query(
      `SELECT DATE_FORMAT(occurred_at, '%Y-%m') AS ym, COUNT(*) AS cnt
       FROM error_questions
       WHERE user_id = ? AND subject_id = ?
       GROUP BY DATE_FORMAT(occurred_at, '%Y-%m')
       ORDER BY ym ASC`,
      [userId, subjectId],
    )
    return {
      subjectId,
      scorePoints: scoreTrend.map((t) => ({
        heldAt: t.heldAt,
        title: t.title,
        score: t.subjects[0]?.score ?? null,
        fullScore: t.subjects[0]?.fullScore ?? null,
        note: null as string | null,
      })),
      errorMonthly: errorTrend.map((r: { ym: string; cnt: string }) => ({
        month: r.ym,
        count: Number(r.cnt),
      })),
    }
  }

  private async assertType(userId: string, typeId: string) {
    const rows = await this.dataSource.query(
      `SELECT id FROM assessment_types WHERE id = ? AND user_id = ? LIMIT 1`,
      [typeId, userId],
    )
    if (!rows?.length) throw new NotFoundException('考试类型不存在')
  }

  private async assertScores(userId: string, scores: ScoreItemDto[]) {
    const ids = scores.map((s) => s.subjectId)
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('同一测评下科目不能重复')
    }
    for (const s of scores) {
      await this.subjectsService.findOwnedOrFail(userId, s.subjectId)
    }
  }

  private async replaceScores(assessmentId: string, scores: ScoreItemDto[]) {
    await this.scoreRepo.delete({ assessmentId })
    const entities = scores.map((s) =>
      this.scoreRepo.create({
        assessmentId,
        subjectId: s.subjectId,
        score: String(s.score),
        fullScore: s.fullScore == null ? null : String(s.fullScore),
        classRank: s.classRank ?? null,
        classSize: s.classSize ?? null,
        schoolRank: s.schoolRank ?? null,
        schoolSize: s.schoolSize ?? null,
        note: s.note ?? null,
      }),
    )
    await this.scoreRepo.save(entities)
  }

  private async resolveTags(userId: string, tagIds?: string[]) {
    if (!tagIds?.length) return []
    const tags = await this.tagsRepo.find({ where: { userId, id: In(tagIds) } })
    if (tags.length !== tagIds.length) throw new BadRequestException('存在无效标签')
    return tags
  }

  private toView(row: Assessment) {
    const scores = (row.scores || []).map((s) => ({
      id: String(s.id),
      subjectId: String(s.subjectId),
      score: Number(s.score),
      fullScore: s.fullScore == null ? null : Number(s.fullScore),
      classRank: s.classRank,
      classSize: s.classSize,
      schoolRank: s.schoolRank,
      schoolSize: s.schoolSize,
      note: s.note,
    }))
    const sumScore = scores.reduce((sum, s) => sum + s.score, 0)
    const totalFull = scores.reduce((sum, s) => sum + (s.fullScore ?? 0), 0)
    const storedTotal =
      row.totalScore == null || row.totalScore === ''
        ? null
        : Number(row.totalScore)
    return {
      id: String(row.id),
      typeId: String(row.typeId),
      title: row.title,
      heldAt: formatDateYmd(row.heldAt),
      note: row.note,
      totalScore: storedTotal ?? sumScore,
      subjectsSumScore: sumScore,
      totalFull: totalFull || null,
      classRank: row.classRank,
      schoolRank: row.schoolRank,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      scores,
      tags: (row.tags || []).map((t) => ({
        id: String(t.id),
        name: t.name,
        color: t.color,
      })),
    }
  }
}
