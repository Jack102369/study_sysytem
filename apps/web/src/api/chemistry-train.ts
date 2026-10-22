import http, { type ApiSuccess } from './http'

export type TrainPoolMode = 'formal' | 'test'
export type TrainMode = 'sequential' | 'random'
export type TrainQtype = 'single' | 'judge' | 'blank'
export type TrainAnswerType =
  | 'text'
  | 'chem_formula'
  | 'equation'
  | 'ionic'
  | 'numeric'

export type TrainAvailability = {
  specialtyCode: string
  specialtyName: string
  categoryCode: string
  categoryName: string
  difficulty: number
  difficultyLabel: string
  poolMode: TrainPoolMode
  availableCount: number
  emptyMessage: string | null
}

export type TrainSessionKind =
  | 'specialty'
  | 'daily'
  | 'advanced'
  | 'wrong_review'
  | 'wrong_variation'

export type TrainSessionItem = {
  id: string
  sortOrder: number
  qtype: TrainQtype
  answerType?: TrainAnswerType
  stem: string
  options: { key: string; text: string }[] | null
  userAnswer: string | null
  answered: boolean
  gradeResult?: 'correct' | 'wrong' | 'pending_review' | null
  gradeReason?: string | null
  standardAnswer?: string
  answerAliases?: string[] | null
  analysis?: string | null
  specialtyCode?: string
  specialtyName?: string
  categoryCode?: string
  categoryName?: string
  itemDifficulty?: number
}

export type AdvancedDifficultyMode = 'raise' | 'challenge' | 'mix'
export type AdvancedItemScope = 'all' | 's60'

export type AdvancedAvailability = {
  sessionKind: 'advanced'
  specialtyCode: string
  specialtyName: string
  categoryCode: string
  categoryName: string
  difficultyMode: AdvancedDifficultyMode
  difficultyLabel: string
  itemScope: AdvancedItemScope
  poolMode: TrainPoolMode
  raiseCount: number
  challengeCount: number
  mixCount: number
  availableCount: number
  plannedHint?: string
  emptyMessage: string | null
}

export type TrainSessionDetail = {
  id: string
  status: 'in_progress' | 'completed' | 'cancelled'
  sessionKind?: TrainSessionKind
  dailyDate?: string | null
  poolMode: TrainPoolMode
  countsFormalStats: boolean
  sourceWrongItemId?: string | null
  specialtyCode?: string
  specialtyName?: string
  categoryCode?: string
  categoryName?: string
  difficulty: number
  difficultyLabel: string
  mode: TrainMode
  plannedCount: number
  actualCount: number
  answeredCount: number
  correctCount: number
  wrongCount: number
  pendingCount: number
  accuracyPercent: number | null
  accuracyNote: string | null
  durationMs: number
  durationNote?: string
  startedAt: string
  submittedAt: string | null
  items: TrainSessionItem[]
  submitMeta?: {
    unansweredBeforeSubmit: number
    idempotent: boolean
    countsFormalStats: boolean
    note: string
  }
  pickMeta?: {
    planned: number
    actual: number
    shortfall: string | null
    difficultyMix?: { basic: number; raise: number; challenge?: number }
    difficultyMode?: AdvancedDifficultyMode
    itemScope?: AdvancedItemScope
    skippedIneligible?: number
    sessionKind?: TrainSessionKind
    countsDailyCompletion?: boolean
    sourceWrongItemId?: string
    note?: string
  }
}

export type ChemWrongSummary = {
  openCount: number
  consolidatingCount: number
  masteredCount: number
  dueTodayCount: number
  recentNewCount: number
  totalWrongItems: number
  topWeakSpecialties: ChemWrongWeakItem[]
  rules: {
    masterMinCorrect: number
    masterGapDays: number
    consolidatingDueDays: number
    dueTodayNote: string
  }
}

export type ChemWrongListItem = {
  id: string
  itemId: string
  status: string
  statusLabel: string
  wrongCount: number
  lastWrongAt: string
  firstWrongAt: string
  lastGradeResult: string | null
  lastPracticedAt: string | null
  dueToday: boolean
  practiceEligible: boolean
  stemPreview: string
  specialtyCode: string | null
  specialtyName: string | null
  categoryCode: string | null
  categoryName: string | null
  difficulty: number
  difficultyLabel: string
  difficultyBand: string
  itemActive: boolean
  itemBlocked: boolean
  code: string | null
}

export type ChemWrongWeakItem = {
  granularity: string
  specialtyCode: string | null
  specialtyName: string | null
  categoryCode: string | null
  categoryName: string | null
  totalAttempts: number
  correctCount: number
  wrongCount: number
  accuracyPercent: number | null
  openOrConsolidatingWrongItems: number
  lastWrongAt: string | null
}

export type ChemWrongDetail = {
  id: string
  itemId: string
  status: string
  statusLabel: string
  wrongCount: number
  correctAfterWrongCount: number
  firstWrongAt: string
  lastWrongAt: string
  lastCorrectAt: string | null
  lastGradeResult: string | null
  dueToday: boolean
  practiceEligible: boolean
  practiceBlockReason: string | null
  specialtyCode: string | null
  specialtyName: string | null
  categoryCode: string | null
  categoryName: string | null
  difficulty: number | null
  difficultyLabel: string | null
  code: string | null
  currentStem: string | null
  currentAnalysis: string | null
  currentAnalysisNote: string
  knowledgeLinks: Array<{ entityType: string; entityId: string }>
  history: Array<{
    sessionItemId: string
    sessionId: string
    sessionKind: string
    occurredAt: string
    userAnswer: string | null
    standardAnswerSnapshot: string | null
    analysisSnapshot: string | null
    stemSnapshot: string | null
    optionsSnapshot: unknown
    gradeResult: string | null
  }>
  eventCount: number
  masteryRules: {
    masterMinCorrect: number
    masterGapDays: number
    note: string
  }
  methodSummary?: {
    available: boolean
    disclaimer: string
    source: string | null
    knowledgePoints: string | null
    breakthrough: string | null
    keyConditions: string | null
    coreMethod: string | null
    commonMistakes: string | null
    similarRecognition: string | null
  }
  variationPreview?: {
    candidateCount: number
    emptyHint: string | null
    items: Array<{
      itemId: string
      code: string
      stemPreview: string
      tier: string
      tierLabel: string
      reason: string
      mechanicalDup: boolean
      modelId: string | null
    }>
    rulesNote: string
    catalogLoaded: boolean
  }
}

export type ChemDailyStatus = {
  timezone: string
  today: string
  canTrain: boolean
  canUseTestPool: boolean
  poolMode: TrainPoolMode
  candidateCount: number
  targetCount: number
  estimatedMinutes: number
  todayCompletedOnce: boolean
  todayCompletedCount: number
  inProgressSessionId: string | null
  inProgressAnswered: number
  inProgressActual: number
  aiTrialNotice: string | null
  emptyHint: string | null
  durationNote: string
}

export type ChemDailyInsight = {
  involvedKnowledge: string[]
  wrongKnowledge: string[]
  reviewTip: string
  durationNote: string
}

export type ChemDailyHistory = {
  timezone: string
  total: number
  page: number
  pageSize: number
  durationNote: string
  days: Array<{
    date: string
    completedCount: number
    sessions: Array<{
      id: string
      actualCount: number
      correctCount: number
      wrongCount: number
      pendingCount: number
      accuracyPercent: number | null
      durationMs: number
      startedAt: string
      submittedAt: string | null
    }>
  }>
}

export type TrainSessionSummary = {
  id: string
  status: string
  sessionKind?: TrainSessionKind
  poolMode: TrainPoolMode
  countsFormalStats: boolean
  specialtyCode?: string
  specialtyName?: string
  categoryCode?: string
  categoryName?: string
  difficulty: number
  difficultyLabel: string
  plannedCount: number
  actualCount: number
  correctCount: number
  wrongCount: number
  pendingCount: number
  accuracyPercent: number | null
  startedAt: string
  submittedAt: string | null
  durationMs: number
}

export async function getChemTrainTestAccess() {
  const { data } = await http.get<ApiSuccess<{ canUseTestPool: boolean }>>(
    '/chemistry/train/test-access',
  )
  return data.data
}

export async function getChemTrainAvailability(params: {
  specialtyCode: string
  categoryCode: string
  difficulty: number
  poolMode?: TrainPoolMode
}) {
  const { data } = await http.get<ApiSuccess<TrainAvailability>>(
    '/chemistry/train/availability',
    { params },
  )
  return data.data
}

export async function createChemTrainSession(body: {
  specialtyCode: string
  categoryCode: string
  difficulty: number
  count: 5 | 10 | 20
  mode: TrainMode
  poolMode?: TrainPoolMode
}) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    '/chemistry/train/sessions',
    body,
  )
  return data.data
}

export async function listChemTrainSessions(params?: {
  page?: number
  pageSize?: number
  poolFilter?: 'formal' | 'test' | 'all'
  kindFilter?: TrainSessionKind | 'all'
}) {
  const { data } = await http.get<
    ApiSuccess<{
      total: number
      page: number
      pageSize: number
      items: TrainSessionSummary[]
    }>
  >('/chemistry/train/sessions', { params })
  return data.data
}

export async function getChemAdvancedAvailability(params: {
  specialtyCode?: string
  categoryCode?: string
  difficultyMode: AdvancedDifficultyMode
  itemScope?: AdvancedItemScope
  poolMode?: TrainPoolMode
}) {
  const { data } = await http.get<ApiSuccess<AdvancedAvailability>>(
    '/chemistry/train/advanced/availability',
    { params },
  )
  return data.data
}

export async function createChemAdvancedSession(body: {
  specialtyCode?: string
  categoryCode?: string
  difficultyMode: AdvancedDifficultyMode
  itemScope?: AdvancedItemScope
  count: 5 | 10 | 20
  mode: TrainMode
  poolMode?: TrainPoolMode
}) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    '/chemistry/train/advanced/sessions',
    body,
  )
  return data.data
}

export async function getChemTrainSession(id: string) {
  const { data } = await http.get<ApiSuccess<TrainSessionDetail>>(
    `/chemistry/train/sessions/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function saveChemTrainAnswer(
  id: string,
  body: { sortOrder: number; answer: string },
) {
  const { data } = await http.patch<ApiSuccess<TrainSessionDetail>>(
    `/chemistry/train/sessions/${encodeURIComponent(id)}/answers`,
    body,
  )
  return data.data
}

export async function submitChemTrainSession(id: string) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    `/chemistry/train/sessions/${encodeURIComponent(id)}/submit`,
  )
  return data.data
}

export async function cancelChemTrainSession(id: string) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    `/chemistry/train/sessions/${encodeURIComponent(id)}/cancel`,
  )
  return data.data
}

export async function getChemDailyStatus() {
  const { data } = await http.get<ApiSuccess<ChemDailyStatus>>(
    '/chemistry/train/daily/status',
  )
  return data.data
}

export async function createChemDailySession() {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    '/chemistry/train/daily/sessions',
  )
  return data.data
}

export async function listChemDailyHistory(params?: {
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiSuccess<ChemDailyHistory>>(
    '/chemistry/train/daily/history',
    { params },
  )
  return data.data
}

export async function getChemDailyInsight(sessionId: string) {
  const { data } = await http.get<ApiSuccess<ChemDailyInsight>>(
    `/chemistry/train/daily/sessions/${encodeURIComponent(sessionId)}/insight`,
  )
  return data.data
}

export type ChemLearningHome = {
  timezone: string
  today: string
  title: string
  daily: ChemDailyStatus & {
    phase: 'not_started' | 'in_progress' | 'completed'
  }
  wrong: {
    openCount: number
    consolidatingCount: number
    consolidatingDueTodayCount: number
    masteredCount: number
    dueTodayCount: number
    recentNewCount: number
    topWeakSpecialties: ChemWrongWeakItem[]
    rules: ChemWrongSummary['rules']
  }
  activityToday: {
    submittedSessions: number
    practicedItems: number
    gradedItems: number
    correctCount: number
    wrongCount: number
    pendingReviewCount: number
    accuracyPercent: number | null
    note: string
  }
  activity7d: {
    submittedSessions: number
    practicedItems: number
    gradedItems: number
    correctCount: number
    wrongCount: number
    pendingReviewCount: number
    accuracyPercent: number | null
    windowStart: string
    windowEnd: string
    windowNote: string
    masteredWrongItemsLabel: string
    masteredWrongItems: number
    newWrongItems: number
    note: string
  }
  recommendAdvanced: {
    specialtyCode: string | null
    specialtyName: string | null
    difficultyMode: 'raise' | 'challenge' | 'mix' | null
    raiseCount: number
    challengeCount: number
    availableCount: number
    poolMode: TrainPoolMode
    reason: string | null
    defaultCountHint: number
    shortfallHint: string | null
    path: string
    emptyHint: string | null
  }
  variation: {
    entryOnly: boolean
    note: string
    path: string
  }
  taskOrder: string[]
  taskOrderNote: string
}

export async function getChemLearningHome() {
  const { data } = await http.get<ApiSuccess<ChemLearningHome>>(
    '/chemistry/train/learning-home',
  )
  return data.data
}

export type ChemAnalyticsDay = {
  date: string
  submittedSessions: number
  practicedItems: number
  correctCount: number
  wrongCount: number
  pendingReviewCount: number
  accuracyPercent: number | null
}

export type ChemAnalyticsSpecialty = {
  specialtyId: string
  specialtyCode: string | null
  specialtyName: string
  practicedItems: number
  correctCount: number
  wrongCount: number
  pendingReviewCount: number
  gradedItems: number
  accuracyPercent: number | null
  empty: boolean
  sampleLow: boolean
  sampleNote: string | null
}

export type ChemAnalyticsDifficulty = {
  key: string
  label: string
  difficulty: number | null
  practicedItems: number
  correctCount: number
  wrongCount: number
  pendingReviewCount: number
  gradedItems: number
  accuracyPercent: number | null
  empty: boolean
  sampleLow: boolean
  sampleNote: string | null
}

export type ChemAnalytics = {
  timezone: string
  today: string
  days: 7 | 30
  windowStart: string
  windowEnd: string
  calendarStart: string
  calendarEnd: string
  attribution: {
    specialty: string
    difficulty: string
    note: string
  }
  notes: string[]
  overview: {
    submittedSessions: number
    practicedItems: number
    correctCount: number
    wrongCount: number
    pendingReviewCount: number
    accuracyPercent: number | null
    accuracyNote: string
  }
  calendar: ChemAnalyticsDay[]
  trend: ChemAnalyticsDay[]
  specialties: {
    title: string
    titleNote: string
    items: ChemAnalyticsSpecialty[]
  }
  difficulties: {
    title: string
    items: ChemAnalyticsDifficulty[]
  }
  wrongStatus: {
    openCount: number
    consolidatingCount: number
    masteredCount: number
    dueTodayCount: number
    totalWrongItems: number
    note: string
  }
  topWrongSpecialties: {
    title: string
    titleNote: string
    items: Array<{
      specialtyId: string
      specialtyCode: string | null
      specialtyName: string
      wrongCount: number
      practicedItems: number
      gradedItems: number
      errorRatePercent: number | null
      openWrongCount: number
      sampleLow: boolean
      sampleNote: string | null
    }>
  }
  suggestions: Array<{
    id: string
    reason: string
    cta: string
    path: string
    priority: number
  }>
}

export async function getChemAnalytics(days: 7 | 30 = 30) {
  const { data } = await http.get<ApiSuccess<ChemAnalytics>>(
    '/chemistry/train/analytics',
    { params: { days } },
  )
  return data.data
}

export async function getChemWrongSummary() {
  const { data } = await http.get<ApiSuccess<ChemWrongSummary>>(
    '/chemistry/train/wrong-questions/summary',
  )
  return data.data
}

export async function listChemWrongQuestions(params?: {
  status?: string
  dueToday?: string
  specialtyCode?: string
  categoryCode?: string
  difficultyBand?: string
  sort?: string
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<
    ApiSuccess<{
      total: number
      page: number
      pageSize: number
      items: ChemWrongListItem[]
    }>
  >('/chemistry/train/wrong-questions', { params })
  return data.data
}

export async function getChemWrongDetail(id: string) {
  const { data } = await http.get<ApiSuccess<ChemWrongDetail>>(
    `/chemistry/train/wrong-questions/${encodeURIComponent(id)}`,
  )
  return data.data
}

export async function getChemWrongWeakStats(limit = 20) {
  const { data } = await http.get<
    ApiSuccess<{ note: string; items: ChemWrongWeakItem[] }>
  >('/chemistry/train/wrong-questions/weak-stats', { params: { limit } })
  return data.data
}

export async function createChemWrongPractice(count: 5 | 10 | 20) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    '/chemistry/train/wrong-questions/practice',
    { count },
  )
  return data.data
}

export async function createChemWrongVariationPractice(
  wrongItemId: string,
  count: 5 | 10 | 20,
) {
  const { data } = await http.post<ApiSuccess<TrainSessionDetail>>(
    `/chemistry/train/wrong-questions/${encodeURIComponent(wrongItemId)}/variation-practice`,
    { count },
  )
  return data.data
}

export async function rebuildChemWrongBook() {
  const { data } = await http.post<
    ApiSuccess<{ itemCount: number; eventSourceRows: number; rebuiltAt: string }>
  >('/chemistry/train/wrong-questions/rebuild')
  return data.data
}
