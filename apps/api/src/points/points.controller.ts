import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { ListLedgerQueryDto, UpdateRewardTierDto } from './dto/points.dto'
import { PointsService } from './points.service'

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(private readonly service: PointsService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.service.summary(user.sub)
  }

  @Get('ledger')
  ledger(@CurrentUser() user: JwtPayload, @Query() query: ListLedgerQueryDto) {
    return this.service.listLedger(user.sub, query)
  }

  @Get('tiers')
  tiers(@CurrentUser() user: JwtPayload) {
    return this.service.listTiers(user.sub)
  }

  @Patch('tiers/:id')
  updateTier(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRewardTierDto,
  ) {
    return this.service.updateTier(user.sub, id, dto)
  }
}
