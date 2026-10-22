import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UpdateStudyPrefsDto } from './dto/study-prefs.dto'
import { StudyCompareMode, UserStudyPref } from './user-study-pref.entity'

@Injectable()
export class StudyPrefsService {
  constructor(
    @InjectRepository(UserStudyPref)
    private readonly repo: Repository<UserStudyPref>,
  ) {}

  async getOrCreate(userId: string) {
    let row = await this.repo.findOne({ where: { userId } })
    if (!row) {
      row = await this.repo.save(
        this.repo.create({
          userId,
          compareMode: 'score',
          scoreThreshold: '1.00',
          rankThreshold: 1,
        }),
      )
    }
    return this.toView(row)
  }

  async update(userId: string, dto: UpdateStudyPrefsDto) {
    const current = await this.getOrCreate(userId)
    const row = await this.repo.findOneOrFail({ where: { userId } })
    if (dto.compareMode) row.compareMode = dto.compareMode as StudyCompareMode
    if (dto.scoreThreshold !== undefined) {
      row.scoreThreshold = Number(dto.scoreThreshold).toFixed(2)
    }
    if (dto.rankThreshold !== undefined) {
      row.rankThreshold = Math.max(1, Math.floor(dto.rankThreshold))
    }
    const saved = await this.repo.save(row)
    return this.toView(saved) || current
  }

  private toView(row: UserStudyPref) {
    return {
      userId: String(row.userId),
      compareMode: row.compareMode,
      scoreThreshold: Number(row.scoreThreshold),
      rankThreshold: Number(row.rankThreshold),
      updatedAt: row.updatedAt,
    }
  }
}
