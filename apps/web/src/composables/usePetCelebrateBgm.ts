/** 祝贺背景音乐：优先自定义 mp3，否则内置轻快音效（不改 Piper） */

import { resolveVrmUrl } from '@/components/pet/skins'

const ENABLED_KEY = 'pet.celebrateBgmEnabled'
const VOLUME_KEY = 'pet.celebrateBgmVolume'
/** 用户可把文件放到 public/audio/celebrate-bgm.mp3（二级目录会自动加 base） */
export const CELEBRATE_BGM_URL = resolveVrmUrl('audio/celebrate-bgm.mp3')

let audioEl: HTMLAudioElement | null = null
let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null
let usingFile = false
let playing = false

export function isCelebrateBgmEnabled(): boolean {
  try {
    const v = localStorage.getItem(ENABLED_KEY)
    if (v === null) return true
    return v !== '0' && v !== 'false'
  } catch {
    return true
  }
}

export function setCelebrateBgmEnabled(on: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (!on) stopCelebrateBgm()
}

export function getCelebrateBgmVolume(): number {
  try {
    const n = Number(localStorage.getItem(VOLUME_KEY))
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n))
  } catch {
    /* ignore */
  }
  return 0.35
}

export function setCelebrateBgmVolume(v: number) {
  const n = Math.min(1, Math.max(0, v))
  try {
    localStorage.setItem(VOLUME_KEY, String(n))
  } catch {
    /* ignore */
  }
  if (audioEl) audioEl.volume = n
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(n * 0.55, audioCtx.currentTime, 0.05)
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** 内置：短促欢快琶音循环（无外部版权文件） */
function playBuiltinLoop(vol: number) {
  const ctx = ensureCtx()
  if (!ctx) return false
  stopBuiltinOnly()

  masterGain = ctx.createGain()
  masterGain.gain.value = 0
  masterGain.connect(ctx.destination)
  masterGain.gain.linearRampToValueAtTime(vol * 0.5, ctx.currentTime + 0.15)

  const pattern = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25] // C5 E5 G5 C6 …
  let step = 0

  const beat = () => {
    if (!playing || !audioCtx || !masterGain) return
    const t0 = audioCtx.currentTime
    const freq = pattern[step % pattern.length]
    step += 1

    const osc = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    g.gain.value = 0
    osc.connect(g)
    g.connect(masterGain)
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28)
    osc.start(t0)
    osc.stop(t0 + 0.3)

    // 轻微底鼓感
    if (step % 3 === 1) {
      const o2 = audioCtx.createOscillator()
      const g2 = audioCtx.createGain()
      o2.type = 'sine'
      o2.frequency.value = 120
      g2.gain.value = 0
      o2.connect(g2)
      g2.connect(masterGain)
      g2.gain.linearRampToValueAtTime(0.12, t0 + 0.01)
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18)
      o2.start(t0)
      o2.stop(t0 + 0.2)
    }
  }

  beat()
  loopTimer = setInterval(beat, 220)
  return true
}

function stopBuiltinOnly() {
  if (loopTimer) {
    clearInterval(loopTimer)
    loopTimer = null
  }
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2)
    } catch {
      /* ignore */
    }
    const g = masterGain
    setTimeout(() => {
      try {
        g.disconnect()
      } catch {
        /* ignore */
      }
    }, 280)
  }
  masterGain = null
}

async function tryPlayFile(vol: number): Promise<boolean> {
  try {
    if (!audioEl) audioEl = new Audio()
    audioEl.loop = true
    audioEl.volume = vol
    audioEl.src = `${CELEBRATE_BGM_URL}?t=${Date.now()}`
    audioEl.currentTime = 0
    // 缺文件时 play 会失败，或 Vite 回落到 html（decode 失败）
    await new Promise<void>((resolve, reject) => {
      if (!audioEl) return reject(new Error('no audio'))
      const onOk = () => {
        cleanup()
        resolve()
      }
      const onErr = () => {
        cleanup()
        reject(new Error('audio error'))
      }
      const cleanup = () => {
        audioEl?.removeEventListener('canplaythrough', onOk)
        audioEl?.removeEventListener('error', onErr)
      }
      audioEl.addEventListener('canplaythrough', onOk, { once: true })
      audioEl.addEventListener('error', onErr, { once: true })
      audioEl.load()
    })
    await audioEl.play()
    usingFile = true
    return true
  } catch {
    try {
      audioEl?.pause()
    } catch {
      /* ignore */
    }
    return false
  }
}

/**
 * 开始祝贺 BGM。请在用户点击手势里调用。
 */
export async function startCelebrateBgm(): Promise<void> {
  if (!isCelebrateBgmEnabled()) return
  stopCelebrateBgm()
  playing = true
  const vol = getCelebrateBgmVolume()
  usingFile = false
  const ok = await tryPlayFile(vol)
  if (!ok) playBuiltinLoop(vol)
}

export function stopCelebrateBgm() {
  playing = false
  if (audioEl) {
    try {
      audioEl.pause()
      audioEl.currentTime = 0
    } catch {
      /* ignore */
    }
  }
  stopBuiltinOnly()
  usingFile = false
}

export function getCelebrateBgmDebug(): string {
  return [
    `开关=${isCelebrateBgmEnabled()}`,
    `音量=${getCelebrateBgmVolume()}`,
    `播放中=${playing}`,
    `来源=${usingFile ? '自定义mp3' : playing ? '内置音效' : '无'}`,
  ].join('；')
}
