export const PET_SKIN_IDS = [
  'robin',
  'trex',
  'fox',
  'panda',
  'cat',
  'owl',
] as const

export type PetSkinId = (typeof PET_SKIN_IDS)[number]

export type PetSkinDef = {
  id: PetSkinId
  name: string
  /** 默认唤醒词 */
  defaultWakeWord: string
  /** 语音变身别名 */
  aliases: string[]
  /** 预览色 */
  accent: string
  emoji: string
  /** public 下 VRM 路径，如 models/character.vrm */
  vrm: string
}

const DEFAULT_VRM = 'models/character.vrm'

export const PET_SKINS: PetSkinDef[] = [
  {
    id: 'robin',
    name: '知更鸟',
    defaultWakeWord: '知更鸟',
    aliases: ['知更鸟', '小鸟', '罗宾', '歌者'],
    accent: '#7e57c2',
    emoji: '🐦',
    vrm: DEFAULT_VRM,
  },
  {
    id: 'trex',
    name: '霸王龙',
    defaultWakeWord: '霸王龙',
    aliases: ['霸王龙', '恐龙', '小霸王'],
    accent: '#8d6e63',
    emoji: '🦖',
    vrm: DEFAULT_VRM,
  },
  {
    id: 'fox',
    name: '小狐',
    defaultWakeWord: '小狐',
    aliases: ['小狐', '狐狸', '狐狐'],
    accent: '#e67e22',
    emoji: '🦊',
    vrm: DEFAULT_VRM,
  },
  {
    id: 'panda',
    name: '团子熊',
    defaultWakeWord: '团子熊',
    aliases: ['团子熊', '熊猫', '熊熊', '团子'],
    accent: '#5d6d7e',
    emoji: '🐼',
    vrm: DEFAULT_VRM,
  },
  {
    id: 'cat',
    name: '夜猫',
    defaultWakeWord: '夜猫',
    aliases: ['夜猫', '猫咪', '喵喵'],
    accent: '#8e44ad',
    emoji: '🐱',
    vrm: DEFAULT_VRM,
  },
  {
    id: 'owl',
    name: '智鸮',
    defaultWakeWord: '智鸮',
    aliases: ['智鸮', '猫头鹰', '鸮鸮'],
    accent: '#1a5276',
    emoji: '🦉',
    vrm: DEFAULT_VRM,
  },
]

export const DEFAULT_PET_SKIN: PetSkinId = 'robin'

export function getSkin(id: string): PetSkinDef {
  return PET_SKINS.find((s) => s.id === id) || PET_SKINS[0]
}

export function isPetSkinId(v: string): v is PetSkinId {
  return (PET_SKIN_IDS as readonly string[]).includes(v)
}

/** 从「变身为XXX」文本解析皮肤 */
export function matchSkinFromTransform(text: string): PetSkinDef | null {
  const t = text.replace(/\s+/g, '')
  const m = t.match(/(?:变身为?|变成|切换成|换成)(.+)$/)
  const name = (m?.[1] || '').trim()
  if (!name) return null
  for (const skin of PET_SKINS) {
    if (skin.name === name || skin.aliases.includes(name)) return skin
  }
  for (const skin of PET_SKINS) {
    if (skin.aliases.some((a) => name.includes(a) || a.includes(name))) return skin
  }
  return null
}

export function listSkinNames(): string {
  return PET_SKINS.map((s) => s.name).join('、')
}

export function resolveVrmUrl(vrmPath: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = vrmPath.replace(/^\//, '')
  return `${base}${normalized}`
}
