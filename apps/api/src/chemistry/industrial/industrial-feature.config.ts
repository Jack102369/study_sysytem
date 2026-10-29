/**
 * 高一化学「工业实验」全链路功能开关。
 * - 环境变量：CHEM_INDUSTRIAL_EXPERIMENT_ENABLED
 * - 默认 / 缺失 / 空 / 非法值 → false（不得因 NODE_ENV=development 自动开启）
 * - 仅显式 true|1|yes 才启用；改 env 后需重启 API
 */
import { NotFoundException } from '@nestjs/common'
import { INDUSTRIAL_SPECIALTY_CODE } from './industrial-case.constants'

export const CHEM_INDUSTRIAL_EXPERIMENT_ENV_KEY =
  'CHEM_INDUSTRIAL_EXPERIMENT_ENABLED' as const

export function isChemIndustrialExperimentEnabled(): boolean {
  const v = String(process.env.CHEM_INDUSTRIAL_EXPERIMENT_ENABLED || '')
    .trim()
    .toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function getChemIndustrialExperimentFeatureStatus() {
  return {
    enabled: isChemIndustrialExperimentEnabled(),
    specialtyCode: INDUSTRIAL_SPECIALTY_CODE,
    envKey: CHEM_INDUSTRIAL_EXPERIMENT_ENV_KEY,
    note:
      'Default OFF. Set CHEM_INDUSTRIAL_EXPERIMENT_ENABLED=true and restart API to re-enable. Does not auto-publish candidates.',
  }
}

/** 关闭时对外统一 404，避免暴露停用模块细节 */
export function assertChemIndustrialExperimentEnabled(): void {
  if (!isChemIndustrialExperimentEnabled()) {
    throw new NotFoundException('NOT_FOUND')
  }
}

export function isIndustrialSpecialtyCode(code: unknown): boolean {
  return String(code || '').trim() === INDUSTRIAL_SPECIALTY_CODE
}

/** 关闭时拒绝以工业专项作为业务参数（新建训练/抽题等） */
export function assertIndustrialSpecialtyAllowed(code: unknown): void {
  if (
    isIndustrialSpecialtyCode(code) &&
    !isChemIndustrialExperimentEnabled()
  ) {
    throw new NotFoundException('NOT_FOUND')
  }
}
