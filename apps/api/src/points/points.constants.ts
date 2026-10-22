/** 积分规则（只加不扣） */
export const POINT_RULES = {
  assessment_create: { points: 20, dailyMax: 2, reason: 'assessment_create' },
  assessment_subject_up: { points: 10, dailyMax: 20, reason: 'assessment_subject_up' },
  review_attempt: { points: 5, dailyMax: 30, reason: 'review_attempt' },
  error_mastered: { points: 15, dailyMax: 20, reason: 'error_mastered' },
  attempt_correct: { points: 8, dailyMax: 20, reason: 'attempt_correct' },
  listening_create: { points: 8, dailyMax: 3, reason: 'listening_create' },
  writing_review: { points: 12, dailyMax: 2, reason: 'writing_review' },
  extension_create: { points: 6, dailyMax: 5, reason: 'extension_create' },
  knowledge_card_create: { points: 8, dailyMax: 5, reason: 'knowledge_card_create' },
  knowledge_card_review: { points: 4, dailyMax: 20, reason: 'knowledge_card_review' },
} as const

export type PointReason = keyof typeof POINT_RULES

export const DAILY_POINTS_CAP = 80

export const DEFAULT_REWARD_TIERS = [
  { pointsNeeded: 100, title: '初露锋芒', rewardNote: '', sortOrder: 1 },
  { pointsNeeded: 300, title: '稳步向前', rewardNote: '', sortOrder: 2 },
  { pointsNeeded: 800, title: '错题克星', rewardNote: '', sortOrder: 3 },
  { pointsNeeded: 1500, title: '学霸预备役', rewardNote: '', sortOrder: 4 },
] as const

export const REASON_LABELS: Record<string, string> = {
  assessment_create: '录入考试',
  assessment_subject_up: '单科进步',
  review_attempt: '完成复习再练',
  error_mastered: '错题已掌握',
  attempt_correct: '再练答对',
  listening_create: '生成听力',
  writing_review: '写作评测',
  extension_create: '延伸训练',
  knowledge_card_create: '新建知识卡片',
  knowledge_card_review: '知识卡片复习',
}
