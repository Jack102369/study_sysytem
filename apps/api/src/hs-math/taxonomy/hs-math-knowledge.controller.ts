import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ListHsMathKnowledgePointsQueryDto } from '../dto/knowledge-point.dto'
import { HsMathKnowledgeService } from './hs-math-knowledge.service'

@Controller('hs-math')
@UseGuards(JwtAuthGuard)
export class HsMathKnowledgeController {
  constructor(private readonly service: HsMathKnowledgeService) {}

  @Get('knowledge-points')
  list(@Query() query: ListHsMathKnowledgePointsQueryDto) {
    return this.service.listForStudent(query)
  }

  @Get('categories/:id/knowledge-points')
  listByCategory(@Param('id') id: string) {
    return this.service.listByCategoryId(id)
  }

  @Get('knowledge-points/:code')
  detail(@Param('code') code: string) {
    return this.service.getByCodeForStudent(code)
  }
}
