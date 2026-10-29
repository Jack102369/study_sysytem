/** 工业实验 AI Provider 抽象（STEP_07） */

export type IndustrialAiProviderKind = 'http' | 'mock'

export type IndustrialAiErrorCode =
  | 'AI_DISABLED'
  | 'AI_CONFIG_MISSING'
  | 'AI_AUTH_FAILED'
  | 'AI_NETWORK_ERROR'
  | 'AI_TIMEOUT'
  | 'AI_MODEL_UNAVAILABLE'
  | 'AI_HTTP_ERROR'
  | 'AI_EMPTY_RESPONSE'
  | 'AI_INVALID_JSON'
  | 'AI_SCHEMA_INVALID'
  | 'AI_CONTENT_VALIDATION_FAILED'
  | 'AI_MOCK_FORCED_ERROR'
  | 'AI_UNKNOWN'

export class IndustrialAiError extends Error {
  readonly code: IndustrialAiErrorCode
  readonly status?: number
  readonly retryable: boolean

  constructor(
    code: IndustrialAiErrorCode,
    message: string,
    opts?: { status?: number; retryable?: boolean; cause?: unknown },
  ) {
    super(message)
    this.name = 'IndustrialAiError'
    this.code = code
    this.status = opts?.status
    this.retryable = opts?.retryable ?? false
    if (opts?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = opts.cause
    }
  }
}

export type IndustrialAiTokenUsage = {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  available: boolean
}

export type IndustrialAiChatRequest = {
  requestId: string
  system: string
  user: string
  temperature?: number
  maxTokens?: number
  forceJson?: boolean
}

export type IndustrialAiChatResponse = {
  providerKind: IndustrialAiProviderKind
  model: string
  content: string
  durationMs: number
  tokenUsage: IndustrialAiTokenUsage
  rawFinishReason?: string | null
}

export type IndustrialAiProviderConfig = {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
  timeoutMs: number
  maxRetries: number
  /** 来源标记：industrial 专用或回退 deepseek */
  configSource: 'industrial' | 'deepseek_fallback' | 'none' | 'mock'
}

export interface IndustrialAiProvider {
  readonly kind: IndustrialAiProviderKind
  isAvailable(): boolean
  getConfigSummary(): Omit<IndustrialAiProviderConfig, 'apiKey'> & {
    apiKeyConfigured: boolean
  }
  chat(req: IndustrialAiChatRequest): Promise<IndustrialAiChatResponse>
}

export type MockProviderScenario =
  | 'success_single'
  | 'success_judge'
  | 'success_blank'
  | 'invalid_json'
  | 'invalid_schema'
  | 'bad_material_ref'
  | 'bad_step_ref'
  | 'bad_node'
  | 'bad_edge'
  | 'answer_leak'
  | 'timeout'
  | 'auth_failed'
  | 'network_error'
  | 'empty_response'
