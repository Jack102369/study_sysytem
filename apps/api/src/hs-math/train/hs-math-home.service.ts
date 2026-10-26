import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { HsMathSpecialty } from '../entities/hs-math-specialty.entity'
import { HsMathAnalyticsService } from './hs-math-analytics.service'
import { HsMathTrainService } from './hs-math-train.service'

@Injectable()
export class HsMathHomeService {
  constructor(
    private readonly analytics: HsMathAnalyticsService,
    private readonly train: HsMathTrainService,
    @InjectRepository(HsMathSpecialty)
    private readonly specialtiesRepo: Repository<HsMathSpecialty>,
  ) {}

  async getHome(userId: string) {
    const [overview, weeklyTrend, recent, availableSpecialties] =
      await Promise.all([
        this.analytics.loadOverview(userId),
        this.analytics.loadDailyTrend(userId, 7),
        this.train.listSessions(userId, {
          page: 1,
          pageSize: 5,
          sortBy: 'startedAt',
          sortOrder: 'DESC',
        }),
        this.specialtiesRepo.count({ where: { isActive: true } }),
      ])

    return {
      overview,
      weeklyTrend,
      recentSessions: recent.items,
      availableSpecialties,
      shortcuts: {
        hasHistory: overview.completedSessions > 0,
        canStartSpecialtyTrain: availableSpecialties > 0,
        // 未实现的能力不造假数据
        dailyReviewAvailable: false,
        wrongBookAvailable: false,
      },
    }
  }
}
