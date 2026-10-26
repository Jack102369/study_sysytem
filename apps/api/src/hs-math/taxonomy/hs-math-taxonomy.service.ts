import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { HsMathCategory } from '../entities/hs-math-category.entity'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'

@Injectable()
export class HsMathTaxonomyService {
  constructor(
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
    @InjectRepository(HsMathCategory)
    private readonly categoriesRepo: Repository<HsMathCategory>,
  ) {}

  async listSpecialties() {
    const rows = await this.specialtiesRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    const counts = await this.categoriesRepo
      .createQueryBuilder('c')
      .innerJoin(HsMathSpecialty, 's', 's.id = c.specialty_id AND s.is_active = 1')
      .select('c.specialty_id', 'specialtyId')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.is_active = 1')
      .groupBy('c.specialty_id')
      .getRawMany<{ specialtyId: string; cnt: string }>()

    const countMap = new Map(
      counts.map((x) => [String(x.specialtyId), Number(x.cnt) || 0]),
    )

    return rows.map((s) => ({
      id: String(s.id),
      code: s.code,
      name: s.name,
      bookCode: s.bookCode,
      chapterNo: s.chapterNo,
      intro: s.intro,
      sortOrder: s.sortOrder,
      categoryCount: countMap.get(String(s.id)) ?? 0,
    }))
  }

  async getSpecialtyByCode(code: string) {
    const specialty = await this.specialtiesRepo.findOne({
      where: { code, isActive: true },
    })
    if (!specialty) {
      throw new NotFoundException(`专项不存在或未启用：${code}`)
    }
    const categories = await this.categoriesRepo.find({
      where: { specialtyId: specialty.id, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return {
      id: String(specialty.id),
      code: specialty.code,
      name: specialty.name,
      bookCode: specialty.bookCode,
      chapterNo: specialty.chapterNo,
      intro: specialty.intro,
      sortOrder: specialty.sortOrder,
      categories: categories.map((c) => ({
        id: String(c.id),
        code: c.code,
        name: c.name,
        sortOrder: c.sortOrder,
      })),
    }
  }
}
