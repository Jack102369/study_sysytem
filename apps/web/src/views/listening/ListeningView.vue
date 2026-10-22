<template>
  <div class="page-fill listening-page" v-loading="loading">
    <div class="toolbar">
      <h1>英文听力</h1>
    </div>

    <div class="layout">
      <section class="panel compose">
        <el-form label-width="72px">
          <el-form-item label="标题">
            <el-input
              v-model="form.title"
              maxlength="128"
              clearable
              placeholder="可选，默认取正文前几字"
            />
          </el-form-item>
          <el-form-item label="英文" required>
            <el-input
              v-model="form.contentText"
              type="textarea"
              :rows="8"
              maxlength="2000"
              show-word-limit
              placeholder="输入英文文本，将由本机 Piper 合成语音并保存"
            />
          </el-form-item>
          <el-form-item label="声音" required>
            <el-select
              v-model="form.voiceKey"
              style="width: 100%"
              placeholder="选择人声"
              :loading="voicesLoading"
            >
              <el-option
                v-for="v in voices"
                :key="v.key"
                :label="voiceOptionLabel(v)"
                :value="v.key"
                :disabled="!v.available"
              />
            </el-select>
            <div class="speed-hint">
              灰色项表示本机尚未安装对应模型；安装说明见 docs/piper-windows.md
            </div>
          </el-form-item>
          <el-form-item label="语速">
            <div class="speed-row">
              <el-slider
                v-model="form.lengthScale"
                :min="0.7"
                :max="1.8"
                :step="0.05"
                :format-tooltip="formatScaleTip"
                style="flex: 1"
                @change="onLengthScaleChange"
              />
              <span class="speed-value">{{ form.lengthScale.toFixed(2) }}</span>
            </div>
            <div class="speed-hint">数值越大越慢（0.7 最快，1.0 正常，1.8 最慢）</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="generating" @click="onGenerate">
              生成并保存
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="current" class="player-box">
          <div class="player-title">{{ current.title || '当前材料' }}</div>
          <audio
            ref="audioEl"
            :src="audioSrc(current.audioUrl)"
            controls
            class="audio"
          />
          <div class="playback-row">
            <span>临时语速</span>
            <el-slider
              v-model="tempScale"
              :min="0.7"
              :max="1.8"
              :step="0.05"
              :format-tooltip="formatScaleTip"
              style="flex: 1; margin: 0 12px"
              @change="applyTempScale"
            />
            <span class="speed-value">{{ tempScale.toFixed(2) }}</span>
          </div>
          <div class="speed-hint">
            与上方语速同一套数值（越大越慢）；默认等于该材料生成时的语速
          </div>
        </div>
      </section>

      <section class="panel history">
        <div class="history-head">
          <h2>历史</h2>
          <el-button text type="primary" @click="reload">刷新</el-button>
        </div>
        <el-table v-if="rows.length" :data="rows" stripe height="100%" @row-click="onPlayRow">
          <el-table-column label="标题" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ row.title || '—' }}</template>
          </el-table-column>
          <el-table-column label="声音" width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ voiceLabel(row.voiceKey) }}</template>
          </el-table-column>
          <el-table-column label="语速" width="72" align="center">
            <template #default="{ row }">{{ Number(row.lengthScale).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="时长" width="72" align="center">
            <template #default="{ row }">{{ formatDuration(row.durationMs) }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" sortable>
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="onPlayRow(row)">播放</el-button>
              <el-button
                link
                type="primary"
                :disabled="!row.audioUrl"
                @click.stop="onDownload(row)"
              >
                下载
              </el-button>
              <el-button link type="danger" @click.stop="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!loading" description="暂无听力材料" />
        <div class="pager" v-if="total > 0">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="onPage"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createListeningMaterial,
  deleteListeningMaterial,
  listListeningMaterials,
  listListeningVoices,
  type ListeningMaterial,
  type ListeningVoice,
} from '@/api/listening'
import errMsg from '@/utils/err-msg'
import { fileUrl } from '@/utils/api-base'

const loading = ref(false)
const generating = ref(false)
const voicesLoading = ref(false)
const voices = ref<ListeningVoice[]>([])
const rows = ref<ListeningMaterial[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const current = ref<ListeningMaterial | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
/** 与生成语速同一套刻度：越大越慢；默认对齐材料的 lengthScale */
const tempScale = ref(1)

const form = reactive({
  title: '',
  contentText: '',
  voiceKey: 'en_GB-alba-medium',
  lengthScale: 1,
})

function voiceOptionLabel(v: ListeningVoice) {
  return v.available ? v.label : `${v.label}（未安装）`
}

function voiceLabel(key: string | null | undefined) {
  if (!key) return '—'
  return voices.value.find((v) => v.key === key)?.label || key
}

function formatScaleTip(v: number) {
  if (v < 0.95) return `较快 ${v.toFixed(2)}`
  if (v > 1.05) return `较慢 ${v.toFixed(2)}`
  return `正常 ${v.toFixed(2)}`
}

function onLengthScaleChange() {
  tempScale.value = form.lengthScale
  applyTempScale()
}

/**
 * 音频已按生成语速烘进文件。
 * 临时语速与生成语速相同时按 1.0 播放；调大临时语速=更慢，调小=更快。
 */
function applyTempScale() {
  if (!audioEl.value) return
  const gen = Number(current.value?.lengthScale) || 1
  const temp = tempScale.value || 1
  const rate = gen / temp
  audioEl.value.playbackRate = Math.min(4, Math.max(0.25, rate))
}

function formatTime(raw: string | Date | null | undefined) {
  if (!raw) return '—'
  return String(raw).slice(0, 19).replace('T', ' ')
}

function formatDuration(ms: number | null | undefined) {
  if (!ms || ms <= 0) return '—'
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`
}

function audioSrc(url: string | null | undefined) {
  if (!url) return ''
  return fileUrl(url)
}

async function reload() {
  loading.value = true
  try {
    const data = await listListeningMaterials({ page: page.value, pageSize })
    rows.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  page.value = p
  reload()
}

async function onGenerate() {
  const text = form.contentText.trim()
  if (!text) {
    ElMessage.warning('请输入英文文本')
    return
  }
  generating.value = true
  try {
    const item = await createListeningMaterial({
      contentText: text,
      title: form.title.trim() || null,
      voiceKey: form.voiceKey,
      lengthScale: form.lengthScale,
    })
    ElMessage.success('已生成并保存')
    current.value = item
    tempScale.value = Number(item.lengthScale) || form.lengthScale
    page.value = 1
    await reload()
    await nextTick()
    applyTempScale()
    audioEl.value?.play().catch(() => undefined)
  } catch (e) {
    ElMessage.error(errMsg(e, '生成失败'))
  } finally {
    generating.value = false
  }
}

async function onPlayRow(row: ListeningMaterial) {
  current.value = row
  tempScale.value = Number(row.lengthScale) || 1
  await nextTick()
  applyTempScale()
  if (!row.audioUrl) {
    ElMessage.warning('暂无音频文件')
    return
  }
  audioEl.value?.play().catch(() => undefined)
}

function safeFileName(title: string | null | undefined, id: string) {
  const base = (title || `listening-${id}`).replace(/[\\/:*?"<>|]/g, '_').trim()
  return base.toLowerCase().endsWith('.wav') ? base : `${base}.wav`
}

async function onDownload(row: ListeningMaterial) {
  if (!row.audioUrl) {
    ElMessage.warning('暂无音频文件')
    return
  }
  const url = fileUrl(row.audioUrl)
  const name = safeFileName(row.title, row.id)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    // 回退：新窗口打开（部分环境跨域时 download 属性无效）
    window.open(url, '_blank')
  }
}

async function onDelete(row: ListeningMaterial) {
  try {
    await ElMessageBox.confirm('确定删除该听力材料？音频文件也会删除。', '提示', {
      type: 'warning',
    })
    await deleteListeningMaterial(row.id)
    ElMessage.success('已删除')
    if (current.value?.id === row.id) current.value = null
    await reload()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e, '删除失败'))
  }
}

async function loadVoices() {
  voicesLoading.value = true
  try {
    const data = await listListeningVoices()
    voices.value = data.items
    const firstOk = data.items.find((v) => v.available)
    if (firstOk && !data.items.some((v) => v.key === form.voiceKey && v.available)) {
      form.voiceKey = firstOk.key
    }
  } catch (e) {
    ElMessage.error(errMsg(e, '加载音色列表失败'))
  } finally {
    voicesLoading.value = false
  }
}

onMounted(async () => {
  await loadVoices()
  await reload()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(360px, 1.2fr);
  gap: 16px;
}
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.history {
  overflow: hidden;
}
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.history-head h2 {
  margin: 0;
  font-size: 16px;
}
.speed-row,
.playback-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.speed-value {
  width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.speed-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.player-box {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.player-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.audio {
  width: 100%;
  margin-bottom: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
