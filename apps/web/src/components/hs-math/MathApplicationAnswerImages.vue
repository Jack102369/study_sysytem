<template>
  <div v-if="entries.length" class="ans-imgs">
    <div class="lab">
      解答图片
      <span v-if="previewList.length" class="lab-hint">（点击放大）</span>
    </div>
    <div class="thumbs">
      <div
        v-for="(e, idx) in entries"
        :key="e.imageId"
        class="thumb"
      >
        <el-image
          v-if="e.url"
          :src="e.url"
          :preview-src-list="previewList"
          :initial-index="previewIndex(e.imageId, idx)"
          fit="cover"
          preview-teleported
          alt="已提交解答图"
        />
        <div v-else-if="e.error" class="ph err">{{ e.error }}</div>
        <div v-else class="ph">加载中…</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { HsMathSubmittedHistoryImage } from '@/api/hs-math-train'
import {
  loadAuthImageObjectUrl,
  revokeAuthImageObjectUrl,
} from '@/utils/hs-math-auth-image'
import errMsg from '@/utils/err-msg'

const props = defineProps<{
  sessionId: string
  sessionItemId: string
  /** 优先使用 2D 返回的 submitted 元数据 */
  images?: HsMathSubmittedHistoryImage[] | null
  /** 回退：payload.imageIds */
  imageIds?: string[] | null
}>()

type Entry = {
  imageId: string
  url: string | null
  error: string
}

const entries = ref<Entry[]>([])

const previewList = computed(() =>
  entries.value.filter((e) => e.url).map((e) => e.url as string),
)

function previewIndex(imageId: string, fallbackIdx: number) {
  const urls = previewList.value
  const entry = entries.value.find((e) => e.imageId === imageId)
  if (!entry?.url) return Math.max(0, fallbackIdx)
  const i = urls.indexOf(entry.url)
  return i >= 0 ? i : Math.max(0, fallbackIdx)
}

function revokeAll() {
  for (const e of entries.value) {
    if (e.url) revokeAuthImageObjectUrl(e.url)
  }
  entries.value = []
}

async function load() {
  revokeAll()
  const fromMeta = (props.images || []).map((i) => String(i.imageId))
  const fromIds = (props.imageIds || []).map(String)
  const ids = fromMeta.length ? fromMeta : fromIds
  if (!ids.length || !props.sessionId || !props.sessionItemId) return

  entries.value = ids.map((imageId) => ({
    imageId,
    url: null,
    error: '',
  }))

  await Promise.all(
    entries.value.map(async (e) => {
      try {
        e.url = await loadAuthImageObjectUrl(
          props.sessionId,
          props.sessionItemId,
          e.imageId,
        )
      } catch (err) {
        e.error = errMsg(err, '图片读取失败')
      }
    }),
  )
}

watch(
  () =>
    [
      props.sessionId,
      props.sessionItemId,
      JSON.stringify(props.images || null),
      (props.imageIds || []).join(','),
    ] as const,
  () => {
    void load()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokeAll()
})
</script>

<style scoped>
.ans-imgs {
  margin-top: 8px;
}
.lab {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.lab-hint {
  font-weight: 400;
  opacity: 0.85;
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.thumb {
  width: 120px;
  height: 120px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  cursor: zoom-in;
}
.thumb :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: block;
}
.thumb :deep(.el-image__inner) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}
.ph {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 6px;
  text-align: center;
}
.ph.err {
  color: var(--el-color-danger);
}
</style>
