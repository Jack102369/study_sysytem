/** 内置可选 Piper 英文音色（key = 模型文件名前缀，不含扩展名） */
export const PIPER_VOICE_CATALOG = [
  {
    key: 'en_GB-alba-medium',
    label: '英式女声 · Alba',
    gender: 'female',
    locale: 'en-GB',
  },
  {
    key: 'en_GB-alan-medium',
    label: '英式男声 · Alan',
    gender: 'male',
    locale: 'en-GB',
  },
] as const

export type PiperVoiceKey = (typeof PIPER_VOICE_CATALOG)[number]['key']

export const PIPER_VOICE_KEYS = PIPER_VOICE_CATALOG.map((v) => v.key)

export const DEFAULT_PIPER_VOICE_KEY: PiperVoiceKey = 'en_GB-alba-medium'
