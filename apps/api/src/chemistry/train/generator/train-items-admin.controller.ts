import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../../../auth/admin.guard'
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard'
import { ListTrainItemsAdminQueryDto } from './train-items-admin.dto'
import { TrainItemsAdminService } from './train-items-admin.service'

@Controller('chemistry/admin/train-items')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TrainItemsAdminController {
  constructor(private readonly service: TrainItemsAdminService) {}

  @Get()
  list(@Query() query: ListTrainItemsAdminQueryDto) {
    return this.service.list(query)
  }
}
