import type { IndustrialAiProviderConfig } from './industrial-ai-provider.types'

function env(name: string, fallback = ''): string {
  return String(process.env[name] ?? fallback).trim()
}

function envInt(name: string, fallback: number): number {
  const raw = env(name)
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = env(name).toLowerCase()
  if (!raw) return fallback
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  return fallback
}

/**
 * 读取工业 AI 配置。
 * 优先 INDUSTRIAL_AI_*；密钥/地址缺失时可回退 DEEPSEEK_*（复用仓库已有配置约定）。
 * 永不返回 apiKey 到日志接口以外的调用方摘要。
 */
export function loadIndustrialAiProviderConfig(): IndustrialAiProviderConfig {
  const industrialKey = env('INDUSTRIAL_AI_API_KEY')
  const deepseekKey = env('DEEPSEEK_API_KEY')
  const industrialBase = env('INDUSTRIAL_AI_BASE_URL')
  const deepseekBase = env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
  const industrialModel = env('INDUSTRIAL_AI_MODEL')
  const deepseekModel = env('DEEPSEEK_MODEL', 'deepseek-chat')

  const hasIndustrial = Boolean(industrialKey)
  const apiKey = hasIndustrial ? industrialKey : deepseekKey
  const baseUrl = (hasIndustrial && industrialBase
    ? industrialBase
    : industrialBase || deepseekBase
  ).replace(/\/$/, '')
  const model =
    (hasIndustrial && industrialModel ? industrialModel : industrialModel || deepseekModel) ||
    'deepseek-chat'

  const enabledFlag = envBool('INDUSTRIAL_AI_ENABLED', Boolean(apiKey))
  const configSource: IndustrialAiProviderConfig['configSource'] = !apiKey
    ? 'none'
    : hasIndustrial
      ? 'industrial'
      : 'deepseek_fallback'

  return {
    enabled: enabledFlag && Boolean(apiKey),
    baseUrl,
    apiKey,
    model,
    timeoutMs: envInt('INDUSTRIAL_AI_TIMEOUT_MS', 60000),
    maxRetries: Math.min(3, envInt('INDUSTRIAL_AI_MAX_RETRIES', 1)),
    configSource,
  }
}

export function summarizeConfig(
  cfg: IndustrialAiProviderConfig,
): Omit<IndustrialAiProviderConfig, 'apiKey'> & { apiKeyConfigured: boolean } {
  return {
    enabled: cfg.enabled,
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    timeoutMs: cfg.timeoutMs,
    maxRetries: cfg.maxRetries,
    configSource: cfg.configSource,
    apiKeyConfigured: Boolean(cfg.apiKey),
  }
}
