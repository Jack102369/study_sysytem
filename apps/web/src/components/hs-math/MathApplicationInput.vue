<template>
  <div class="app-ans">
    <el-input
      :model-value="modelValue.text"
      type="textarea"
      :rows="8"
      :disabled="disabled"
      placeholder="请写出完整解题步骤（可只写文字、只传图片，或文图混合；支持 $公式$ 文本）"
      @update:model-value="onText"
    />

    <div class="provider-block">
      <div class="provider-label">批改模型</div>
      <el-radio-group
        :model-value="modelValue.gradingProvider"
        :disabled="disabled"
        @update:model-value="onProvider"
      >
        <el-radio value="qwen">千问（推荐）</el-radio>
        <el-radio value="deepseek">DeepSeek</el-radio>
      </el-radio-group>
      <p class="provider-hint">
        默认推荐千问。千问支持文字与图片批改；DeepSeek
        纯文字直评，含图时由千问先识别再交 DeepSeek
        评分（DeepSeek 每日有次数上限）。提交后批改模型不可更改。
      </p>
    </div>

    <div class="img-block">
      <div class="img-head">
        <span
          >解答图片（最多 {{ maxCount }} 张，请按解题顺序上传；JPEG/PNG/WebP，单张
          ≤10MB；文件名任意）</span
        >
        <span class="cnt">{{ modelValue.imageIds.length }} / {{ maxCount }}</span>
      </div>

      <div class="thumbs">
        <div
          v-for="slot in slots"
          :key="slot.key"
          class="thumb"
          :class="{ uploading: slot.uploading, error: !!slot.error }"
        >
          <img v-if="slot.previewUrl" :src="slot.previewUrl" alt="解答图" />
          <div v-else class="ph">{{ slot.uploading ? '上传中' : '…' }}</div>
          <el-progress
            v-if="slot.uploading"
            :percentage="slot.percent"
            :stroke-width="4"
            class="prog"
          />
          <el-button
            v-if="!disabled && slot.imageId && !slot.uploading"
            class="del"
            type="danger"
            size="small"
            circle
            :loading="slot.deleting"
            @click="onDelete(slot.imageId)"
          >
            <span aria-hidden="true">×</span>
          </el-button>
          <p v-if="slot.error" class="err">{{ slot.error }}</p>
        </div>

        <el-upload
          v-if="!disabled && modelValue.imageIds.length < maxCount && !busyUpload"
          class="uploader"
          :show-file-list="false"
          :disabled="disabled"
          accept="image/jpeg,image/png,image/webp"
          :http-request="onHttpRequest"
          :before-upload="beforeUpload"
        >
          <el-button type="primary" plain size="small">选择 / 拍照</el-button>
        </el-upload>
      </div>

      <!-- 隐藏 input 补充 capture，便于手机后置拍照 -->
      <input
        v-if="!disabled && modelValue.imageIds.length < maxCount"
        ref="cameraInput"
        class="cam-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        @change="onCameraPick"
      />
      <el-button
        v-if="!disabled && modelValue.imageIds.length < maxCount"
        size="small"
        class="cam-btn"
        @click="triggerCamera"
      >
        手机拍照
      </el-button>
    </div>

      <p class="hint">
        最多上传 {{ maxCount }} 张，请按解题顺序上传（顺序以列表为准，与文件名无关）。应用题提交后将进入「待
        AI 批改」，不会立即判对错。上传未完成时不可提交训练；提交后图片锁定不可删。
      </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import {
  deleteHsMathSessionItemImage,
  uploadHsMathSessionItemImage,
} from '@/api/hs-math-train'
import {
  HS_MATH_APP_IMAGE_MAX_COUNT,
  loadAuthImageObjectUrl,
  revokeAuthImageObjectUrl,
  type ApplicationAnswerDraft,
  type HsMathGradingProvider,
  validateClientImageFile,
} from '@/utils/hs-math-auth-image'
import errMsg from '@/utils/err-msg'

type Slot = {
  key: string
  imageId: string | null
  previewUrl: string | null
  localBlob: boolean
  uploading: boolean
  deleting: boolean
  percent: number
  error: string
}

const props = defineProps<{
  modelValue: ApplicationAnswerDraft
  sessionId: string
  sessionItemId: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ApplicationAnswerDraft]
  'uploading-change': [uploading: boolean]
}>()

const maxCount = HS_MATH_APP_IMAGE_MAX_COUNT
const slots = ref<Slot[]>([])
const cameraInput = ref<HTMLInputElement | null>(null)
const pendingUploads = ref(0)

const busyUpload = computed(() => pendingUploads.value > 0)

function emitUploading() {
  emit('uploading-change', pendingUploads.value > 0)
}

function patchDraft(partial: Partial<ApplicationAnswerDraft>) {
  emit('update:modelValue', {
    text: partial.text ?? props.modelValue.text,
    imageIds: partial.imageIds ?? [...props.modelValue.imageIds],
    gradingProvider:
      partial.gradingProvider ?? props.modelValue.gradingProvider ?? 'qwen',
  })
}

function onText(v: string) {
  patchDraft({ text: v })
}

function onProvider(v: string | number | boolean | undefined) {
  const p: HsMathGradingProvider = v === 'deepseek' ? 'deepseek' : 'qwen'
  patchDraft({ gradingProvider: p })
}

function revokeAll() {
  for (const s of slots.value) {
    if (s.previewUrl) revokeAuthImageObjectUrl(s.previewUrl)
  }
  slots.value = []
}

async function hydrateFromIds(ids: string[]) {
  const keep = new Map(
    slots.value
      .filter((s) => s.imageId && ids.includes(s.imageId))
      .map((s) => [s.imageId!, s]),
  )
  const next: Slot[] = []
  for (const id of ids) {
    const existing = keep.get(id)
    if (existing) {
      next.push(existing)
      keep.delete(id)
      continue
    }
    const slot: Slot = {
      key: `id-${id}`,
      imageId: id,
      previewUrl: null,
      localBlob: false,
      uploading: false,
      deleting: false,
      percent: 100,
      error: '',
    }
    next.push(slot)
    try {
      slot.previewUrl = await loadAuthImageObjectUrl(
        props.sessionId,
        props.sessionItemId,
        id,
      )
    } catch (e) {
      slot.error = errMsg(e, '图片加载失败')
    }
  }
  for (const orphan of keep.values()) {
    if (orphan.previewUrl) revokeAuthImageObjectUrl(orphan.previewUrl)
  }
  // 保留进行中的上传槽
  const uploading = slots.value.filter((s) => s.uploading)
  slots.value = [...next, ...uploading]
}

let lastItemKey = ''

watch(
  () =>
    [
      props.sessionId,
      props.sessionItemId,
      props.modelValue.imageIds.join(','),
    ] as const,
  ([sid, itemId]) => {
    const itemKey = `${sid}:${itemId}`
    if (itemKey !== lastItemKey) {
      revokeAll()
      pendingUploads.value = 0
      emitUploading()
      lastItemKey = itemKey
    }
    void hydrateFromIds([...props.modelValue.imageIds])
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokeAll()
  pendingUploads.value = 0
  emitUploading()
})

function beforeUpload(file: File) {
  const gate = validateClientImageFile(
    file,
    props.modelValue.imageIds.length + pendingUploads.value,
  )
  if (!gate.ok) {
    ElMessage.error(gate.message)
    return false
  }
  return true
}

async function runUpload(file: File) {
  const gate = validateClientImageFile(
    file,
    props.modelValue.imageIds.length + pendingUploads.value,
  )
  if (!gate.ok) {
    ElMessage.error(gate.message)
    return
  }

  const localUrl = URL.createObjectURL(file)
  const slot: Slot = {
    key: `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageId: null,
    previewUrl: localUrl,
    localBlob: true,
    uploading: true,
    deleting: false,
    percent: 0,
    error: '',
  }
  slots.value = [...slots.value, slot]
  pendingUploads.value += 1
  emitUploading()

  try {
    const meta = await uploadHsMathSessionItemImage(
      props.sessionId,
      props.sessionItemId,
      file,
      (p) => {
        slot.percent = p
      },
    )
    slot.uploading = false
    slot.percent = 100
    slot.imageId = String(meta.imageId)
    const ids = [...props.modelValue.imageIds, String(meta.imageId)]
    patchDraft({ imageIds: ids })
  } catch (e) {
    slot.uploading = false
    slot.error = errMsg(e, '上传失败')
    ElMessage.error(slot.error)
    if (slot.previewUrl) revokeAuthImageObjectUrl(slot.previewUrl)
    slots.value = slots.value.filter((s) => s.key !== slot.key)
  } finally {
    pendingUploads.value = Math.max(0, pendingUploads.value - 1)
    emitUploading()
  }
}

function onHttpRequest(opts: UploadRequestOptions) {
  const file = opts.file as File
  void runUpload(file)
    .then(() => opts.onSuccess?.({} as never))
    .catch((err) => opts.onError?.(err as never))
}

function triggerCamera() {
  cameraInput.value?.click()
}

function onCameraPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (beforeUpload(file) === false) return
  void runUpload(file)
}

async function onDelete(imageId: string) {
  if (props.disabled) return
  const slot = slots.value.find((s) => s.imageId === imageId)
  if (!slot) return
  slot.deleting = true
  try {
    await deleteHsMathSessionItemImage(
      props.sessionId,
      props.sessionItemId,
      imageId,
    )
    if (slot.previewUrl) revokeAuthImageObjectUrl(slot.previewUrl)
    slots.value = slots.value.filter((s) => s.imageId !== imageId)
    patchDraft({
      imageIds: props.modelValue.imageIds.filter((id) => id !== imageId),
    })
    ElMessage.success('已删除图片')
  } catch (e) {
    ElMessage.error(errMsg(e, '删除图片失败'))
  } finally {
    slot.deleting = false
  }
}
</script>

<style scoped>
.app-ans {
  margin-top: 8px;
}
.img-block {
  margin-top: 12px;
}
.img-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}
.cnt {
  color: var(--el-text-color-secondary);
}
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}
.thumb {
  position: relative;
  width: 96px;
  height: 96px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ph {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.prog {
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 4px;
}
.del {
  position: absolute;
  top: 4px;
  right: 4px;
}
.err {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 4px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.uploader {
  align-self: center;
}
.cam-hidden {
  display: none;
}
.cam-btn {
  margin-top: 8px;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.provider-block {
  margin: 12px 0 4px;
}
.provider-label {
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
}
.provider-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
