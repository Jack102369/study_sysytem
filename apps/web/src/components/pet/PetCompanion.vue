<template>
  <div ref="rootEl" v-if="pet.petEnabled" class="pet-root" :style="rootStyle">
    <div class="stack">
      <PetBubble class="bubble" :text="pet.bubble?.text" />
      <div class="row" :class="chatPlacement === 'right' ? 'chat-on-right' : 'chat-on-left'">
        <PetChatPanel
          v-if="pet.panelOpen"
          ref="chatRef"
          class="chat"
          :skin-id="pet.skinId"
          :skin-name="pet.skin.name"
          :can-use-ai="pet.canUseAi"
          @close="pet.closePanel()"
        />
        <div
          class="fab"
          @pointerdown="onFabPointerDown"
          @click="onFabClick"
          @dblclick.prevent="onFabDblClick"
        >
          <PetAvatar
            ref="avatarRef"
            :skin-id="pet.skinId"
            :action="pet.action"
          />
          <div class="tools" @pointerdown.stop @click.stop @dblclick.stop @wheel.stop>
            <el-tooltip
              :content="pet.listening ? '再说完后点我：发送问题' : '点我开始说话'"
              placement="left"
            >
              <el-button
                circle
                size="small"
                :type="pet.listening ? 'danger' : 'default'"
                @click="onListen"
              >
                {{ pet.listening ? '麦' : '听' }}
              </el-button>
            </el-tooltip>
            <el-tooltip content="对话" placement="left">
              <el-button circle size="small" type="primary" @click="onChat">
                聊
              </el-button>
            </el-tooltip>
            <el-tooltip content="试听语音" placement="left">
              <el-button circle size="small" @click="onSpeakTest">
                音
              </el-button>
            </el-tooltip>
            <el-tooltip content="恭喜答对了（全屏庆祝）" placement="left">
              <el-button
                circle
                size="small"
                type="success"
                :disabled="pet.celebrating"
                @click="onCelebrate"
              >
                贺
              </el-button>
            </el-tooltip>
          </div>
          <div v-if="pet.listening && pet.listenHint" class="listen-hint">
            {{ pet.listenHint }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { usePetStore } from '@/stores/pet'
import { usePetWakeWord } from '@/composables/usePetWakeWord'
import {
  initPetSpeech,
  speakPet,
  stopPetSpeech,
  unlockPetSpeech,
} from '@/composables/usePetSpeech'
import {
  startCelebrateBgm,
  stopCelebrateBgm,
} from '@/composables/usePetCelebrateBgm'
import PetAvatar from './PetAvatar.vue'
import PetBubble from './PetBubble.vue'
import PetChatPanel from './PetChatPanel.vue'

const CHAT_W = 330
const FAB_W = 210
const GAP = 10
const MARGIN = 8

const pet = usePetStore()
const rootEl = ref<HTMLElement | null>(null)
const chatRef = ref<{ sendExternal: (t: string) => Promise<void> } | null>(null)
const avatarRef = ref<{
  cycleExpression: () => void
  cycleCameraMode: () => void
  openExpand: () => void
  openCelebration: () => Promise<void> | void
  closeCelebration: () => void
  playDance: (opts?: { url?: string; onEnd?: () => void }) => Promise<boolean>
  stopDance: () => void
} | null>(null)

let celebrateFallbackTimer: ReturnType<typeof setTimeout> | null = null
let celebrateFinishing = false

/** 对话框相对人物：left=人物左侧，right=人物右侧 */
const chatPlacement = ref<'left' | 'right'>('left')

async function waitChatReady(max = 20) {
  for (let i = 0; i < max; i++) {
    if (chatRef.value) return true
    await nextTick()
    await new Promise((r) => setTimeout(r, 30))
  }
  return !!chatRef.value
}

const wake = usePetWakeWord({
  onUserUtterance: async (text) => {
    unlockPetSpeech()
    if (!pet.canUseAi) {
      pet.pushBubble('还没开通 AI，请联系管理员；也可点「聊」查看')
      openChatSmart()
      return
    }
    if (!pet.panelOpen) openChatSmart()
    else pet.openPanel()
    const ready = await waitChatReady()
    if (!ready || !chatRef.value) {
      pet.pushBubble('对话框还没就绪，请再点「聊」后重说一次')
      return
    }
    pet.pushBubble(`收到：${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`)
    await chatRef.value.sendExternal(text)
  },
})

function fabAnchorLeft(): number {
  const p = pet.position
  if (!p) return Math.max(MARGIN, window.innerWidth - 16 - FAB_W)
  // 面板已开且对话框在左时，position 是整块 root 左缘，需换算人物左缘
  if (pet.panelOpen && chatPlacement.value === 'left') {
    return p.x + CHAT_W + GAP
  }
  return p.x
}

function fabAnchorTop(): number {
  const p = pet.position
  if (p) return p.y
  return Math.max(MARGIN, window.innerHeight - 16 - 300)
}

function decideChatPlacement(fabLeft: number): 'left' | 'right' {
  const spaceLeft = fabLeft - MARGIN
  const spaceRight = window.innerWidth - (fabLeft + FAB_W) - MARGIN
  // 优先放空间更大的一侧；右下角默认人物 → 对话框在左
  if (spaceLeft >= CHAT_W + GAP && spaceLeft >= spaceRight) return 'left'
  if (spaceRight >= CHAT_W + GAP) return 'right'
  if (spaceLeft >= spaceRight) return 'left'
  return 'right'
}

/** 打开对话时：选左右侧，并把整块（对话+人物）钳进视口 */
function openChatSmart() {
  const fabLeft = fabAnchorLeft()
  const fabTop = fabAnchorTop()
  chatPlacement.value = decideChatPlacement(fabLeft)

  const totalW = CHAT_W + GAP + FAB_W
  let x = fabLeft
  let y = fabTop

  // pet.position 是整块 root 的左上角；打开对话后 root 变宽
  if (chatPlacement.value === 'left') {
    // root = [chat][fab]，fab 在右侧，root.left = fabLeft - chat - gap
    x = fabLeft - CHAT_W - GAP
  } else {
    // root = [fab][chat]，fab 在左侧
    x = fabLeft
  }

  if (x < MARGIN) x = MARGIN
  if (x + totalW > window.innerWidth - MARGIN) {
    x = Math.max(MARGIN, window.innerWidth - MARGIN - totalW)
  }

  // 垂直：尽量不超出底/顶
  const approxH = 320
  if (y + approxH > window.innerHeight - MARGIN) {
    y = Math.max(MARGIN, window.innerHeight - MARGIN - approxH)
  }
  if (y < MARGIN) y = MARGIN

  pet.setPosition(x, y)
  pet.openPanel()

  nextTick(() => {
    // 用真实 DOM 再钳一次，防止高度估算偏差
    const el = rootEl.value
    if (!el) return
    const r = el.getBoundingClientRect()
    let nx = r.left
    let ny = r.top
    if (r.right > window.innerWidth - MARGIN) nx -= r.right - (window.innerWidth - MARGIN)
    if (r.left < MARGIN) nx = MARGIN
    if (r.bottom > window.innerHeight - MARGIN) ny -= r.bottom - (window.innerHeight - MARGIN)
    if (r.top < MARGIN) ny = MARGIN
    if (nx !== r.left || ny !== r.top) pet.setPosition(nx, ny)
  })
}

const rootStyle = computed(() => {
  const p = pet.position
  if (!p) {
    return { right: '16px', bottom: '16px', left: 'auto', top: 'auto' } as Record<
      string,
      string
    >
  }
  return {
    left: `${p.x}px`,
    top: `${p.y}px`,
    right: 'auto',
    bottom: 'auto',
  } as Record<string, string>
})

let dragging = false
let moved = false
let startX = 0
let startY = 0
let origX = 0
let origY = 0
let lastClickAt = 0
let clickTimer: ReturnType<typeof setTimeout> | null = null

function onFabPointerDown(e: PointerEvent) {
  const t = e.target as HTMLElement
  if (t.closest('.tools') || t.closest('.cam-bar')) return
  unlockPetSpeech()
  dragging = true
  moved = false
  startX = e.clientX
  startY = e.clientY
  const el = (e.currentTarget as HTMLElement).closest('.pet-root') as HTMLElement
  const rect = el.getBoundingClientRect()
  origX = rect.left
  origY = rect.top
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)

  const onMove = (ev: PointerEvent) => {
    if (!dragging) return
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
    const w = el.getBoundingClientRect().width || FAB_W
    const h = el.getBoundingClientRect().height || 300
    const x = Math.min(window.innerWidth - w - MARGIN, Math.max(MARGIN, origX + dx))
    const y = Math.min(window.innerHeight - Math.min(h, 200) - MARGIN, Math.max(MARGIN, origY + dy))
    pet.setPosition(x, y)
  }
  const onUp = () => {
    dragging = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onFabClick() {
  if (moved) return
  unlockPetSpeech()
  const now = Date.now()
  if (now - lastClickAt < 280) {
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
    }
    lastClickAt = 0
    return
  }
  lastClickAt = now
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    clickTimer = null
    avatarRef.value?.cycleExpression()
  }, 260)
}

function onFabDblClick() {
  if (moved) return
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  lastClickAt = 0
  avatarRef.value?.cycleCameraMode()
}

function onListen() {
  unlockPetSpeech()
  wake.toggle()
}

function onChat() {
  // 同步手势里解锁并短促出声，后续 AI 回复才能继续 speak
  unlockPetSpeech()
  if (pet.panelOpen) {
    pet.closePanel()
    return
  }
  openChatSmart()
  speakPet('我在听，有什么想问的吗？', { fromUserGesture: true })
}

function onSpeakTest() {
  const ok = speakPet('你好，我是学习伙伴。如果能听到，说明语音正常。', {
    fromUserGesture: true,
  })
  if (ok) ElMessage.success('正在朗读…')
  else ElMessage.warning('未能朗读，请到「设置→学习伙伴」查看状态，并安装中文语音包')
}

function finishCelebration() {
  if (celebrateFinishing) return
  celebrateFinishing = true
  if (celebrateFallbackTimer) {
    clearTimeout(celebrateFallbackTimer)
    celebrateFallbackTimer = null
  }
  stopCelebrateBgm()
  // 先切 idle 停舞蹈，再关全屏并复位镜头
  pet.playAction('idle')
  avatarRef.value?.closeCelebration()
  pet.celebrating = false
  celebrateFinishing = false
}

async function runCelebration(line?: string) {
  if (!avatarRef.value) {
    pet.celebrating = false
    return
  }
  celebrateFinishing = false
  if (pet.listening) wake.stop({ submit: false })
  unlockPetSpeech()
  void startCelebrateBgm()
  const say = (line || pet.celebrateLine || '恭喜答对了！太棒了，继续保持！').trim()
  pet.pushBubble(say, { speak: false })
  try {
    await avatarRef.value.openCelebration()
  } catch (e) {
    console.warn('[PetCelebrate] open failed', e)
    stopCelebrateBgm()
    pet.celebrating = false
    return
  }
  // Mixamo 重定向舞蹈：播完自动待机；语音/BGM 与舞蹈并行
  pet.playAction('celebrate', 0)
  speakPet(say, { fromUserGesture: true })
  const danceOk = await avatarRef.value.playDance({
    onEnd: () => {
      finishCelebration()
    },
  })
  // 兜底：重定向失败或 finished 未触发时约 30s 收起
  if (celebrateFallbackTimer) clearTimeout(celebrateFallbackTimer)
  celebrateFallbackTimer = setTimeout(() => finishCelebration(), danceOk ? 30000 : 6500)
}

function onCelebrate() {
  // 同步手势里解锁语音 + 启动 BGM（Audio 需用户手势）
  unlockPetSpeech()
  void startCelebrateBgm()
  pet.requestCelebration({ line: '恭喜答对了！太棒了，继续保持！' })
}

watch(
  () => pet.panelOpen,
  (open) => {
    if (!open) return
    // 若从别处打开面板，同样做一次钳位
    nextTick(() => {
      const el = rootEl.value
      if (!el) return
      const r = el.getBoundingClientRect()
      let nx = r.left
      let ny = r.top
      if (r.right > window.innerWidth - MARGIN) nx -= r.right - (window.innerWidth - MARGIN)
      if (r.left < MARGIN) nx = MARGIN
      if (r.bottom > window.innerHeight - MARGIN) ny -= r.bottom - (window.innerHeight - MARGIN)
      if (r.top < MARGIN) ny = MARGIN
      if (Math.abs(nx - r.left) > 1 || Math.abs(ny - r.top) > 1) pet.setPosition(nx, ny)
    })
  },
)

watch(
  () => pet.celebrateSeq,
  (seq) => {
    if (seq <= 0) return
    void runCelebration(pet.celebrateLine)
  },
)

onMounted(async () => {
  initPetSpeech()
  await pet.loadPrefs()
  pet.emitPetEvent('welcome')
})

onBeforeUnmount(() => {
  if (celebrateFallbackTimer) clearTimeout(celebrateFallbackTimer)
  stopCelebrateBgm()
  if (pet.celebrating) {
    avatarRef.value?.closeCelebration()
    pet.celebrating = false
  }
  stopPetSpeech()
})
</script>

<style scoped>
.pet-root {
  position: fixed;
  z-index: 4000;
  user-select: none;
}
.stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.bubble {
  margin-right: 8px;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 10px;
}
/* 对话框在人物左侧（默认） */
.row.chat-on-left {
  flex-direction: row;
}
/* 对话框在人物右侧 */
.row.chat-on-right {
  flex-direction: row-reverse;
}
.chat {
  flex: 0 0 auto;
  margin-bottom: 36px;
  max-width: min(320px, calc(100vw - 48px));
}
.fab {
  position: relative;
  min-width: 200px;
  min-height: 300px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: visible;
  cursor: grab;
  touch-action: none;
}
.fab:active {
  cursor: grabbing;
}
.tools {
  position: absolute;
  left: -10px;
  bottom: 48px;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.listen-hint {
  position: absolute;
  left: 50%;
  bottom: 44px;
  transform: translateX(-50%);
  z-index: 7;
  max-width: 220px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-primary, #eee);
  background: color-mix(in srgb, var(--el-bg-color-overlay, #1a1a1a) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 55%, transparent);
  pointer-events: none;
  white-space: normal;
  text-align: center;
}

@media (max-width: 640px) {
  .row.chat-on-left,
  .row.chat-on-right {
    flex-direction: column-reverse;
    align-items: flex-end;
  }
  .chat {
    margin-bottom: 0;
  }
  .fab {
    min-width: 160px;
    min-height: 240px;
  }
}
</style>
