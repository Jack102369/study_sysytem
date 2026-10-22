import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ChemKbService } from './chem-kb.service'
import { ChemKbListQueryDto } from './dto/kb.dto'

@Controller('chemistry/kb')
@UseGuards(JwtAuthGuard)
export class ChemKbController {
  constructor(private readonly kb: ChemKbService) {}

  @Get(':type')
  list(@Param('type') type: string, @Query() query: ChemKbListQueryDto) {
    return this.kb.list(type, query, { publishedOnly: true })
  }

  @Get(':type/:id')
  detail(@Param('type') type: string, @Param('id') id: string) {
    return this.kb.get(type, id, { publishedOnly: true })
  }
}
