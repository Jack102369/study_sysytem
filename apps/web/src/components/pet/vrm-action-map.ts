import type { PetAction } from './event-map'

/** VRM ExpressionPreset 常用名（模型缺失则跳过） */
export type VrmEmotion =
  | 'neutral'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'relaxed'

export type VrmActionFx = {
  emotion: VrmEmotion
  /** 相对强度 0–1 */
  weight: number
  /** 轻微低头（思考） */
  lookDown?: boolean
  /** 轻微嘴型开合（说话） */
  mouthTalk?: boolean
}

const CLICK_CYCLE: VrmEmotion[] = [
  'happy',
  'surprised',
  'angry',
  'sad',
  'relaxed',
  'neutral',
]

export function nextClickEmotion(prev: VrmEmotion | null): VrmEmotion {
  if (!prev) return CLICK_CYCLE[0]
  const i = CLICK_CYCLE.indexOf(prev)
  return CLICK_CYCLE[(i + 1) % CLICK_CYCLE.length]
}

export function mapPetActionToVrm(action: PetAction): VrmActionFx {
  switch (action) {
    case 'cheer':
    case 'celebrate':
    case 'roar':
    case 'greet':
    case 'wave':
      return { emotion: 'happy', weight: 0.95 }
    case 'comfort':
      return { emotion: 'sad', weight: 0.7 }
    case 'think':
      return { emotion: 'relaxed', weight: 0.35, lookDown: true }
    case 'talk':
      return { emotion: 'happy', weight: 0.4, mouthTalk: true }
    case 'listen':
    case 'nod':
      return { emotion: 'relaxed', weight: 0.45 }
    case 'transform':
      return { emotion: 'surprised', weight: 0.9 }
    case 'idle':
    default:
      return { emotion: 'neutral', weight: 0 }
  }
}

export const EMOTION_PRESETS: VrmEmotion[] = [
  'neutral',
  'happy',
  'angry',
  'sad',
  'surprised',
  'relaxed',
]
