import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsOptional } from 'class-validator'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemDailyReviewService } from './chem-daily-review.service'

class DailyHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number
}

@Controller('chemistry/train/daily')
@UseGuards(JwtAuthGuard)
export class ChemDailyReviewController {
  constructor(private readonly service: ChemDailyReviewService) {}

  @Get('status')
  status(@CurrentUser() user: JwtPayload) {
    return this.service.status(user.sub)
  }

  @Post('sessions')
  create(@CurrentUser() user: JwtPayload) {
    return this.service.createSession(user.sub)
  }

  @Get('history')
  history(
    @CurrentUser() user: JwtPayload,
    @Query() query: DailyHistoryQueryDto,
  ) {
    return this.service.history(user.sub, query.page, query.pageSize)
  }

  @Get('sessions/:id/insight')
  insight(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.buildDailyInsight(user.sub, id)
  }
}
