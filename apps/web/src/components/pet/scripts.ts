import type { PetSkinId } from './skins'

export type PetEventType =
  | 'welcome'
  | 'attempt_correct'
  | 'attempt_wrong'
  | 'mastered'
  | 'reward_unlock'
  | 'knowledge_saved'
  | 'transform'

const COMMON: Record<PetEventType, string[]> = {
  welcome: [
    '欢迎回来！今天也一起加油～',
    '嗨，我在这儿陪你学习哦。',
    '新的一天，从一道小错题开始？',
  ],
  attempt_correct: [
    '做对啦，给你比个心！',
    '这题稳了，继续保持！',
    '厉害！错题又少一道～',
    '答对了，节奏很好！',
  ],
  attempt_wrong: [
    '没关系，错了才记得牢。',
    '先记下这题，下次一定行。',
    '别灰心，我们再练一遍。',
  ],
  mastered: [
    '这题掌握了，太棒了！',
    '收入囊中！离目标又近一步。',
  ],
  reward_unlock: [
    '奖励档解锁啦，庆祝一下！',
    '积分到档了，继续冲～',
  ],
  knowledge_saved: [
    '公式收进库啦，复习用得上。',
    '记好这条，下次秒杀同型题！',
  ],
  transform: ['变身成功～', '换好装了！'],
}

const BY_SKIN: Partial<Record<PetSkinId, Partial<Record<PetEventType, string[]>>>> = {
  robin: {
    welcome: ['♪ 欢迎回来，今天也一起唱着学吧～', '嗨，我在这儿陪你。'],
    attempt_correct: ['太棒了！这首「正确」送给你～', '做得好，继续保持节奏！'],
    attempt_wrong: ['别急，我们再轻轻练一遍。'],
    transform: ['换好装了，继续加油～'],
  },
  trex: {
    welcome: ['吼！本龙已就位，开练！', '小家伙，今天也跟本龙冲！'],
    attempt_correct: ['吼！这题归本龙了！', '漂亮！爪下无逃题！'],
    attempt_wrong: ['收爪。错一题不可怕，再咬一口知识。'],
    mastered: ['这题被本龙踩扁了！'],
    transform: ['轰——变身成霸王龙！'],
  },
  fox: {
    attempt_correct: ['嘿嘿，机智如你～', '狐狸都点赞这波操作。'],
  },
  panda: {
    attempt_correct: ['团子给你竖大拇指！', '稳稳的，像滚下山的竹笋～'],
    attempt_wrong: ['慢慢来，竹子也是一根根啃的。'],
  },
  cat: {
    attempt_correct: ['嗯，还行。继续吧。', '喵，这题过了。'],
    attempt_wrong: ['别趴下，站起来再来一次。'],
  },
  owl: {
    attempt_correct: ['思路对了，继续保持条理。', '很好，掌握了关键一步。'],
    attempt_wrong: ['复盘一下错因，比盲目刷更有效。'],
  },
}

function pick(list: string[]): string {
  if (!list.length) return '……'
  return list[Math.floor(Math.random() * list.length)]
}

export function pickPetLine(event: PetEventType, skinId: PetSkinId): string {
  const skinLines = BY_SKIN[skinId]?.[event]
  if (skinLines?.length) {
    // 70% 用皮肤专属，30% 用通用
    if (Math.random() < 0.7) return pick(skinLines)
  }
  return pick(COMMON[event] || ['……'])
}
