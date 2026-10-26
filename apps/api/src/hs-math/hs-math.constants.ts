/** 高一数学 P0 常量（与 04/07 设计一致；本阶段不实现判题） */

export const HS_MATH_POOLS = ['formal', 'test'] as const
export type HsMathPool = (typeof HS_MATH_POOLS)[number]

export const HS_MATH_QTYPES = [
  'single',
  'multi',
  'judge',
  'numeric',
  'application',
] as const
export type HsMathQtype = (typeof HS_MATH_QTYPES)[number]

export const HS_MATH_ITEM_STATUSES = ['draft', 'approved', 'disabled'] as const
export type HsMathItemStatus = (typeof HS_MATH_ITEM_STATUSES)[number]

/** 人工审核结论（≠ 题目发布 status） */
export const HS_MATH_REVIEW_STATUSES = [
  'passed',
  'rejected',
  'deferred',
] as const
export type HsMathReviewStatus = (typeof HS_MATH_REVIEW_STATUSES)[number]

export const HS_MATH_MODES = ['sequential', 'random'] as const
export type HsMathMode = (typeof HS_MATH_MODES)[number]

export const HS_MATH_SESSION_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const
export type HsMathSessionStatus = (typeof HS_MATH_SESSION_STATUSES)[number]

export const HS_MATH_SESSION_KINDS = [
  'specialty',
  'daily',
  'advanced',
  'wrong_review',
  'wrong_variation',
] as const
export type HsMathSessionKind = (typeof HS_MATH_SESSION_KINDS)[number]

/**
 * correct|wrong|pending_review：旧题型确定性判分。
 * pending_ai：应用题已提交、待 AI（APPLICATION-1）。
 * grading|graded|review_required|grading_failed：APPLICATION-3A 写入。
 */
export const HS_MATH_GRADE_RESULTS = [
  'correct',
  'wrong',
  'pending_review',
  'pending_ai',
  'grading',
  'graded',
  'review_required',
  'grading_failed',
] as const
export type HsMathGradeResult = (typeof HS_MATH_GRADE_RESULTS)[number]

/** 不计 correct/wrong、不计 accuracy 分母的状态 */
export const HS_MATH_PENDING_LIKE_GRADE_RESULTS = [
  'pending_review',
  'pending_ai',
  'grading',
  'review_required',
  'grading_failed',
] as const

export function isHsMathPendingLikeGradeResult(
  r: string | null | undefined,
): boolean {
  return (
    !!r &&
    (HS_MATH_PENDING_LIKE_GRADE_RESULTS as readonly string[]).includes(r)
  )
}

/** @deprecated 使用 HS_MATH_GRADE_RESULTS；保留别名兼容旧引用 */
export const HS_MATH_APPLICATION_GRADE_RESULTS_RESERVED = [
  'grading',
  'graded',
  'review_required',
  'grading_failed',
] as const

/** 未配置密钥或显式关闭时不外发；代码路径可跑通并写 grading_failed */
export const HS_MATH_AI_GRADING_ENV_ENABLED = 'HS_MATH_AI_GRADING_ENABLED'
export const HS_MATH_AI_GRADING_TIMEOUT_MS = 60_000
export const HS_MATH_AI_GRADING_MAX_ATTEMPTS = 2

/**
 * APPLICATION-3D-5：Qwen Vision 多模态批改（默认关闭；与 DeepSeek 文字开关独立）。
 * 须同时配置 URL + KEY 才允许真实外发。
 */
export const HS_MATH_VISION_GRADING_ENV_ENABLED =
  'HS_MATH_VISION_GRADING_ENABLED'
export const HS_MATH_VISION_API_URL_ENV = 'HS_MATH_VISION_API_URL'
export const HS_MATH_VISION_API_KEY_ENV = 'HS_MATH_VISION_API_KEY'
export const HS_MATH_VISION_MODEL_ENV = 'HS_MATH_VISION_MODEL'
export const HS_MATH_VISION_MODEL_DEFAULT = 'qwen3.8-27b'
export const HS_MATH_VISION_GRADING_TIMEOUT_MS = 90_000
export const HS_MATH_VISION_MAX_TOKENS = 2000
/** 含图且 confidence 低于此阈值 → review_required（不写分） */
export const HS_MATH_VISION_CONFIDENCE_REVIEW_THRESHOLD = 0.5
/**
 * APPLICATION-3D-8：进程内同时进行的 Vision HTTP 上限（可用 env 覆盖）。
 * 不建任务队列；仅防同进程打爆上游。
 */
export const HS_MATH_VISION_MAX_INFLIGHT_ENV = 'HS_MATH_VISION_MAX_INFLIGHT'
export const HS_MATH_VISION_MAX_INFLIGHT_DEFAULT = 2
/** grading 卡住判定：超时 + 缓冲后就地 grading_failed，不外发、不重试 */
export const HS_MATH_VISION_STALE_GRADING_BUFFER_MS = 30_000

/**
 * APPLICATION-3D-9：真实验收 fail-closed 范围（与 ENABLED 同时生效）。
 * TEST_USER_ID 已设时：SESSION_IDS 为空 → 禁止一切自动外发。
 */
export const HS_MATH_VISION_GRADING_TEST_USER_ID_ENV =
  'HS_MATH_VISION_GRADING_TEST_USER_ID'
export const HS_MATH_VISION_GRADING_TEST_SESSION_IDS_ENV =
  'HS_MATH_VISION_GRADING_TEST_SESSION_IDS'
/** APPLICATION-4C-3：可选 sessionItem allowlist；非空则必须匹配（与 USER/SESSION 叠加） */
export const HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS_ENV =
  'HS_MATH_VISION_GRADING_TEST_SESSION_ITEM_IDS'
/** 进程内真实 Vision HTTP 上限；未设则不限制（生产默认）；验收设 2 */
export const HS_MATH_VISION_LIVE_HTTP_BUDGET_ENV =
  'HS_MATH_VISION_LIVE_HTTP_BUDGET'

/** APPLICATION-3E-3：DeepSeek 文字批改进程内 HTTP 预算（失败也计数；空/0=不限制） */
export const HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET_ENV =
  'HS_MATH_AI_GRADING_LIVE_HTTP_BUDGET'

/**
 * APPLICATION-4C-4B：日常应用题 AI 模式。
 * disabled（默认）| owner_only；非法值 fail-closed。
 * disabled 时仅保留 TEST_USER+SESSION 测试路径；无 TEST_USER 则拒绝。
 */
export const HS_MATH_APPLICATION_AI_MODE_ENV = 'HS_MATH_APPLICATION_AI_MODE'
/** owner_only 必填；逗号分隔 user_id；缺失/空/非法 → 拒绝全部 AI */
export const HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS_ENV =
  'HS_MATH_APPLICATION_AI_ALLOWED_USER_IDS'
/**
 * 高一数学 application DeepSeek 日上限（Asia/Shanghai）。
 * 默认 20；0/负/非整数 → fail-closed。不影响其他学科。
 */
export const HS_MATH_DEEPSEEK_DAILY_LIMIT_ENV = 'HS_MATH_DEEPSEEK_DAILY_LIMIT'
export const HS_MATH_DEEPSEEK_DAILY_LIMIT_DEFAULT = 20
/** gradeReason / 业务错误码：DeepSeek 日额度耗尽 */
export const HS_MATH_DEEPSEEK_DAILY_QUOTA_EXCEEDED =
  'deepseek_daily_quota_exceeded'

/** APPLICATION-3E-1：应用题 AI 批改方式（存于 user_answer_json） */
export const HS_MATH_GRADING_PROVIDERS = ['qwen', 'deepseek'] as const
export type HsMathGradingProvider = (typeof HS_MATH_GRADING_PROVIDERS)[number]
export const HS_MATH_GRADING_PROVIDER_DEFAULT: HsMathGradingProvider = 'qwen'

export const HS_MATH_COUNTS = [5, 10, 20] as const
export const HS_MATH_DIFFICULTIES = [1, 2, 3] as const

export const HS_MATH_GRADE_RULE_VERSION = 'v1' as const

/** P1-FUNC-CORE-1A：题目来源类型（与 difficulty 独立） */
export const HS_MATH_SOURCE_TYPES = [
  'original',
  'adapted',
  'past_exam',
] as const
export type HsMathSourceType = (typeof HS_MATH_SOURCE_TYPES)[number]

/** 核实状态：不含 rejected，避免与审核 rejected 混淆；预检曾列 rejected，本阶段按任务书收窄 */
export const HS_MATH_SOURCE_VERIFICATION_STATUSES = [
  'unverified',
  'verified',
] as const
export type HsMathSourceVerificationStatus =
  (typeof HS_MATH_SOURCE_VERIFICATION_STATUSES)[number]

/** 许可状态（与迁移草案一致；forbidden 一律禁止正式批准） */
export const HS_MATH_SOURCE_LICENSE_STATUSES = [
  'unknown',
  'permitted',
  'restricted',
  'forbidden',
] as const
export type HsMathSourceLicenseStatus =
  (typeof HS_MATH_SOURCE_LICENSE_STATUSES)[number]

export const HS_MATH_SOURCE_TYPE_DEFAULT: HsMathSourceType = 'original'
export const HS_MATH_SOURCE_VERIFICATION_DEFAULT: HsMathSourceVerificationStatus =
  'unverified'
export const HS_MATH_SOURCE_LICENSE_DEFAULT: HsMathSourceLicenseStatus =
  'unknown'

/** APPLICATION-2：应用题解答图片生命周期 */
export const HS_MATH_SESSION_IMAGE_STATUSES = ['draft', 'submitted'] as const
export type HsMathSessionImageStatus =
  (typeof HS_MATH_SESSION_IMAGE_STATUSES)[number]

/** 与 SESSION_IMAGE_STATUSES 同义别名（历史命名） */
export const HS_MATH_APPLICATION_IMAGE_STATUSES = HS_MATH_SESSION_IMAGE_STATUSES
export type HsMathApplicationImageStatus = HsMathSessionImageStatus

/** APPLICATION-2：允许的 MIME（声明 + 魔数双检） */
export const HS_MATH_APPLICATION_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export type HsMathApplicationImageMime =
  (typeof HS_MATH_APPLICATION_IMAGE_MIMES)[number]

/** 单张上限 10MB；单题最多 5 张 */
export const HS_MATH_APPLICATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const HS_MATH_APPLICATION_IMAGE_MAX_COUNT = 5
/** 历史别名 */
export const HS_MATH_APPLICATION_IMAGE_MAX_PER_ITEM =
  HS_MATH_APPLICATION_IMAGE_MAX_COUNT

/** 应用题文字作答最大字符数（防滥用；保留换行） */
export const HS_MATH_APPLICATION_TEXT_MAX_CHARS = 100_000

/** 私有存储相对 API cwd 的根（不挂 useStaticAssets） */
export const HS_MATH_APPLICATION_IMAGE_STORAGE_ROOT =
  'uploads/hs-math/application-answers' as const

/** storage_key 相对 uploads/ 的路径前缀（不含 uploads/） */
export const HS_MATH_APPLICATION_IMAGE_STORAGE_PREFIX =
  'hs-math/application-answers' as const
