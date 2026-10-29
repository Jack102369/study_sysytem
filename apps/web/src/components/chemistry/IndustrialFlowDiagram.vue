<template>
  <div class="ifd" :class="{ 'is-mobile': isNarrow }">
    <div class="ifd-toolbar" v-if="showToolbar">
      <el-button-group>
        <el-button size="small" :disabled="busy || !hasSvg" @click="zoomOut">缩小</el-button>
        <el-button size="small" :disabled="busy || !hasSvg" @click="zoomIn">放大</el-button>
        <el-button size="small" :disabled="busy || !hasSvg" @click="resetZoom">重置</el-button>
        <el-button size="small" :disabled="busy || !hasSvg" @click="fitToContainer">适应</el-button>
      </el-button-group>
      <span class="ifd-scale" v-if="hasSvg">{{ Math.round(scale * 100) }}%</span>
    </div>

    <div v-if="loading" class="ifd-state">
      <el-skeleton :rows="4" animated />
      <p class="ifd-hint">流程图加载中…</p>
    </div>

    <el-empty v-else-if="empty" description="暂无流程图数据" />

    <el-alert
      v-else-if="errorMessage"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
    />

    <div
      v-else-if="blobUrl"
      ref="viewportRef"
      class="ifd-viewport"
      @wheel.prevent="onWheel"
    >
      <div
        class="ifd-canvas"
        :style="{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }"
      >
        <!-- 使用 blob img，避免 v-html 执行任意 SVG 脚本 -->
        <img
          class="ifd-img"
          :src="blobUrl"
          :alt="title || '工业流程图'"
          draggable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  IndustrialDiagramPublic,
  IndustrialSvgDisplayPayload,
} from '@/api/industrial-diagram'

const props = withDefaults(
  defineProps<{
    /** 已由后端渲染并校验的安全 SVG 载荷（推荐） */
    payload?: IndustrialSvgDisplayPayload | null
    /** 仅作元数据展示；本组件不自行渲染 Definition */
    diagram?: IndustrialDiagramPublic | null
    loading?: boolean
    error?: string | null
    showToolbar?: boolean
  }>(),
  {
    payload: null,
    diagram: null,
    loading: false,
    error: null,
    showToolbar: true,
  },
)

const scale = ref(1)
const viewportRef = ref<HTMLElement | null>(null)
const blobUrl = ref<string | null>(null)
const isNarrow = ref(false)
const localError = ref<string | null>(null)

const busy = computed(() => !!props.loading)
const errorMessage = computed(() => props.error || localError.value)
const empty = computed(
  () => !props.loading && !errorMessage.value && !props.payload?.svg && !props.diagram,
)
const hasSvg = computed(() => !!blobUrl.value)
const title = computed(() => props.payload?.renderReport?.metrics?.diagramId || props.diagram?.title || '')

const baseWidth = computed(() => props.payload?.width || 640)
const baseHeight = computed(() => props.payload?.height || 360)
const displayWidth = computed(() => baseWidth.value)
const displayHeight = computed(() => baseHeight.value)

const FORBIDDEN = /<script[\s>]|foreignObject|iframe|\son\w+\s*=|javascript:/i

function revoke() {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = null
  }
}

function applySvg(svg: string) {
  localError.value = null
  revoke()
  if (!svg.trim()) {
    localError.value = 'SVG 为空'
    return
  }
  if (FORBIDDEN.test(svg)) {
    localError.value = 'SVG 未通过安全检查，已拒绝展示'
    return
  }
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    localError.value = 'SVG 缺少 xmlns'
    return
  }
  if (props.payload?.renderReport && !props.payload.renderReport.valid) {
    localError.value = `渲染报告无效：${props.payload.renderReport.errors.join('; ')}`
    return
  }
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  blobUrl.value = URL.createObjectURL(blob)
}

watch(
  () => props.payload,
  (p) => {
    if (p?.svg) applySvg(p.svg)
    else if (!props.loading) revoke()
  },
  { immediate: true },
)

watch(
  () => props.diagram,
  (d) => {
    // 仅有 Public JSON、无 SVG 时：提示需后端渲染，不在前端拼 Definition
    if (!props.payload?.svg && d && !props.loading) {
      localError.value = null
      // 空态由 empty 处理；有 diagram 无 svg 时给出明确提示
      if (!props.error) {
        localError.value = '仅收到流程图公共数据，尚未提供安全 SVG。请先由服务端渲染。'
      }
    }
  },
)

function zoomIn() {
  scale.value = Math.min(3, Math.round((scale.value + 0.1) * 100) / 100)
}
function zoomOut() {
  scale.value = Math.max(0.4, Math.round((scale.value - 0.1) * 100) / 100)
}
function resetZoom() {
  scale.value = 1
}
function fitToContainer() {
  const el = viewportRef.value
  if (!el) return
  const avail = el.clientWidth - 16
  if (avail <= 0 || baseWidth.value <= 0) return
  scale.value = Math.max(0.4, Math.min(2, avail / baseWidth.value))
}
function onWheel(e: WheelEvent) {
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

function updateNarrow() {
  isNarrow.value = typeof window !== 'undefined' && window.innerWidth < 768
}

onMounted(() => {
  updateNarrow()
  window.addEventListener('resize', updateNarrow)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateNarrow)
  revoke()
})
</script>

<style scoped>
.ifd {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.ifd-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.ifd-scale {
  font-size: 12px;
  color: #64748b;
}
.ifd-viewport {
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid #e2e8f0;
  background: #fff;
  min-height: 180px;
  max-height: 70vh;
  padding: 8px;
}
.ifd-canvas {
  display: inline-block;
}
.ifd-img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
}
.ifd-state {
  padding: 12px;
}
.ifd-hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
}
.is-mobile .ifd-viewport {
  max-height: 55vh;
}
</style>
