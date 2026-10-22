import type { PetEventType } from './scripts'

export type PetAction =
  | 'idle'
  | 'greet'
  | 'talk'
  | 'think'
  | 'cheer'
  | 'comfort'
  | 'transform'
  | 'listen'
  | 'wave'
  | 'nod'
  | 'roar'
  /** 全屏庆祝：转身跳舞（配合 PetCelebration） */
  | 'celebrate'

export const EVENT_TO_ACTION: Record<PetEventType, PetAction> = {
  welcome: 'greet',
  attempt_correct: 'cheer',
  attempt_wrong: 'comfort',
  mastered: 'roar',
  reward_unlock: 'cheer',
  knowledge_saved: 'nod',
  transform: 'transform',
}

export const ACTION_DURATION_MS: Partial<Record<PetAction, number>> = {
  greet: 2200,
  cheer: 1800,
  comfort: 1800,
  transform: 900,
  listen: 2100,
  wave: 2200,
  nod: 1400,
  roar: 1800,
  /** 略长于语音，收起由编排层控制；此值作兜底回 idle */
  celebrate: 6200,
  talk: 0,
  think: 0,
  idle: 0,
}
