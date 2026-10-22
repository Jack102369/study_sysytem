import http, { type ApiSuccess } from './http'

export type FeatureFlag = {
  flagKey: string
  enabled: boolean
  moduleName: string
  label: string
  description: string | null
  updatedAt?: string
}

export async function listFeatureFlags() {
  const { data } = await http.get<ApiSuccess<FeatureFlag[]>>('/feature-flags')
  return data.data
}

export async function setFeatureFlagEnabled(flagKey: string, enabled: boolean) {
  const { data } = await http.patch<ApiSuccess<FeatureFlag>>(
    `/admin/feature-flags/${encodeURIComponent(flagKey)}`,
    { enabled },
  )
  return data.data
}
