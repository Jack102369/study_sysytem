import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChemCategory } from './chem-category.entity'
import { ChemSpecialty } from './chem-specialty.entity'
import { CHEM_SPECIALTY_SEEDS } from './chemistry.seed'

@Injectable()
export class ChemistryService implements OnModuleInit {
  private readonly logger = new Logger(ChemistryService.name)

  constructor(
    @InjectRepository(ChemSpecialty)
    private readonly specialtiesRepo: Repository<ChemSpecialty>,
    @InjectRepository(ChemCategory)
    private readonly categoriesRepo: Repository<ChemCategory>,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded()
    } catch (e) {
      this.logger.warn(
        `化学专项种子未写入（可能尚未执行 migrate）：${
          e instanceof Error ? e.message : String(e)
        }`,
      )
    }
  }

  /** 幂等写入 12 专项及二级分类 */
  async ensureSeeded() {
    for (const seed of CHEM_SPECIALTY_SEEDS) {
      let specialty = await this.specialtiesRepo.findOne({
        where: { code: seed.code },
      })
      if (!specialty) {
        specialty = this.specialtiesRepo.create({
          code: seed.code,
          name: seed.name,
          icon: seed.icon,
          intro: seed.intro,
          sortOrder: seed.sortOrder,
          isActive: true,
        })
      } else {
        specialty.name = seed.name
        specialty.icon = seed.icon
        specialty.intro = seed.intro
        specialty.sortOrder = seed.sortOrder
        specialty.isActive = true
      }
      specialty = await this.specialtiesRepo.save(specialty)

      for (const cat of seed.categories) {
        let row = await this.categoriesRepo.findOne({
          where: { specialtyId: specialty.id, code: cat.code },
        })
        if (!row) {
          row = this.categoriesRepo.create({
            specialtyId: specialty.id,
            code: cat.code,
            name: cat.name,
            sortOrder: cat.sortOrder,
            isActive: true,
          })
        } else {
          row.name = cat.name
          row.sortOrder = cat.sortOrder
          row.isActive = true
        }
        await this.categoriesRepo.save(row)
      }
    }
  }

  async listSpecialties() {
    const rows = await this.specialtiesRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    const counts = await this.categoriesRepo
      .createQueryBuilder('c')
      .select('c.specialty_id', 'specialtyId')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.is_active = 1')
      .groupBy('c.specialty_id')
      .getRawMany<{ specialtyId: string; cnt: string }>()

    const countMap = new Map(counts.map((x) => [String(x.specialtyId), Number(x.cnt) || 0]))

    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      icon: s.icon,
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
      throw new NotFoundException(`专项不存在：${code}`)
    }
    const categories = await this.categoriesRepo.find({
      where: { specialtyId: specialty.id, isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return {
      id: specialty.id,
      code: specialty.code,
      name: specialty.name,
      icon: specialty.icon,
      intro: specialty.intro,
      sortOrder: specialty.sortOrder,
      categoryCount: categories.length,
      categories: categories.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        sortOrder: c.sortOrder,
      })),
    }
  }
}
