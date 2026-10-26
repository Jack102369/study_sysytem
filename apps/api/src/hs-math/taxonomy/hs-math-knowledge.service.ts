import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ListHsMathKnowledgePointsQueryDto } from '../dto/knowledge-point.dto'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from '../entities/hs-math-knowledge-point.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'

@Injectable()
export class HsMathKnowledgeService {
  constructor(
    @InjectRepository(HsMathKnowledgePoint)
    private readonly kpRepo: Repository<HsMathKnowledgePoint>,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
  ) {}

  /** 学生列表：仅启用 KP，且章节/小节均启用；父级停用则子级不可见 */
  async listForStudent(query: ListHsMathKnowledgePointsQueryDto) {
    const qb = this.kpRepo
      .createQueryBuilder('kp')
      .innerJoin(HsMathSpecialty, 'sp', 'sp.id = kp.specialty_id')
      .innerJoin(HsMathCategory, 'cat', 'cat.id = kp.category_id')
      .where('kp.is_active = 1')
      .andWhere('sp.is_active = 1')
      .andWhere('cat.is_active = 1')
      .orderBy('kp.sort_order', 'ASC')
      .addOrderBy('kp.id', 'ASC')

    if (query.specialtyId) {
      qb.andWhere('kp.specialty_id = :sid', { sid: query.specialtyId })
    }
    if (query.categoryId) {
      qb.andWhere('kp.category_id = :cid', { cid: query.categoryId })
    }

    const rows = await qb.getMany()
    const visible = await this.filterByActiveAncestors(rows)
    return visible.map((k) => this.toStudentListItem(k))
  }

  async listByCategoryId(categoryId: string) {
    const cat = await this.categoriesRepo.findOne({ where: { id: categoryId } })
    if (!cat || !cat.isActive) {
      throw new NotFoundException('小节不存在或已停用')
    }
    const sp = await this.specialtiesRepo.findOne({
      where: { id: cat.specialtyId },
    })
    if (!sp || !sp.isActive) {
      throw new NotFoundException('章节不存在或已停用')
    }
    return this.listForStudent({
      specialtyId: cat.specialtyId,
      categoryId,
    })
  }

  async getByCodeForStudent(code: string) {
    const kp = await this.kpRepo.findOne({ where: { code: code.trim() } })
    if (!kp || !kp.isActive) {
      throw new NotFoundException('知识点不存在或已停用')
    }
    const sp = await this.specialtiesRepo.findOne({
      where: { id: kp.specialtyId },
    })
    const cat = await this.categoriesRepo.findOne({
      where: { id: kp.categoryId },
    })
    if (!sp?.isActive || !cat?.isActive) {
      throw new NotFoundException('知识点不存在或已停用')
    }
    if (!(await this.isAncestorChainActive(kp))) {
      throw new NotFoundException('知识点不存在或已停用')
    }

    let parent: {
      code: string
      name: string
    } | null = null
    if (kp.parentId) {
      const p = await this.kpRepo.findOne({ where: { id: kp.parentId } })
      if (p && p.isActive) {
        parent = { code: p.code, name: p.name }
      }
    }

    return {
      code: kp.code,
      name: kp.name,
      summary: kp.summary,
      sortOrder: kp.sortOrder,
      specialty: {
        id: sp.id,
        code: sp.code,
        name: sp.name,
      },
      category: {
        id: cat.id,
        code: cat.code,
        name: cat.name,
      },
      parent,
    }
  }

  private async filterByActiveAncestors(
    rows: HsMathKnowledgePoint[],
  ): Promise<HsMathKnowledgePoint[]> {
    const out: HsMathKnowledgePoint[] = []
    for (const r of rows) {
      if (await this.isAncestorChainActive(r)) out.push(r)
    }
    return out
  }

  /** 沿 parent 向上：任一停用不存在则不可见 */
  private async isAncestorChainActive(
    kp: HsMathKnowledgePoint,
  ): Promise<boolean> {
    let cursor = kp.parentId
    const seen = new Set<string>()
    let depth = 0
    while (cursor) {
      if (seen.has(cursor) || depth > 32) return false
      seen.add(cursor)
      const p = await this.kpRepo.findOne({ where: { id: cursor } })
      if (!p || !p.isActive) return false
      cursor = p.parentId
      depth += 1
    }
    return true
  }

  private toStudentListItem(kp: HsMathKnowledgePoint) {
    return {
      code: kp.code,
      name: kp.name,
      summary: kp.summary,
      sortOrder: kp.sortOrder,
      specialtyId: kp.specialtyId,
      categoryId: kp.categoryId,
      parentId: kp.parentId,
    }
  }
}
