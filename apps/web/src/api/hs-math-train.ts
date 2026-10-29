import http, { type ApiSuccess } from './http'
import type { HsMathSessionSummary, HsMathTrendPoint } from './hs-math'

export type HsMathPool = 'formal' | 'test'
export type HsMathMode = 'sequential' | 'random'
export type HsMathQtype =
  | 'single'
  | 'multi'
  | 'judge'
  | 'numeric'
  | 'application'
export type HsMathSessionStatus = 'in_progress' | 'completed' | 'cancelled'
export type HsMathGradeResult =
  | 'correct'
  | 'wrong'
  | 'pending_review'
  | 'pending_ai'
  | 'grading'
  | 'graded'
  | 'review_required'
  | 'grading_failed'

export type HsMathAiRubricScore = {
  rubricKey: string
  score: number
  maxScore: number
  feedback: string
}

/** APPLICATION-3A/3E-1/4A：AI 批改结果（reveal 后可见；含 review 诊断） */
export type HsMathAiGrade = {
  status?: 'graded' | 'review_required' | string
  totalScore?: number
  maxScore?: number
  rubricScores?: HsMathAiRubricScore[]
  recognizedWork?: string
  errors?: string[]
  personalizedExplanation?: string
  confidence?: number | null
  model?: string
  gradedAt?: string
  reason?: string
  /**
   * APPLICATION-3D-5 / 3E-8 / 4A：识别提示（兼容 string 与结构化 object）。
   */
  recognitionWarnings?: Array<
    | string
    | {
        pageIndex: number
        location: string
        category: string
        severity: string
        description: string
        affectsScoring: boolean
      }
  >
  inputModality?: 'text' | 'image' | 'mixed'
  imageCount?: number
  /** APPLICATION-3E-1 */
  gradingProvider?: 'qwen' | 'deepseek'
  visionModel?: string
  scoringModel?: string
  pipeline?:
    | 'qwen_vision'
    | 'qwen_text'
    | 'deepseek_text'
    | 'qwen_then_deepseek'
}

export type HsMathApplicationRubricItem = {
  key: string
  title: string
  maxScore: number
  criteria: string
}

export type HsMathOptionItem = {
  id: string
  text: string
}

export type HsMathOptionsJson = {
  options: HsMathOptionItem[]
}

/** APPLICATION-2C/2E/3E-1：纯文字 / 纯图片 / 文图混合；text 与 imageIds 至少其一有效 */
export type HsMathApplicationUserAnswer = {
  kind: 'application'
  text?: string
  imageIds?: string[]
  /** 缺省由服务端落 qwen；前端新答默认 qwen */
  gradingProvider?: 'qwen' | 'deepseek'
}

export type HsMathUserAnswerPayload =
  | { kind: 'single'; optionId: string }
  | { kind: 'multi'; optionIds: string[] }
  | { kind: 'judge'; value: boolean }
  | { kind: 'numeric'; input: string }
  | HsMathApplicationUserAnswer

/** APPLICATION-2D：结果/历史页已提交引用图元数据（无 storage_key） */
export type HsMathSubmittedHistoryImage = {
  imageId: string
  mimeType: string
  sortOrder: number
}

/** APPLICATION-2B：列表/上传返回的公开元数据 */
export type HsMathSessionImagePublic = {
  imageId: string
  mimeType: string
  sizeBytes: number
  sortOrder: number
  status: string
  createdAt: string
}

export type HsMathAnswerPayload =
  | { kind: 'single'; optionId: string }
  | { kind: 'multi'; optionIds: string[] }
  | { kind: 'judge'; value: boolean }
  | {
      kind: 'numeric'
      value: string
      toleranceAbs?: number
      toleranceRel?: number
    }
  | {
      kind: 'application'
      standardAnswer: string
      maxScore: number
      rubric: HsMathApplicationRubricItem[]
    }

export type HsMathSessionItemKp = {
  code: string
  name: string
  isPrimary: boolean
}

/** 题目当前有效方法关联（非会话快照） */
export type HsMathSessionItemMethod = {
  code: string
  name: string
  summary: string
  isPrimary: boolean
}

export type HsMathSessionItemDiagram = {
  objectId: string
  sortOrder: number
  altText: string | null
  mimeType: string
  contentSha256: string
}

export type HsMathSessionItem = {
  id: string
  sortOrder: number
  itemId: string | null
  itemCode: string
  qtype: HsMathQtype
  stem: string
  diagrams?: HsMathSessionItemDiagram[]
  optionsJson: HsMathOptionsJson | null
  userAnswerPayloadJson: HsMathUserAnswerPayload | null
  answeredAt: string | null
  contentVersion: number
  gradeRuleVersion: string
  difficulty: number | null
  knowledgePointCodes?: string[] | null
  primaryKnowledgePointCode?: string | null
  knowledgePoints?: HsMathSessionItemKp[]
  /** 当前有效方法关联；无关联为 [] */
  methods?: HsMathSessionItemMethod[]
  answerPayloadJson?: HsMathAnswerPayload | null
  analysis?: string | null
  gradeResult?: HsMathGradeResult | null
  gradeReason?: string | null
  /** APPLICATION-3A：AI 批改结构化结果 */
  aiGrade?: HsMathAiGrade | null
  aiModel?: string | null
  aiGradedAt?: string | null
  /** completed 时应用题已提交引用图（2D） */
  images?: HsMathSubmittedHistoryImage[]
}

export type HsMathSessionDetail = {
  id: string
  status: HsMathSessionStatus
  sessionKind: string
  poolMode: HsMathPool
  difficulty: number
  plannedCount: number
  actualCount: number
  mode: HsMathMode
  answeredCount: number
  correctCount: number | null
  wrongCount: number | null
  pendingCount: number | null
  accuracyPercent: number | null
  durationMs: number | null
  startedAt: string
  submittedAt: string | null
  countsFormalStats: boolean
  gradeRuleVersion: string
  specialtyId: string
  specialtyCode: string | null
  specialtyName: string | null
  /** null = 整章抽题 */
  categoryId: string | null
  categoryCode: string | null
  categoryName: string | null
  /** current_item_link = 题目当前关联，非答题快照 */
  methodsSemantics?: 'current_item_link'
  items: HsMathSessionItem[]
  shortfall?: number
  submitMeta?: { idempotent: boolean }
}

export type CreateHsMathTrainSessionBody = {
  specialtyId: string
  /** 省略 / null = 整章抽题 */
  categoryId?: string | null
  difficulty: 1 | 2 | 3
  count: 5 | 10 | 20
  mode: HsMathMode
  poolMode?: HsMathPool
  /** 未传 = 全部题型；传入则只抽该题型 */
  questionType?: HsMathQtype
  /** 仅真 H3（code LIKE CAND-H3%）；通常配合 difficulty=3 */
  trueH3Only?: boolean
}

export type ListHsMathSessionsQuery = {
  page?: number
  pageSize?: number
  status?: HsMathSessionStatus
  specialtyId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: 'startedAt' | 'submittedAt'
  sortOrder?: 'ASC' | 'DESC'
}

export type HsMathSessionListResult = {
  total: number
  page: number
  pageSize: number
  items: HsMathSessionSummary[]
}

export type HsMathAnalytics = {
  overview: {
    completedSessions: number
    totalQuestions: number
    correctCount: number
    wrongCount: number
    pendingCount: number
    accuracy: number | null
    totalDurationMs: number
    lastTrainingAt: string | null
  }
  bySpecialty: Array<{
    specialtyId: string
    specialtyCode: string | null
    specialtyName: string | null
    sessionCount: number
    questionCount: number
    correctCount: number
    wrongCount: number
    pendingCount: number
    accuracy: number | null
  }>
  byDifficulty: Array<{
    difficulty: number | null
    questionCount: number
    correctCount: number
    wrongCount: number
    pendingCount: number
    accuracy: number | null
  }>
  trend7d: HsMathTrendPoint[]
  trend30d: HsMathTrendPoint[]
  notes: {
    accuracy: string
    timezone: string
    difficulty: string
    specialty: string
  }
}

export async function createHsMathTrainSession(
  body: CreateHsMathTrainSessionBody,
) {
  const { data } = await http.post<ApiSuccess<HsMathSessionDetail>>(
    '/hs-math/train/sessions',
    { ...body, poolMode: body.poolMode ?? 'formal' },
  )
  return data.data
}

export async function getHsMathTrainSession(id: string) {
  const { data } = await http.get<ApiSuccess<HsMathSessionDetail>>(
    `/hs-math/train/sessions/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function saveHsMathTrainAnswer(
  sessionId: string,
  body: {
    sortOrder: number
    userAnswerPayload: HsMathUserAnswerPayload | null
  },
) {
  const { data } = await http.patch<ApiSuccess<HsMathSessionDetail>>(
    `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/answers`,
    body,
  )
  return data.data
}

export async function submitHsMathTrainSession(sessionId: string) {
  const { data } = await http.post<ApiSuccess<HsMathSessionDetail>>(
    `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/submit`,
  )
  return data.data
}

/** APPLICATION-4C-2：应用题重新申请 AI 批改（空 Body） */
export async function regradeHsMathApplicationItem(
  sessionId: string,
  sessionItemId: string,
) {
  const { data } = await http.post<
    ApiSuccess<HsMathSessionDetail & { regradeMeta?: { accepted: boolean } }>
  >(
    `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(sessionItemId)}/regrade`,
  )
  return data.data
}

export async function cancelHsMathTrainSession(sessionId: string) {
  const { data } = await http.post<ApiSuccess<HsMathSessionDetail>>(
    `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/cancel`,
  )
  return data.data
}

export async function listHsMathTrainSessions(params: ListHsMathSessionsQuery) {
  const { data } = await http.get<ApiSuccess<HsMathSessionListResult>>(
    '/hs-math/train/sessions',
    { params },
  )
  return data.data
}

export async function getHsMathAnalytics() {
  const { data } = await http.get<ApiSuccess<HsMathAnalytics>>(
    '/hs-math/train/analytics',
  )
  return data.data
}

// —— APPLICATION-2E：应用题图片 API（JWT；字段名 file）——

function sessionItemImagesBase(sessionId: string, sessionItemId: string) {
  return `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(sessionItemId)}/images`
}

/** DIAGRAM-1B：题干插图鉴权 URL（开训快照 objectId） */
export function hsMathSessionItemDiagramContentUrl(
  sessionId: string,
  sessionItemId: string,
  objectId: string,
) {
  return `/hs-math/train/sessions/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(sessionItemId)}/diagrams/${encodeURIComponent(objectId)}`
}

export async function uploadHsMathSessionItemImage(
  sessionId: string,
  sessionItemId: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<ApiSuccess<HsMathSessionImagePublic>>(
    sessionItemImagesBase(sessionId, sessionItemId),
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 5 * 60 * 1000,
      onUploadProgress: (ev) => {
        if (!onProgress || !ev.total) return
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)))
      },
    },
  )
  return data.data
}

export async function listHsMathSessionItemImages(
  sessionId: string,
  sessionItemId: string,
) {
  const { data } = await http.get<
    ApiSuccess<{ items: HsMathSessionImagePublic[] }>
  >(sessionItemImagesBase(sessionId, sessionItemId))
  return data.data
}

export async function deleteHsMathSessionItemImage(
  sessionId: string,
  sessionItemId: string,
  imageId: string,
) {
  const { data } = await http.delete<
    ApiSuccess<{ deleted: true; imageId: string }>
  >(
    `${sessionItemImagesBase(sessionId, sessionItemId)}/${encodeURIComponent(imageId)}`,
  )
  return data.data
}

/** 鉴权二进制；须配合 createObjectURL，不可直接作 img src */
export async function fetchHsMathSessionItemImageBlob(
  sessionId: string,
  sessionItemId: string,
  imageId: string,
) {
  const { data } = await http.get<Blob>(
    `${sessionItemImagesBase(sessionId, sessionItemId)}/${encodeURIComponent(imageId)}`,
    {
      responseType: 'blob',
      timeout: 60 * 1000,
    },
  )
  return data
}
