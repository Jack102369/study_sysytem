import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChemistryService } from './chemistry.service'
import { getChemIndustrialExperimentFeatureStatus } from './industrial/industrial-feature.config'

@Controller('chemistry')
@UseGuards(JwtAuthGuard)
export class ChemistryController {
  constructor(private readonly chemistry: ChemistryService) {}

  /**
   * 工业实验功能开关（权威后端状态；前端失败默认视为关闭）。
   * 关闭时仍可查询本接口，便于 UI 隐藏入口。
   */
  @Get('features/industrial-experiment')
  industrialExperimentFeature() {
    return getChemIndustrialExperimentFeatureStatus()
  }

  /** 一级专项列表（含二级分类数量；工业关闭时不含 industrial_experiment） */
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
