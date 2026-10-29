import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemAnalyticsService } from './chem-analytics.service'
import { ChemAnalyticsQueryDto } from './dto/analytics.dto'

@Controller('chemistry/train')
@UseGuards(JwtAuthGuard)
export class ChemAnalyticsController {
  constructor(private readonly service: ChemAnalyticsService) {}

  @Get('analytics')
  analytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: ChemAnalyticsQueryDto,
  ) {
    return this.service.getAnalytics(user.sub, query.days, query.specialtyCode)
  }
}
