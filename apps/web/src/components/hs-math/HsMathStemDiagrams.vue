<template>
  <div v-if="slots.length" class="stem-diagrams">
    <div
      v-for="it in slots"
      :key="it.key"
      class="thumb"
      @click="openPreview(it)"
    >
      <img v-if="it.blobUrl" :src="it.blobUrl" :alt="it.alt || '题干插图'" />
      <div v-else class="ph">加载中…</div>
    </div>

    <el-dialog
      v-model="previewOpen"
      title="插图预览"
      width="90%"
      top="5vh"
      destroy-on-close
      @closed="onPreviewClosed"
    >
      <div class="preview-wrap">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="预览"
          class="preview-img"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import http from '@/api/http'

export type StemDiagramItem = {
  key: string
  contentPath: string
  alt?: string | null
}

const props = defineProps<{
  items: StemDiagramItem[]
}>()

type Slot = StemDiagramItem & { blobUrl: string | null }

const slots = ref<Slot[]>([])
const previewOpen = ref(false)
const previewUrl = ref<string | null>(null)

async function hydrate() {
  for (const s of slots.value) {
    if (s.blobUrl) {
      URL.revokeObjectURL(s.blobUrl)
      s.blobUrl = null
    }
  }
  slots.value = props.items.map((it) => ({ ...it, blobUrl: null }))
  await Promise.all(
    slots.value.map(async (s) => {
      try {
        const res = await http.get(s.contentPath, { responseType: 'blob' })
        s.blobUrl = URL.createObjectURL(res.data as Blob)
      } catch {
        s.blobUrl = null
      }
    }),
  )
}

watch(
  () => props.items.map((x) => x.key + '|' + x.contentPath).join(','),
  () => {
    void hydrate()
  },
  { immediate: true },
)

function openPreview(it: Slot) {
  if (!it.blobUrl) return
  previewUrl.value = it.blobUrl
  previewOpen.value = true
}

function onPreviewClosed() {
  previewUrl.value = null
}

onBeforeUnmount(() => {
  for (const s of slots.value) {
    if (s.blobUrl) URL.revokeObjectURL(s.blobUrl)
  }
})
</script>

<style scoped>
.stem-diagrams {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0 4px;
}
.thumb {
  width: min(220px, 100%);
  max-height: 180px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  cursor: zoom-in;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
}
.ph {
  padding: 24px;
  color: #999;
  font-size: 12px;
}
.preview-wrap {
  display: flex;
  justify-content: center;
  max-height: 75vh;
  overflow: auto;
}
.preview-img {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
}
</style>
