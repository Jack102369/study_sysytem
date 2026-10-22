import { onBeforeUnmount, watch } from 'vue'
import { usePetStore } from '@/stores/pet'
import {
  listSkinNames,
  matchSkinFromTransform,
} from '@/components/pet/skins'

type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives?: number
  onresult: ((ev: any) => void) | null
  onerror: ((ev: any) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getSpeechRecognition(): (new () => SpeechRec) | null {
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

function normalizeZh(s: string) {
  return s.replace(/[\s，。？！、,.!?;；：:～~…·]/g, '')
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function usePetWakeWord(opts: {
  onUserUtterance: (text: string) => void | Promise<void>
}) {
  const pet = usePetStore()
  let rec: SpeechRec | null = null
  let armed = false
  let shouldRun = false
  let starting = false
  /** 累计已确认（final）文本 */
  let buffer = ''
  /** 最新临时识别（Chrome 常迟迟不出 final，必须可提交） */
  let interim = ''
  let silenceTimer: ReturnType<typeof setTimeout> | null = null
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  const SILENCE_MS = 700
  const IDLE_WARN_MS = 8000

  function setHint(text: string) {
    pet.listenHint = text
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function clearIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  function pendingText() {
    return `${buffer}${interim}`.trim()
  }

  function resetBuffers() {
    buffer = ''
    interim = ''
  }

  function bumpIdleWarn() {
    clearIdleTimer()
    idleTimer = setTimeout(() => {
      idleTimer = null
      if (!pet.listening) return
      if (pendingText().length >= 2) {
        setHint(`已听见：${pendingText()} — 请再点红色「麦」发送`)
      } else {
        setHint('还没听清内容：靠近麦再说，或再点「麦」结束；也可点「聊」打字')
      }
    }, IDLE_WARN_MS)
  }

  function handleText(raw: string) {
    const text = raw.trim()
    if (!text) return

    console.info('[PetListen] handleText:', text)

    const transform = matchSkinFromTransform(text)
    if (transform) {
      void pet.setSkin(transform.id)
      pet.pushBubble(`好，变成${transform.name}啦`)
      return
    }
    if (/变身|变成|切换成|换成/.test(normalizeZh(text))) {
      pet.pushBubble(`我只会变这些：${listSkinNames()}`)
      pet.playAction('talk')
      return
    }

    const wake = (pet.wakeWord || '').trim()
    const normText = normalizeZh(text)
    const normWake = normalizeZh(wake)

    if (!armed && normWake && normText.includes(normWake)) {
      armed = true
      pet.playAction('listen')
      let rest = text.replace(new RegExp(escapeRegExp(wake), 'i'), '').trim()
      rest = rest.replace(/^[\s，。？！、,.!?]+/, '').trim()
      if (rest.length >= 2) {
        armed = false
        pet.pushBubble('好的，让我想想…')
        void opts.onUserUtterance(rest)
      } else {
        pet.pushBubble('我在听，请说出你的问题～')
      }
      return
    }

    if (armed || pet.panelOpen) {
      armed = false
      void opts.onUserUtterance(text)
      return
    }

    // 未唤醒：句子够长则直接当问题
    if (normText.length >= 4) {
      pet.pushBubble('好的，让我想想…')
      void opts.onUserUtterance(text)
      return
    }

    pet.pushBubble(`请说「${wake || '伙伴'}」或直接说完整问题`)
  }

  function flushBuffer(reason: string, stopAfter = true) {
    clearSilenceTimer()
    clearIdleTimer()
    const text = pendingText()
    resetBuffers()
    console.info('[PetListen] flush', reason, text)
    if (text.length >= 2) {
      setHint(`提交：${text}`)
      if (stopAfter) {
        // 先停听写，避免 AI 播报被再次录入
        shouldRun = false
        starting = false
        try {
          rec?.abort?.()
        } catch {
          try {
            rec?.stop()
          } catch {
            /* ignore */
          }
        }
        rec = null
        pet.listening = false
      }
      handleText(text)
      if (stopAfter) setHint('')
    } else {
      setHint(
        pet.listening
          ? '没听清，请再说一次；说完再点红色「麦」发送'
          : '',
      )
    }
  }

  function scheduleFlush() {
    clearSilenceTimer()
    silenceTimer = setTimeout(() => {
      silenceTimer = null
      if (pendingText().length >= 2) flushBuffer('silence', true)
    }, SILENCE_MS)
  }

  function safeStart() {
    if (!rec || !shouldRun || starting) return
    starting = true
    try {
      rec.start()
    } catch (e) {
      console.warn('[PetListen] start failed', e)
    } finally {
      setTimeout(() => {
        starting = false
      }, 300)
    }
  }

  function bindHandlers(instance: SpeechRec) {
    instance.onstart = () => {
      bumpIdleWarn()
      const pending = pendingText()
      setHint(
        pending
          ? `听见：${pending}（停顿或再点「麦」发送）`
          : '聆听中…说完请停顿，或再点红色「麦」发送',
      )
    }

    instance.onspeechend = () => {
      if (pendingText().length >= 2) scheduleFlush()
    }

    instance.onresult = (ev) => {
      try {
        let gotFinal = false
        let gotInterim = false
        let chunkInterim = ''
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const piece = String(ev.results[i]?.[0]?.transcript || '')
          if (ev.results[i].isFinal) {
            buffer = `${buffer}${piece}`.trim()
            interim = ''
            gotFinal = true
          } else {
            chunkInterim += piece
            gotInterim = true
          }
        }
        if (gotInterim) interim = chunkInterim
        bumpIdleWarn()
        const pending = pendingText()
        if (pending) {
          setHint(
            gotFinal
              ? `听见：${pending}（停顿或再点「麦」发送）`
              : `正在听：${pending}`,
          )
          scheduleFlush()
        }
      } catch (e) {
        console.warn('[PetListen] onresult error', e)
      }
    }

    instance.onerror = (ev: any) => {
      const err = String(ev?.error || '')
      console.warn('[PetListen] error', err)
      if (err === 'not-allowed') {
        pet.pushBubble('麦克风被拒绝，请在地址栏允许麦克风')
        stop({ submit: false })
        return
      }
      if (err === 'network') {
        pet.pushBubble('语音识别需要网络（Chrome 云端识别）')
        setHint('网络错误，请检查上网后重试')
        return
      }
      if (err === 'no-speech') {
        setHint('没检测到声音，靠近麦克风再说，说完点「麦」')
        return
      }
      if (err === 'aborted') return
      setHint(`听写异常：${err}`)
    }

    instance.onend = () => {
      // 段结束：若已有内容则安排提交；仍在听写则重启
      if (pendingText().length >= 2 && !silenceTimer) {
        scheduleFlush()
      }
      if (shouldRun && pet.listening) {
        setTimeout(() => safeStart(), 180)
      }
    }
  }

  function start() {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      pet.pushBubble('当前浏览器不支持语音听写，请用 Chrome/Edge，或点「聊」打字')
      return false
    }
    stopRecognitionOnly()
    shouldRun = true
    resetBuffers()
    armed = false
    rec = new Ctor()
    rec.lang = 'zh-CN'
    // continuous=false：一段结束后 onend 更可靠，再自动重启
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    bindHandlers(rec)
    try {
      pet.listening = true
      setHint('聆听中…说完请停顿，或再点红色「麦」发送')
      pet.pushBubble('麦克风已开：说完后停顿，或再点一次红色「麦」发送')
      bumpIdleWarn()
      safeStart()
      return true
    } catch {
      pet.listening = false
      pet.pushBubble('无法开启麦克风，请检查权限')
      return false
    }
  }

  function stopRecognitionOnly() {
    clearSilenceTimer()
    clearIdleTimer()
    shouldRun = false
    starting = false
    try {
      rec?.abort?.()
    } catch {
      try {
        rec?.stop()
      } catch {
        /* ignore */
      }
    }
    rec = null
  }

  /** 结束听写：若有内容（含 interim）则提交 */
  function stop(opts?: { submit?: boolean }) {
    const submit = opts?.submit !== false
    const pending = pendingText()
    stopRecognitionOnly()
    pet.listening = false
    armed = false
    resetBuffers()
    if (submit && pending.length >= 2) {
      setHint('')
      handleText(pending)
    } else {
      setHint('')
      if (submit && pending.length < 2) {
        pet.pushBubble('没听清你说的话，请再点「听」重说，或点「聊」打字')
      }
    }
  }

  function toggle() {
    if (pet.listening) {
      // 再点一次「麦」= 说完了，提交（含 interim）
      stop({ submit: true })
    } else {
      start()
    }
  }

  watch(
    () => pet.petEnabled,
    (v) => {
      if (!v) stop({ submit: false })
    },
  )

  onBeforeUnmount(() => stop({ submit: false }))

  return { start, stop, toggle, supported: !!getSpeechRecognition() }
}
