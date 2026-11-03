export const AI_OCR_SUBJECTS = ['math', 'physics', 'chemistry'] as const
export type AiOcrSubject = (typeof AI_OCR_SUBJECTS)[number]

export const AI_OCR_RECOGNITION_STATUSES = [
  'pending',
  'succeeded',
  'failed',
] as const
export type AiOcrRecognitionStatus =
  (typeof AI_OCR_RECOGNITION_STATUSES)[number]

export const AI_OCR_ANALYSIS_STATUSES = [
  'pending',
  'succeeded',
  'failed',
] as const
export type AiOcrAnalysisStatus = (typeof AI_OCR_ANALYSIS_STATUSES)[number]

export const AI_OCR_PROVIDERS = ['qwen', 'deepseek'] as const
export type AiOcrProvider = (typeof AI_OCR_PROVIDERS)[number]

export const AI_OCR_GRADING_STATUSES = [
  'pending',
  'succeeded',
  'failed',
] as const
export type AiOcrGradingStatus = (typeof AI_OCR_GRADING_STATUSES)[number]

export const AI_OCR_VERDICTS = [
  'correct',
  'partial',
  'wrong',
  'no_answer',
] as const
export type AiOcrVerdict = (typeof AI_OCR_VERDICTS)[number]

export const AI_OCR_COMPARE_VERDICTS = ['agree', 'differ', 'uncertain'] as const
export type AiOcrCompareVerdict = (typeof AI_OCR_COMPARE_VERDICTS)[number]

export const AI_OCR_RECOG_PROMPT_VERSION = 'ai-ocr-recog-v1'
export const AI_OCR_PARSE_PROMPT_VERSION = 'ai-ocr-parse-v9'
export const AI_OCR_COMPARE_PROMPT_VERSION = 'ai-ocr-compare-v4'
export const AI_OCR_GRADE_PROMPT_VERSION = 'ai-ocr-grade-v2'
export const AI_OCR_INPUT_TEXT_MAX_CHARS = 6000
