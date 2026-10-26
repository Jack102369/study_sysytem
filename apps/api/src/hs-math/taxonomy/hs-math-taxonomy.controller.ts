import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { HsMathTaxonomyService } from './hs-math-taxonomy.service'

/**
 * 学生端专项/分类（07：GET hs-math/specialties、specialties/:code）
 */
@Controller('hs-math')
@UseGuards(JwtAuthGuard)
export class HsMathTaxonomyController {
  constructor(private readonly taxonomy: HsMathTaxonomyService) {}

  @Get('specialties')
  listSpecialties() {
    return this.taxonomy.listSpecialties()
  }

  @Get('specialties/:code')
  getSpecialty(@Param('code') code: string) {
    return this.taxonomy.getSpecialtyByCode(code.trim())
  }
}
