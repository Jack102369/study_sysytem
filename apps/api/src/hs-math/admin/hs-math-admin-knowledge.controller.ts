import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../../auth/admin.guard'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import {
  CreateHsMathKnowledgePointDto,
  ListHsMathAdminKnowledgePointsQueryDto,
  UpdateHsMathKnowledgePointDto,
} from '../dto/knowledge-point.dto'
import { HsMathAdminKnowledgeService } from './hs-math-admin-knowledge.service'

@Controller('hs-math/admin/knowledge-points')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HsMathAdminKnowledgeController {
  constructor(private readonly service: HsMathAdminKnowledgeService) {}

  @Get()
  list(@Query() query: ListHsMathAdminKnowledgePointsQueryDto) {
    return this.service.list(query)
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.getById(id)
  }

  @Post()
  create(@Body() dto: CreateHsMathKnowledgePointDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHsMathKnowledgePointDto,
  ) {
    return this.service.update(id, dto)
  }
}
