<template>
  <div v-if="assets.length" class="tsid">
    <p class="tsid-label">工业流程图</p>
    <div v-for="a in sorted" :key="a.id" class="tsid-block">
      <p v-if="sorted.length > 1" class="tsid-role">
        {{ roleLabel(a) }} · 版本 {{ a.diagramVersion || '—' }}
      </p>
      <IndustrialFlowDiagram
        :payload="payloads[a.id] || null"
        :loading="!!loading[a.id]"
        :error="errors[a.id] || null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import IndustrialFlowDiagram from '@/components/chemistry/IndustrialFlowDiagram.vue'
import {
  fetchChemTrainSessionDiagramSvg,
  type TrainSessionDiagramAsset,
} from '@/api/chemistry-train'
import type { IndustrialSvgDisplayPayload } from '@/api/industrial-diagram'

const props = defineProps<{
  sessionId: string
  sessionItemId: string
  assets: TrainSessionDiagramAsset[]
}>()

const sorted = computed(() =>
  [...(props.assets || [])].sort((x, y) => x.sortOrder - y.sortOrder || Number(x.id) - Number(y.id)),
)

const loading = reactive<Record<string, boolean>>({})
const errors = reactive<Record<string, string | null>>({})
const payloads = reactive<Record<string, IndustrialSvgDisplayPayload | null>>({})

function roleLabel(a: TrainSessionDiagramAsset) {
  if (a.assetType === 'industrial_apparatus_svg') {
    return a.assetRole === 'supporting_diagram' ? '装置附图' : '装置图'
  }
  if (a.assetRole === 'supporting_diagram') return '附图'
  return '题图'
}

async function loadOne(a: TrainSessionDiagramAsset) {
  loading[a.id] = true
  errors[a.id] = null
  payloads[a.id] = null
  try {
    const blob = await fetchChemTrainSessionDiagramSvg({
      sessionId: props.sessionId,
      sessionItemId: props.sessionItemId,
      assetId: a.id,
    })
    const svg = await blob.text()
    if (blob.type && !blob.type.includes('svg') && svg.trim().startsWith('{')) {
      throw new Error('资源接口返回非 SVG（可能未授权）')
    }
    payloads[a.id] = {
      svg,
      width: 640,
      height: 360,
      viewBox: '0 0 640 360',
      publicContentHash: a.contentHash,
      renderReport: {
        valid: true,
        errors: [],
        warnings: [],
        metrics: {
          diagramId: a.id,
          diagramVersion: a.diagramVersion,
          publicContentHash: a.contentHash,
          rendererVersion: a.diagramVersion || '1.0.0',
          nodeCount: 0,
          edgeCount: 0,
          drawnNodeCount: 0,
          drawnEdgeCount: 0,
          canvasWidth: 640,
          canvasHeight: 360,
        },
      },
    }
  } catch (e) {
    errors[a.id] = e instanceof Error ? e.message : '流程图加载失败'
  } finally {
    loading[a.id] = false
  }
}

async function loadAll() {
  for (const a of sorted.value) {
    await loadOne(a)
  }
}

watch(
  () => [props.sessionId, props.sessionItemId, sorted.value.map((x) => x.id).join(',')],
  () => {
    void loadAll()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  for (const k of Object.keys(payloads)) payloads[k] = null
})
</script>

<style scoped>
.tsid {
  margin: 12px 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tsid-label {
  margin: 0;
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}
.tsid-role {
  margin: 0 0 6px;
  font-size: 12px;
  color: #64748b;
}
.tsid-block {
  width: 100%;
}
</style>
