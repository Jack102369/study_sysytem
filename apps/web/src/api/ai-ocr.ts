import http, { type ApiSuccess } from './http'

export type AiOcrSubject = 'math' | 'physics' | 'chemistry'
export type AiOcrProvider = 'qwen' | 'deepseek'
export type AiOcrStatus = 'pending' | 'succeeded' | 'failed'
export type AiOcrVerdict = 'correct' | 'partial' | 'wrong' | 'no_answer'
export type AiOcrCompareVerdict = 'agree' | 'differ' | 'uncertain'

export type AiOcrRecognition = {
  id: string
  subject: AiOcrSubject
  attachmentId: string
  attachmentUrl: string | null
  status: AiOcrStatus
  recognizedTextRaw: string | null
  engine: string | null
  model: string | null
  promptVersion: string | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type AiOcrAnalysis = {
  id: string
  recognitionId: string
  provider: AiOcrProvider
  status: AiOcrStatus
  inputTextSnapshot: string | null
  aiAnswerText: string | null
  aiAnalysisText: string | null
  knowledgePointsText: string | null
  methodSummaryText: string | null
  selfCheckText: string | null
  comparedAnalysisId: string | null
  compareVerdict: AiOcrCompareVerdict | null
  compareNote: string | null
  revisedByCompare: boolean
  model: string | null
  promptVersion: string | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type AiOcrGrading = {
  id: string
  recognitionId: string
  provider: AiOcrProvider
  status: AiOcrStatus
  answerAttachmentId: string | null
  studentAnswerRaw: string | null
  studentAnswerSnapshot: string | null
  questionTextSnapshot: string
  score: number | null
  verdict: AiOcrVerdict | null
  feedbackText: string | null
  correctAnswerText: string | null
  correctAnalysisText: string | null
  model: string | null
  promptVersion: string | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export type AiOcrPage<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

const LONG_TIMEOUT = 5 * 60 * 1000

export async function listAiOcrRecognitions(params?: {
  subject?: AiOcrSubject
  page?: number
  pageSize?: number
}) {
  const { data } = await http.get<ApiSuccess<AiOcrPage<AiOcrRecognition>>>(
    '/ai-ocr/recognitions',
    { params },
  )
  return data.data
}

export async function getAiOcrRecognition(recognitionId: string) {
  const { data } = await http.get<ApiSuccess<AiOcrRecognition>>(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}`,
  )
  return data.data
}

export async function createAiOcrRecognition(body: {
  subject: AiOcrSubject
  attachmentId: string
  consentAccepted: true
}) {
  const { data } = await http.post<ApiSuccess<AiOcrRecognition>>(
    '/ai-ocr/recognitions',
    body,
    { timeout: LONG_TIMEOUT },
  )
  return data.data
}

export async function listAiOcrAnalyses(
  recognitionId: string,
  params?: { page?: number; pageSize?: number },
) {
  const { data } = await http.get<ApiSuccess<AiOcrPage<AiOcrAnalysis>>>(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}/analyses`,
    { params },
  )
  return data.data
}

export async function createAiOcrAnalysis(
  recognitionId: string,
  body: {
    provider: AiOcrProvider
    inputText?: string
    consentAccepted: true
  },
) {
  const { data } = await http.post<ApiSuccess<AiOcrAnalysis>>(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}/analyses`,
    body,
    { timeout: LONG_TIMEOUT },
  )
  return data.data
}

export async function deleteAiOcrAnalysis(
  recognitionId: string,
  analysisId: string,
) {
  const { data } = await http.delete<
    ApiSuccess<{ deleted: true; id: string }>
  >(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}/analyses/${encodeURIComponent(analysisId)}`,
  )
  return data.data
}

export async function listAiOcrGradings(
  recognitionId: string,
  params?: { page?: number; pageSize?: number },
) {
  const { data } = await http.get<ApiSuccess<AiOcrPage<AiOcrGrading>>>(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}/gradings`,
    { params },
  )
  return data.data
}

export async function createAiOcrGrading(
  recognitionId: string,
  body: {
    provider: AiOcrProvider
    questionText?: string
    studentAnswerText?: string
    answerAttachmentId?: string
    consentAccepted: true
  },
) {
  const { data } = await http.post<ApiSuccess<AiOcrGrading>>(
    `/ai-ocr/recognitions/${encodeURIComponent(recognitionId)}/gradings`,
    body,
    { timeout: LONG_TIMEOUT },
  )
  return data.data
}
