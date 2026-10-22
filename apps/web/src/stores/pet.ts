import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_PET_SKIN,
  getSkin,
  isPetSkinId,
  type PetSkinId,
} from '@/components/pet/skins'
import {
  ACTION_DURATION_MS,
  EVENT_TO_ACTION,
  type PetAction,
} from '@/components/pet/event-map'
import { pickPetLine, type PetEventType } from '@/components/pet/scripts'
import { getPetPrefs, updatePetPrefs } from '@/api/pet-assistant'
import { speakPet, stopPetSpeech } from '@/composables/usePetSpeech'

const POS_KEY = 'pet.position'
const WELCOME_KEY = 'pet.welcomeDay'

export type PetBubble = { id: number; text: string }

export const usePetStore = defineStore('pet', () => {
  const skinId = ref<PetSkinId>(DEFAULT_PET_SKIN)
  const petEnabled = ref(true)
  const wakeWordOverrides = ref<Record<string, string>>({})
  const action = ref<PetAction>('idle')
  const panelOpen = ref(false)
  const skinPickerOpen = ref(false)
  const listening = ref(false)
  /** 听写实时提示（正在听 / 听见的内容） */
  const listenHint = ref('')
  const bubble = ref<PetBubble | null>(null)
  const position = ref<{ x: number; y: number } | null>(loadPos())
  const prefsLoaded = ref(false)
  const canUseAi = ref(false)
  /** 全屏庆祝进行中（防重复点击） */
  const celebrating = ref(false)
  /** 递增触发：Companion 监听后播放庆祝（供答题页后续调用） */
  const celebrateSeq = ref(0)
  const celebrateLine = ref('恭喜答对了！太棒了，继续保持！')

  let bubbleSeq = 0
  let actionTimer: ReturnType<typeof setTimeout> | null = null
  const lastEventAt: Partial<Record<PetEventType, number>> = {}

  const skin = computed(() => getSkin(skinId.value))
  const wakeWord = computed(() => {
    const o = wakeWordOverrides.value[skinId.value]
    if (o?.trim()) return o.trim()
    return skin.value.defaultWakeWord
  })

  function loadPos(): { x: number; y: number } | null {
    try {
      const raw = localStorage.getItem(POS_KEY)
      if (!raw) return null
      const p = JSON.parse(raw) as { x: number; y: number }
      if (typeof p.x === 'number' && typeof p.y === 'number') return p
    } catch {
      /* ignore */
    }
    return null
  }

  function setPosition(x: number, y: number) {
    position.value = { x, y }
    localStorage.setItem(POS_KEY, JSON.stringify({ x, y }))
  }

  function playAction(next: PetAction, ms?: number) {
    action.value = next
    if (actionTimer) clearTimeout(actionTimer)
    const dur = ms ?? ACTION_DURATION_MS[next] ?? 0
    if (dur > 0) {
      actionTimer = setTimeout(() => {
        action.value = 'idle'
      }, dur)
    }
  }

  function pushBubble(text: string, opts?: { speak?: boolean }) {
    bubbleSeq += 1
    bubble.value = { id: bubbleSeq, text }
    setTimeout(() => {
      if (bubble.value?.id === bubbleSeq) bubble.value = null
    }, 4200)
    if (opts?.speak !== false && petEnabled.value) {
      speakPet(text)
    }
  }

  function emitPetEvent(type: PetEventType, opts?: { force?: boolean }) {
    if (!petEnabled.value) return
    const now = Date.now()
    if (!opts?.force && type !== 'transform' && type !== 'welcome') {
      const last = lastEventAt[type] || 0
      if (now - last < 30000) return
    }
    if (type === 'welcome') {
      const day = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(WELCOME_KEY) === day && !opts?.force) return
      localStorage.setItem(WELCOME_KEY, day)
    }
    lastEventAt[type] = now
    const line = pickPetLine(type, skinId.value)
    playAction(EVENT_TO_ACTION[type])
    pushBubble(line)
  }

  async function loadPrefs() {
    try {
      const p = await getPetPrefs()
      skinId.value = isPetSkinId(p.skinId) ? p.skinId : DEFAULT_PET_SKIN
      petEnabled.value = !!p.petEnabled
      wakeWordOverrides.value = p.wakeWordOverrides || {}
      prefsLoaded.value = true
    } catch {
      prefsLoaded.value = true
    }
  }

  async function setSkin(id: PetSkinId, opts?: { silent?: boolean }) {
    skinId.value = id
    if (!opts?.silent) {
      emitPetEvent('transform', { force: true })
    } else {
      playAction('transform')
    }
    try {
      await updatePetPrefs({ skinId: id })
    } catch {
      /* 本地已切换，同步失败时下次进页再拉 */
    }
  }

  async function setPetEnabled(v: boolean) {
    petEnabled.value = v
    if (!v) stopPetSpeech()
    try {
      await updatePetPrefs({ petEnabled: v })
    } catch {
      /* ignore */
    }
  }

  async function setWakeWordForCurrent(word: string) {
    const next = { ...wakeWordOverrides.value }
    const w = word.trim().slice(0, 32)
    if (w) next[skinId.value] = w
    else delete next[skinId.value]
    wakeWordOverrides.value = next
    try {
      await updatePetPrefs({ wakeWordOverrides: next })
    } catch {
      /* ignore */
    }
  }

  function openPanel() {
    panelOpen.value = true
    playAction('talk')
  }

  function closePanel() {
    panelOpen.value = false
    action.value = 'idle'
    stopPetSpeech()
  }

  function togglePanel() {
    if (panelOpen.value) closePanel()
    else openPanel()
  }

  /**
   * 请求全屏庆祝（转身跳舞 + 鲜花烟火 + 语音）。
   * 由 PetCompanion 编排执行；答题页日后可直接调用此方法。
   */
  function requestCelebration(opts?: { line?: string }) {
    if (!petEnabled.value || celebrating.value) return false
    const line = (opts?.line || '').trim()
    celebrateLine.value = line || '恭喜答对了！太棒了，继续保持！'
    celebrating.value = true
    celebrateSeq.value += 1
    return true
  }

  return {
    skinId,
    skin,
    petEnabled,
    wakeWordOverrides,
    wakeWord,
    action,
    panelOpen,
    skinPickerOpen,
    listening,
    listenHint,
    bubble,
    position,
    prefsLoaded,
    canUseAi,
    celebrating,
    celebrateSeq,
    celebrateLine,
    setPosition,
    playAction,
    pushBubble,
    emitPetEvent,
    requestCelebration,
    loadPrefs,
    setSkin,
    setPetEnabled,
    setWakeWordForCurrent,
    openPanel,
    closePanel,
    togglePanel,
  }
})
