/** 宠物语音：浏览器 SpeechSynthesis（不改 Piper、无新依赖） */

const ENABLED_KEY = 'pet.speechEnabled'
const VOICE_URI_KEY = 'pet.speechVoiceURI'
const RATE_KEY = 'pet.speechRate'
const PITCH_KEY = 'pet.speechPitch'
const DEFAULT_RATE = 1.05
const DEFAULT_PITCH = 1.05

let preferredVoice: SpeechSynthesisVoice | null = null
/** 是否已在用户手势里成功发起过一次 speak */
let unlocked = false
let speakTimer: ReturnType<typeof setTimeout> | null = null
let lastError = ''

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function getPetSpeechRate(): number {
  try {
    const n = Number(localStorage.getItem(RATE_KEY))
    if (Number.isFinite(n)) return clamp(n, 0.7, 1.6)
  } catch {
    /* ignore */
  }
  return DEFAULT_RATE
}

export function setPetSpeechRate(v: number) {
  try {
    localStorage.setItem(RATE_KEY, String(clamp(v, 0.7, 1.6)))
  } catch {
    /* ignore */
  }
}

export function getPetSpeechPitch(): number {
  try {
    const n = Number(localStorage.getItem(PITCH_KEY))
    if (Number.isFinite(n)) return clamp(n, 0.6, 1.6)
  } catch {
    /* ignore */
  }
  return DEFAULT_PITCH
}

export function setPetSpeechPitch(v: number) {
  try {
    localStorage.setItem(PITCH_KEY, String(clamp(v, 0.6, 1.6)))
  } catch {
    /* ignore */
  }
}

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isPetSpeechSupported(): boolean {
  return supported()
}

export function isPetSpeechEnabled(): boolean {
  try {
    const v = localStorage.getItem(ENABLED_KEY)
    if (v === null) return true
    return v !== '0' && v !== 'false'
  } catch {
    return true
  }
}

export function setPetSpeechEnabled(on: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (!on) stopPetSpeech()
}

export function getSavedVoiceURI(): string {
  try {
    return localStorage.getItem(VOICE_URI_KEY) || ''
  } catch {
    return ''
  }
}

export function setPreferredVoiceURI(uri: string) {
  try {
    if (uri) localStorage.setItem(VOICE_URI_KEY, uri)
    else localStorage.removeItem(VOICE_URI_KEY)
  } catch {
    /* ignore */
  }
  preferredVoice = null
  pickVoice()
}

/** 列出可选音色（优先中文） */
export function listPetVoices(): SpeechSynthesisVoice[] {
  if (!supported()) return []
  const list = window.speechSynthesis.getVoices()
  const zh = list.filter(
    (v) => /zh/i.test(v.lang) || /chinese|微软|xiaoxiao|yaoyao|huihui|tingting/i.test(v.name),
  )
  const rest = list.filter((v) => !zh.includes(v))
  return [...zh, ...rest]
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!supported()) return null
  const list = window.speechSynthesis.getVoices()
  if (!list.length) return preferredVoice

  const saved = getSavedVoiceURI()
  if (saved) {
    const byUri = list.find((v) => v.voiceURI === saved)
    if (byUri) {
      preferredVoice = byUri
      return byUri
    }
  }

  const zh =
    list.find((v) => /zh-CN|cmn-Hans/i.test(v.lang)) ||
    list.find((v) => /^zh/i.test(v.lang)) ||
    list.find((v) => /chinese|xiaoxiao|yaoyao|huihui|tingting|微软/i.test(v.name))
  preferredVoice = zh || list.find((v) => v.default) || list[0] || null
  return preferredVoice
}

function ensureVoices() {
  if (!supported()) return
  pickVoice()
  window.speechSynthesis.onvoiceschanged = () => {
    pickVoice()
  }
}

/**
 * 必须在 click/pointerup 同步调用栈里执行，才能通过 Chrome 自动播放策略。
 * 会真正 speak 一句极短音建立激活（不要立刻 cancel）。
 */
export function unlockPetSpeech(): boolean {
  if (!supported()) return false
  ensureVoices()
  try {
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      const warm = new SpeechSynthesisUtterance('嗯')
      warm.lang = 'zh-CN'
      warm.volume = 0.15
      warm.rate = 1.4
      warm.pitch = 1
      const voice = pickVoice()
      if (voice) warm.voice = voice
      warm.onerror = (ev) => {
        lastError = String((ev as SpeechSynthesisErrorEvent).error || 'unlock-error')
      }
      window.speechSynthesis.speak(warm)
    }
    unlocked = true
    lastError = ''
    return true
  } catch (e) {
    lastError = e instanceof Error ? e.message : 'unlock-failed'
    unlocked = true
    return false
  }
}

export function stopPetSpeech() {
  if (!supported()) return
  if (speakTimer) {
    clearTimeout(speakTimer)
    speakTimer = null
  }
  try {
    window.speechSynthesis.cancel()
  } catch {
    /* ignore */
  }
}

function buildUtterance(say: string, onEnd?: () => void): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(say)
  u.lang = 'zh-CN'
  u.rate = getPetSpeechRate()
  u.pitch = getPetSpeechPitch()
  u.volume = 1
  const voice = pickVoice()
  if (voice) u.voice = voice
  u.onend = () => onEnd?.()
  u.onerror = (ev) => {
    lastError = String((ev as SpeechSynthesisErrorEvent).error || 'speak-error')
    onEnd?.()
  }
  return u
}

/**
 * 朗读文本。
 * - 在用户点击里调用时会立刻 speak（同步），最稳。
 * - 若正在播放则 cancel 后延时 250ms 再播（规避 Chrome cancel 竞态）。
 */
export function speakPet(
  text: string,
  opts?: { onEnd?: () => void; /** 点击回调里传 true */ fromUserGesture?: boolean },
): boolean {
  if (!supported() || !isPetSpeechEnabled()) {
    opts?.onEnd?.()
    return false
  }
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw) {
    opts?.onEnd?.()
    return false
  }
  const say = raw.length > 280 ? `${raw.slice(0, 280)}…` : raw

  ensureVoices()
  if (opts?.fromUserGesture) unlockPetSpeech()

  const run = () => {
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume()
      const u = buildUtterance(say, opts?.onEnd)
      window.speechSynthesis.speak(u)
      unlocked = true
      lastError = ''
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'speak-failed'
      opts?.onEnd?.()
    }
  }

  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
    if (speakTimer) clearTimeout(speakTimer)
    speakTimer = setTimeout(() => {
      speakTimer = null
      run()
    }, 280)
    return true
  }

  if (opts?.fromUserGesture) {
    run()
    return true
  }

  if (!unlocked) {
    lastError = '尚未点击解锁语音，请先点「试听」或「聊」'
    opts?.onEnd?.()
    return false
  }
  run()
  return true
}

export function initPetSpeech() {
  if (!supported()) return
  ensureVoices()
  window.speechSynthesis.getVoices()
}

export function getPetSpeechDebug(): string {
  if (!supported()) return '浏览器不支持 speechSynthesis'
  const voices = window.speechSynthesis.getVoices()
  const zh = voices.filter((v) => /zh/i.test(v.lang) || /chinese|微软/i.test(v.name))
  const cur = pickVoice()
  return [
    `已解锁=${unlocked}`,
    `开关=${isPetSpeechEnabled()}`,
    `speaking=${window.speechSynthesis.speaking}`,
    `当前=${cur?.name || '默认'}`,
    `语速=${getPetSpeechRate()}`,
    `音调=${getPetSpeechPitch()}`,
    `音色=${voices.length}`,
    `中文=${zh.length ? zh.slice(0, 2).map((v) => v.name).join('/') : '无(请安装中文语音包)'}`,
    lastError ? `错误=${lastError}` : '错误=无',
  ].join('；')
}
