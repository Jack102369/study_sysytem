<template>
  <div class="pet-stage">
    <div ref="dockRef" class="dock" :class="{ hidden: stageAway }">
      <div ref="wrapRef" class="vrm-wrap">
        <canvas ref="canvasRef" class="vrm-canvas" />
        <div v-if="status === 'loading'" class="overlay muted">加载中…</div>
        <div v-else-if="status === 'error'" class="overlay err">
          <svg class="sil" viewBox="0 0 64 80" aria-hidden="true">
            <ellipse cx="32" cy="74" rx="16" ry="3" fill="currentColor" opacity="0.2" />
            <circle cx="32" cy="22" r="12" fill="currentColor" opacity="0.35" />
            <path
              d="M20 36 Q32 30 44 36 L42 62 Q32 68 22 62 Z"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
          <span>{{ errorText || '模型加载失败' }}</span>
        </div>
        <div
          v-if="!celebrating"
          class="cam-bar"
          @pointerdown.stop
          @click.stop
          @dblclick.stop
          @wheel.stop
        >
          <el-button
            v-for="m in PET_CAMERA_MODES"
            :key="m.id"
            size="small"
            text
            :type="cameraMode === m.id ? 'primary' : 'default'"
            class="cam-btn"
            :class="{ active: cameraMode === m.id }"
            @click="onPickMode(m.id)"
          >
            {{ m.label }}
          </el-button>
          <el-button size="small" text type="primary" class="cam-btn" @click="openExpand">
            展开
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="expanded"
      title="学习伙伴"
      width="min(520px, 94vw)"
      align-center
      class="pet-expand-dialog"
      :z-index="5100"
      append-to-body
      :close-on-click-modal="true"
      @opened="onDialogOpened"
      @close="onDialogBeforeClose"
      @closed="onDialogClosed"
    >
      <div ref="expandHostRef" class="expand-host" />
      <template #footer>
        <div class="expand-footer">
          <el-button
            v-for="m in PET_CAMERA_MODES"
            :key="m.id"
            size="small"
            :type="cameraMode === m.id ? 'primary' : 'default'"
            @click="onPickMode(m.id)"
          >
            {{ m.label }}
          </el-button>
          <el-button size="small" @click="expanded = false">收起</el-button>
        </div>
      </template>
    </el-dialog>

    <Teleport to="body">
      <div v-if="celebrating" class="cele-layer" @pointerdown.stop>
        <PetCelebrationFx :active="celebrating" />
        <div ref="celeHostRef" class="cele-host" />
        <div class="cele-caption">恭喜答对了！</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  useVrmPet,
  type VrmPetController,
  type VrmPetStatus,
} from '@/composables/useVrmPet'
import type { PetAction } from './event-map'
import { resolveVrmUrl } from './skins'
import {
  PET_CAMERA_MODES,
  loadPetCameraMode,
  type PetCameraMode,
} from './PetCameraController'
import PetCelebrationFx from './PetCelebrationFx.vue'

const props = defineProps<{
  vrmPath: string
  action: PetAction
}>()

const emit = defineEmits<{
  ready: []
  error: [msg: string]
  expression: [name: string]
  'camera-mode': [mode: PetCameraMode]
}>()

const wrapRef = ref<HTMLElement | null>(null)
const dockRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const expandHostRef = ref<HTMLElement | null>(null)
const celeHostRef = ref<HTMLElement | null>(null)
const status = ref<VrmPetStatus>('idle')
const errorText = ref('')
const cameraMode = ref<PetCameraMode>(loadPetCameraMode())
const expanded = ref(false)
const celebrating = ref(false)

const stageAway = computed(() => expanded.value || celebrating.value)

let ctrl: VrmPetController | null = null
let ro: ResizeObserver | null = null

function onStatus(s: VrmPetStatus, err?: string) {
  status.value = s
  errorText.value = err || ''
  if (s === 'ready') emit('ready')
  if (s === 'error') emit('error', err || 'VRM 加载失败')
}

function activeHost(): HTMLElement | null {
  if (celebrating.value) return celeHostRef.value
  if (expanded.value) return expandHostRef.value
  return wrapRef.value
}

function syncSize() {
  const host = activeHost()
  if (!host || !ctrl) return
  const r = host.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  ctrl.resize(r.width, r.height)
}

function moveCanvasTo(host: HTMLElement | null) {
  const wrap = wrapRef.value
  if (!wrap || !host) return
  if (wrap.parentElement !== host) host.appendChild(wrap)
  nextTick(() => {
    requestAnimationFrame(syncSize)
  })
}

function openExpand() {
  if (celebrating.value) return
  expanded.value = true
}

async function onDialogOpened() {
  await nextTick()
  moveCanvasTo(expandHostRef.value)
  if (expandHostRef.value && ro) {
    try {
      ro.observe(expandHostRef.value)
    } catch {
      /* already observing */
    }
  }
  syncSize()
}

/** 关闭前先把 Canvas 挪回 dock，避免 Dialog 卸载带走唯一渲染实例 */
function onDialogBeforeClose() {
  if (celebrating.value) return
  moveCanvasTo(dockRef.value)
}

function onDialogClosed() {
  if (celebrating.value) return
  moveCanvasTo(dockRef.value)
  nextTick(() => requestAnimationFrame(syncSize))
}

function onPickMode(mode: PetCameraMode) {
  cameraMode.value = mode
  ctrl?.setCameraMode(mode)
  emit('camera-mode', mode)
}

async function openCelebration() {
  if (celebrating.value) return
  if (expanded.value) {
    expanded.value = false
    await nextTick()
  }
  celebrating.value = true
  document.body.classList.add('pet-celebrate-open')
  await nextTick()
  moveCanvasTo(celeHostRef.value)
  if (celeHostRef.value && ro) {
    try {
      ro.observe(celeHostRef.value)
    } catch {
      /* ignore */
    }
  }
  ctrl?.setCameraMode('fullBody', {
    persist: false,
    animate: true,
    framing: 'dance',
  })
  cameraMode.value = 'fullBody'
  emit('camera-mode', 'fullBody')
  requestAnimationFrame(syncSize)
}

function closeCelebration() {
  if (!celebrating.value) return
  celebrating.value = false
  document.body.classList.remove('pet-celebrate-open')
  // 先停动作；庆祝结束固定恢复「正对镜头特写」
  ctrl?.setAction('idle')
  moveCanvasTo(dockRef.value)
  ctrl?.restoreAfterCelebration()
  cameraMode.value = 'closeup'
  emit('camera-mode', 'closeup')
  nextTick(() => {
    ctrl?.restoreAfterCelebration()
    requestAnimationFrame(syncSize)
  })
}

onMounted(() => {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return

  ctrl = useVrmPet({
    canvas,
    url: resolveVrmUrl(props.vrmPath),
    onStatus,
    onCameraMode: (m) => {
      cameraMode.value = m
      emit('camera-mode', m)
    },
  })

  syncSize()
  requestAnimationFrame(syncSize)
  ro = new ResizeObserver(() => syncSize())
  ro.observe(wrap)
  ctrl.setAction(props.action)
})

watch(
  () => props.vrmPath,
  (path) => {
    ctrl?.setUrl(resolveVrmUrl(path))
  },
)

watch(
  () => props.action,
  (a) => {
    ctrl?.setAction(a)
  },
)

watch(expanded, (v) => {
  document.body.classList.toggle('pet-expand-open', v)
  if (!v) return
  nextTick(() => moveCanvasTo(expandHostRef.value))
})

function cycleExpression() {
  const name = ctrl?.cycleExpression()
  if (name) emit('expression', name)
}

function cycleCameraMode() {
  ctrl?.cycleCameraMode()
}

async function playDance(opts?: { url?: string; onEnd?: () => void }) {
  return ctrl?.playDance(opts) ?? false
}

function stopDance() {
  ctrl?.stopDance({ restoreCamera: true })
}

defineExpose({
  cycleExpression,
  cycleCameraMode,
  openExpand,
  openCelebration,
  closeCelebration,
  playDance,
  stopDance,
})

onBeforeUnmount(() => {
  document.body.classList.remove('pet-expand-open')
  document.body.classList.remove('pet-celebrate-open')
  if (dockRef.value && wrapRef.value) {
    dockRef.value.appendChild(wrapRef.value)
  }
  ro?.disconnect()
  ctrl?.dispose()
  ctrl = null
})
</script>

<style scoped>
.pet-stage {
  width: 100%;
  height: 100%;
  position: relative;
}
.dock {
  width: 100%;
  height: 100%;
}
.dock.hidden {
  min-height: 1px;
}
.vrm-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 260px;
  overflow: visible;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.vrm-canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
  touch-action: none;
  background: transparent !important;
  cursor: inherit;
}
.cam-bar {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  z-index: 4;
  display: flex;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-bg-color-overlay, #1a1a1a) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color, #444) 70%, transparent);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}
.cam-btn {
  margin: 0 !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
  opacity: 0.75;
}
.cam-btn.active,
.cam-btn:hover {
  opacity: 1;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color, #111) 35%, transparent);
}
.overlay.muted {
  color: var(--el-text-color-secondary, #888);
}
.overlay.err {
  color: var(--el-color-danger, #f56c6c);
}
.sil {
  width: 48px;
  height: 60px;
  color: var(--el-text-color-secondary, #888);
}
.expand-host {
  width: 100%;
  height: min(62vh, 520px);
  min-height: 360px;
  border-radius: 12px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, rgba(96, 165, 250, 0.12), transparent 68%);
}
.expand-host :deep(.cam-bar) {
  display: none;
}
.expand-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.cele-layer {
  position: fixed;
  inset: 0;
  z-index: 5200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 35%, rgba(30, 20, 45, 0.72), rgba(8, 8, 14, 0.92));
  pointer-events: auto;
}
.cele-host {
  position: relative;
  z-index: 3;
  /* 几乎铺满视口，给舞蹈手臂横向摆动留空间 */
  width: min(100vw, 1400px);
  height: min(100vh, 980px);
  max-width: 100vw;
  max-height: 100vh;
}
.cele-host :deep(.cam-bar) {
  display: none;
}
.cele-host :deep(.vrm-wrap) {
  min-height: 100%;
  height: 100%;
}
.cele-caption {
  position: absolute;
  top: max(24px, 4vh);
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  font-size: clamp(22px, 4vw, 36px);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffe8a3;
  text-shadow: 0 2px 16px rgba(255, 180, 60, 0.55);
  pointer-events: none;
  white-space: nowrap;
}
</style>

<style>
.pet-expand-dialog .el-dialog__body {
  padding-top: 8px;
  padding-bottom: 8px;
}
body.pet-expand-open .pet-root {
  z-index: 1000 !important;
  pointer-events: none !important;
}
body.pet-celebrate-open .pet-root {
  z-index: 1000 !important;
  pointer-events: none !important;
}
</style>
