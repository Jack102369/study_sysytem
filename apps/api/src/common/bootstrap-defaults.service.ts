import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AssessmentType } from '../assessment-types/assessment-type.entity'
import { ErrorCategory } from '../error-categories/error-category.entity'
import { Tag } from '../tags/tag.entity'
import {
  DEFAULT_ASSESSMENT_TYPES,
  DEFAULT_TAGS,
  SPECIAL_EXTENSION_CATEGORY_NAME,
} from './constants/biz'

@Injectable()
export class BootstrapDefaultsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepo: Repository<Tag>,
    @InjectRepository(AssessmentType)
    private readonly typesRepo: Repository<AssessmentType>,
    @InjectRepository(ErrorCategory)
    private readonly categoriesRepo: Repository<ErrorCategory>,
  ) {}

  async seedForUser(userId: string) {
    for (const t of DEFAULT_TAGS) {
      const exists = await this.tagsRepo.findOne({
        where: { userId, name: t.name },
      })
      if (!exists) {
        await this.tagsRepo.save(
          this.tagsRepo.create({ userId, name: t.name, color: t.color }),
        )
      }
    }
    for (const t of DEFAULT_ASSESSMENT_TYPES) {
      const exists = await this.typesRepo.findOne({
        where: { userId, name: t.name },
      })
      if (!exists) {
        await this.typesRepo.save(
          this.typesRepo.create({
            userId,
            name: t.name,
            sortOrder: t.sortOrder,
            isArchived: false,
          }),
        )
      }
    }

    const specialName = SPECIAL_EXTENSION_CATEGORY_NAME
    const specialExists = await this.categoriesRepo
      .createQueryBuilder('c')
      .where('c.user_id = :userId', { userId })
      .andWhere('c.name = :name', { name: specialName })
      .andWhere('c.subject_id IS NULL')
      .getOne()
    if (!specialExists) {
      await this.categoriesRepo.save(
        this.categoriesRepo.create({
          userId,
          name: specialName,
          subjectId: null,
          parentId: null,
          sortOrder: -10,
          isArchived: false,
        }),
      )
    }
  }
}
