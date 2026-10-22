import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemAdvancedTrainService } from './chem-advanced-train.service'
import {
  AdvancedAvailabilityQueryDto,
  CreateAdvancedTrainSessionDto,
} from './dto/advanced-train.dto'

@Controller('chemistry/train/advanced')
@UseGuards(JwtAuthGuard)
export class ChemAdvancedTrainController {
  constructor(private readonly service: ChemAdvancedTrainService) {}

  @Get('availability')
  availability(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdvancedAvailabilityQueryDto,
  ) {
    return this.service.availability(user.sub, query)
  }

  @Post('sessions')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdvancedTrainSessionDto,
  ) {
    return this.service.createSession(user.sub, dto)
  }
}
