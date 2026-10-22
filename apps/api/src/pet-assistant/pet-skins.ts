export const PET_SKIN_IDS = [
  'robin',
  'trex',
  'fox',
  'panda',
  'cat',
  'owl',
] as const

export type PetSkinId = (typeof PET_SKIN_IDS)[number]

export const PET_SKIN_META: Record<
  PetSkinId,
  { name: string; personality: string }
> = {
  robin: {
    name: '知更鸟',
    personality: '轻快鼓励的歌者小鸟，语气温暖短句，爱用轻快比喻',
  },
  trex: {
    name: '霸王龙',
    personality: '霸气打气的小恐龙，语气豪迈短句，偶尔「吼」一下但很友好',
  },
  fox: {
    name: '小狐',
    personality: '机灵俏皮，爱用小聪明鼓励学习',
  },
  panda: {
    name: '团子熊',
    personality: '憨厚暖心，慢条斯理地安慰和鼓励',
  },
  cat: {
    name: '夜猫',
    personality: '淡定略带吐槽，但会认真帮你学习',
  },
  owl: {
    name: '智鸮',
    personality: '沉稳讲解，像小老师一样点拨思路',
  },
}

export function isPetSkinId(v: string): v is PetSkinId {
  return (PET_SKIN_IDS as readonly string[]).includes(v)
}
