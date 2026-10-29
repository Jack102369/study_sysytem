import http, { type ApiSuccess } from './http'

export type IndustrialExperimentFeatureStatus = {
  enabled: boolean
  specialtyCode: string
  envKey: string
  note?: string
}

/**
 * 工业实验功能开关（后端权威）。
 * 请求失败 / 非 2xx → 视为关闭，避免误启用。
 */
export async function fetchIndustrialExperimentFeature(): Promise<IndustrialExperimentFeatureStatus> {
  try {
    const { data } = await http.get<
      ApiSuccess<IndustrialExperimentFeatureStatus>
    >('/chemistry/features/industrial-experiment')
    const payload = data?.data
    if (!payload || typeof payload.enabled !== 'boolean') {
      return {
        enabled: false,
        specialtyCode: 'industrial_experiment',
        envKey: 'CHEM_INDUSTRIAL_EXPERIMENT_ENABLED',
        note: 'invalid payload → default OFF',
      }
    }
    return payload
  } catch {
    return {
      enabled: false,
      specialtyCode: 'industrial_experiment',
      envKey: 'CHEM_INDUSTRIAL_EXPERIMENT_ENABLED',
      note: 'request failed → default OFF',
    }
  }
}
