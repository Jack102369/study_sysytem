import http, { type ApiSuccess } from './http'
import type { HsMathAnswerPayload, HsMathOptionsJson, HsMathQtype } from './hs-math-train'

export type HsMathItemStatus = 'draft' | 'approved' | 'disabled'
export type HsMathPool = 'formal' | 'test'

export type HsMathAdminSpecialty = {
  id: string
  code: string
  name: string
  bookCode: string | null
  chapterNo: number | null
  intro: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type HsMathAdminCategory = {
  id: string
  specialtyId: string
  code: string
  name: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type HsMathAdminTrainItemKp = {
  id: string
  code: string
  name: string
  isPrimary: boolean
  sortOrder: number
}

export type HsMathSourceType = 'original' | 'adapted' | 'past_exam'
export type HsMathSourceVerification = 'verified' | 'unverified'
export type HsMathSourceLicense =
  | 'permitted'
  | 'unknown'
  | 'restricted'
  | 'forbidden'

export type HsMathAdminMethod = {
  id: string
  code: string
  name: string
  summary: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type HsMathAdminTrainItemMethod = {
  id: string
  code: string
  name: string
  isPrimary: boolean
  sortOrder: number
}

export type HsMathAdminTrainItem = {
  id: string
  code: string
  pool: HsMathPool
  qtype: HsMathQtype
  stem: string
  optionsJson: HsMathOptionsJson | null
  answerPayloadJson: HsMathAnswerPayload
  analysis: string | null
  difficulty: number
  sourceType?: HsMathSourceType
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: HsMathSourceVerification
  sourceLicenseStatus?: HsMathSourceLicense
  specialtyId: string
  categoryId: string
  knowledgePointId: string | null
  status: HsMathItemStatus
  isActive: boolean
  gradeRuleVersion: string
  contentVersion: number
  createdBy: string | null
  updatedBy: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  trainCandidate: boolean
  knowledgePoints?: HsMathAdminTrainItemKp[]
  methods?: HsMathAdminTrainItemMethod[]
}

export type CreateHsMathSpecialtyBody = {
  code: string
  name: string
  bookCode?: string | null
  chapterNo?: number | null
  intro?: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateHsMathSpecialtyBody = Partial<CreateHsMathSpecialtyBody>

export type CreateHsMathCategoryBody = {
  specialtyId: string
  code: string
  name: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateHsMathCategoryBody = Partial<CreateHsMathCategoryBody>

export type CreateHsMathTrainItemBody = {
  code: string
  pool?: HsMathPool
  qtype: HsMathQtype
  stem: string
  optionsJson?: HsMathOptionsJson | null
  answerPayloadJson: HsMathAnswerPayload
  analysis?: string | null
  difficulty?: number
  specialtyId: string
  categoryId: string
  knowledgePointId?: string | null
}

export type UpdateHsMathTrainItemBody = Partial<CreateHsMathTrainItemBody> & {
  sourceType?: HsMathSourceType
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: HsMathSourceVerification
  sourceLicenseStatus?: HsMathSourceLicense
  expectedContentVersion?: number
}

export type CreateHsMathMethodBody = {
  code: string
  name: string
  summary?: string | null
  sortOrder?: number
  isActive?: boolean
}

export type UpdateHsMathMethodBody = {
  name?: string
  summary?: string | null
  sortOrder?: number
  isActive?: boolean
}

export type HsMathSourcePatchBody = {
  sourceType?: HsMathSourceType
  sourceYear?: number | null
  sourceExamName?: string | null
  sourceQuestionNo?: string | null
  sourceReference?: string | null
  sourceAdaptationNote?: string | null
  sourceVerificationStatus?: HsMathSourceVerification
  sourceLicenseStatus?: HsMathSourceLicense
}

export type PutHsMathContentMetaBody = {
  source?: HsMathSourcePatchBody
  methodIds?: string[]
  primaryMethodId?: string | null
  expectedContentVersion?: number
}

export type ListHsMathTrainItemsQuery = {
  page?: number
  pageSize?: number
  pool?: HsMathPool
  status?: HsMathItemStatus
  qtype?: HsMathQtype
  specialtyId?: string
  categoryId?: string
  q?: string
}

export async function listAdminHsMathSpecialties() {
  const { data } = await http.get<ApiSuccess<HsMathAdminSpecialty[]>>(
    '/hs-math/admin/specialties',
  )
  return data.data
}

export async function createAdminHsMathSpecialty(body: CreateHsMathSpecialtyBody) {
  const { data } = await http.post<ApiSuccess<HsMathAdminSpecialty>>(
    '/hs-math/admin/specialties',
    body,
  )
  return data.data
}

export async function updateAdminHsMathSpecialty(
  id: string,
  body: UpdateHsMathSpecialtyBody,
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminSpecialty>>(
    `/hs-math/admin/specialties/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

export async function listAdminHsMathCategories(params?: { specialtyId?: string }) {
  const { data } = await http.get<ApiSuccess<HsMathAdminCategory[]>>(
    '/hs-math/admin/categories',
    { params },
  )
  return data.data
}

export async function createAdminHsMathCategory(body: CreateHsMathCategoryBody) {
  const { data } = await http.post<ApiSuccess<HsMathAdminCategory>>(
    '/hs-math/admin/categories',
    body,
  )
  return data.data
}

export async function updateAdminHsMathCategory(
  id: string,
  body: UpdateHsMathCategoryBody,
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminCategory>>(
    `/hs-math/admin/categories/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

export async function listAdminHsMathTrainItems(params: ListHsMathTrainItemsQuery) {
  const { data } = await http.get<
    ApiSuccess<{
      items: HsMathAdminTrainItem[]
      total: number
      page: number
      pageSize: number
    }>
  >('/hs-math/admin/train-items', { params })
  return data.data
}

export async function getAdminHsMathTrainItem(id: string) {
  const { data } = await http.get<ApiSuccess<HsMathAdminTrainItem>>(
    `/hs-math/admin/train-items/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function createAdminHsMathTrainItem(body: CreateHsMathTrainItemBody) {
  const { data } = await http.post<ApiSuccess<HsMathAdminTrainItem>>(
    '/hs-math/admin/train-items',
    body,
  )
  return data.data
}

export async function updateAdminHsMathTrainItem(
  id: string,
  body: UpdateHsMathTrainItemBody,
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminTrainItem>>(
    `/hs-math/admin/train-items/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

export async function patchAdminHsMathTrainItemStatus(
  id: string,
  status: HsMathItemStatus,
  opts?: { confirmPublish?: boolean },
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminTrainItem>>(
    `/hs-math/admin/train-items/${encodeURIComponent(id)}/status`,
    {
      status,
      ...(status === 'approved' ? { confirmPublish: opts?.confirmPublish === true } : {}),
    },
  )
  return data.data
}

export async function replaceAdminHsMathTrainItemKnowledgePoints(
  id: string,
  body: {
    knowledgePointIds: string[]
    primaryKnowledgePointId?: string | null
    expectedContentVersion?: number
  },
) {
  const { data } = await http.put<ApiSuccess<HsMathAdminTrainItem>>(
    `/hs-math/admin/train-items/${encodeURIComponent(id)}/knowledge-points`,
    body,
  )
  return data.data
}

export async function listAdminHsMathMethods(params?: { activeOnly?: boolean }) {
  const { data } = await http.get<ApiSuccess<{ items: HsMathAdminMethod[] }>>(
    '/hs-math/admin/methods',
    { params },
  )
  return data.data
}

export async function createAdminHsMathMethod(body: CreateHsMathMethodBody) {
  const { data } = await http.post<ApiSuccess<HsMathAdminMethod>>(
    '/hs-math/admin/methods',
    body,
  )
  return data.data
}

export async function updateAdminHsMathMethod(
  id: string,
  body: UpdateHsMathMethodBody,
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminMethod>>(
    `/hs-math/admin/methods/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

export async function replaceAdminHsMathTrainItemMethods(
  id: string,
  body: {
    methodIds: string[]
    primaryMethodId?: string | null
    expectedContentVersion?: number
  },
) {
  const { data } = await http.put<
    ApiSuccess<HsMathAdminTrainItem & { methods: HsMathAdminTrainItemMethod[] }>
  >(`/hs-math/admin/train-items/${encodeURIComponent(id)}/methods`, body)
  return data.data
}

/** 来源 + 方法原子更新（单次 content_version+1） */
export async function putAdminHsMathTrainItemContentMeta(
  id: string,
  body: PutHsMathContentMetaBody,
) {
  const { data } = await http.put<
    ApiSuccess<HsMathAdminTrainItem & { methods: HsMathAdminTrainItemMethod[] }>
  >(`/hs-math/admin/train-items/${encodeURIComponent(id)}/content-meta`, body)
  return data.data
}

export type HsMathAdminKnowledgePoint = {
  id: string
  code: string
  name: string
  specialtyId: string
  categoryId: string
  parentId: string | null
  summary: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreateHsMathKnowledgePointBody = {
  code: string
  name: string
  specialtyId: string
  categoryId: string
  parentId?: string | null
  summary?: string | null
  sortOrder?: number
  isActive?: boolean
}

export type UpdateHsMathKnowledgePointBody =
  Partial<CreateHsMathKnowledgePointBody>

export type ListHsMathAdminKnowledgePointsQuery = {
  page?: number
  pageSize?: number
  specialtyId?: string
  categoryId?: string
  isActive?: boolean
  q?: string
  sortBy?: 'sortOrder' | 'code' | 'name' | 'updatedAt'
  sortDir?: 'ASC' | 'DESC'
}

export async function listAdminHsMathKnowledgePoints(
  params: ListHsMathAdminKnowledgePointsQuery,
) {
  const { data } = await http.get<
    ApiSuccess<{
      items: HsMathAdminKnowledgePoint[]
      total: number
      page: number
      pageSize: number
    }>
  >('/hs-math/admin/knowledge-points', { params })
  return data.data
}

export async function getAdminHsMathKnowledgePoint(id: string) {
  const { data } = await http.get<ApiSuccess<HsMathAdminKnowledgePoint>>(
    `/hs-math/admin/knowledge-points/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function createAdminHsMathKnowledgePoint(
  body: CreateHsMathKnowledgePointBody,
) {
  const { data } = await http.post<ApiSuccess<HsMathAdminKnowledgePoint>>(
    '/hs-math/admin/knowledge-points',
    body,
  )
  return data.data
}

export async function updateAdminHsMathKnowledgePoint(
  id: string,
  body: UpdateHsMathKnowledgePointBody,
) {
  const { data } = await http.patch<ApiSuccess<HsMathAdminKnowledgePoint>>(
    `/hs-math/admin/knowledge-points/${encodeURIComponent(id)}`,
    body,
  )
  return data.data
}

/** P1-0D 批量导入条目（与后端协议一致；用 code 不用 id） */
export type HsMathImportItemPayload = {
  code: string
  specialtyCode: string
  categoryCode: string
  qtype: HsMathQtype
  difficulty: 1 | 2 | 3
  stem: string
  options?: HsMathOptionsJson | null
  answerPayload: HsMathAnswerPayload
  analysis: string
  knowledgePointCodes: string[]
  primaryKnowledgePointCode: string
  pool?: 'formal'
}

export type HsMathImportIssue = {
  level: 'error' | 'warning'
  code: string
  message: string
}

export type HsMathImportItemReport = {
  index: number
  code: string
  ok: boolean
  errors: HsMathImportIssue[]
  warnings: HsMathImportIssue[]
  preview?: HsMathImportItemPayload | null
}

export type HsMathImportPreviewResult = {
  canConfirm: boolean
  previewToken: string | null
  expiresAt: string | null
  itemCount: number
  errorCount: number
  warningCount: number
  items: HsMathImportItemReport[]
  notice: string
}

export type HsMathImportConfirmResult = {
  success: boolean
  mode: 'created' | 'idempotent'
  successCount: number
  failCount: number
  items: Array<{ id: string; code: string; status: string }>
  notice: string
}

export async function previewAdminHsMathTrainItemsImport(
  items: unknown[],
) {
  const { data } = await http.post<ApiSuccess<HsMathImportPreviewResult>>(
    '/hs-math/admin/train-items/import/preview',
    { items },
  )
  return data.data
}

export async function confirmAdminHsMathTrainItemsImport(body: {
  previewToken: string
  items: unknown[]
}) {
  const { data } = await http.post<ApiSuccess<HsMathImportConfirmResult>>(
    '/hs-math/admin/train-items/import/confirm',
    body,
  )
  return data.data
}

/** 人工审核结论（≠ 题目 status） */
export type HsMathReviewDecision = 'passed' | 'rejected' | 'deferred'
export type HsMathQueueReviewStatus =
  | 'none'
  | 'passed'
  | 'rejected'
  | 'deferred'
  | 'stale'

export type HsMathReviewQueueItem = {
  itemId: string
  code: string
  specialty: { id: string; code: string; name: string } | null
  category: { id: string; code: string; name: string } | null
  qtype: HsMathQtype
  difficulty: number
  status: HsMathItemStatus
  pool: HsMathPool
  isActive: boolean
  stemSummary: string
  contentVersion: number
  contentFingerprint: string
  currentReviewStatus: HsMathQueueReviewStatus
  currentReviewer: string | null
  currentReviewerUserId: string | null
  currentReviewedAt: string | null
  reviewIsStale: boolean
  canPublish: boolean
  publishBlockReasons: string[]
}

export type ListHsMathReviewQueueQuery = {
  specialtyId?: string
  categoryId?: string
  qtype?: HsMathQtype
  difficulty?: number
  status?: HsMathItemStatus
  reviewStatus?: HsMathQueueReviewStatus
  keyword?: string
  page?: number
  pageSize?: number
}

export async function fetchReviewQueue(params: ListHsMathReviewQueueQuery) {
  const { data } = await http.get<
    ApiSuccess<{
      items: HsMathReviewQueueItem[]
      total: number
      page: number
      pageSize: number
    }>
  >('/hs-math/admin/train-items/review-queue', { params })
  return data.data
}

export type HsMathReviewPanel = {
  itemId: string
  code: string
  pool: HsMathPool
  qtype: HsMathQtype
  difficulty: number
  status: HsMathItemStatus
  isActive: boolean
  stem: string
  optionsJson: HsMathOptionsJson | null
  answerPayloadJson: HsMathAnswerPayload
  analysis: string | null
  specialty: { id: string; code: string; name: string } | null
  category: { id: string; code: string; name: string } | null
  knowledgePoints: HsMathAdminTrainItemKp[]
  contentVersion: number
  contentFingerprint: string
  currentReviewStatus: HsMathQueueReviewStatus
  reviewIsStale: boolean
  currentReviewerUserId: string | null
  currentReviewerDisplayName: string | null
  currentReviewedAt: string | null
  canPublish: boolean
  publishBlockReasons: string[]
  canSubmitReview: boolean
  submitBlockReasons: string[]
  reviewHistory: Array<{
    id: string
    reviewStatus: HsMathReviewDecision | string
    reviewComment: string
    reviewerUserId: string
    reviewerDisplayName: string
    reviewedAt: string
    contentVersion: number
    contentFingerprint: string
    isStale: boolean
  }>
}

export async function fetchReviewPanel(id: string) {
  const { data } = await http.get<ApiSuccess<HsMathReviewPanel>>(
    `/hs-math/admin/train-items/${encodeURIComponent(id)}/review-panel`,
  )
  return data.data
}

export async function submitTrainItemReview(
  id: string,
  body: {
    decision: HsMathReviewDecision
    comment: string
    expectedContentVersion: number
    expectedContentFingerprint: string
  },
) {
  const { data } = await http.post<
    ApiSuccess<{
      id: string
      itemId: string
      contentVersion: number
      contentFingerprint: string
      reviewStatus: string
      reviewComment: string
      reviewerUserId: string
      reviewedAt: string
      itemStatusUnchanged: string
      notice: string
    }>
  >(`/hs-math/admin/train-items/${encodeURIComponent(id)}/reviews`, body)
  return data.data
}

/** 正式批准：走统一门禁（confirmPublish 必填） */
export async function publishReviewedTrainItem(id: string) {
  return patchAdminHsMathTrainItemStatus(id, 'approved', {
    confirmPublish: true,
  })
}
