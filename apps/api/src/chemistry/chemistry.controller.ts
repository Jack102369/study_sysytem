import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChemistryService } from './chemistry.service'

@Controller('chemistry')
@UseGuards(JwtAuthGuard)
export class ChemistryController {
  constructor(private readonly chemistry: ChemistryService) {}

  /** 12 个一级专项（含二级分类数量） */
  @Get('specialties')
  listSpecialties() {
    return this.chemistry.listSpecialties()
  }

  /** 专项详情 + 全部二级分类 */
  @Get('specialties/:code')
  getSpecialty(@Param('code') code: string) {
    return this.chemistry.getSpecialtyByCode(code.trim())
  }
}
