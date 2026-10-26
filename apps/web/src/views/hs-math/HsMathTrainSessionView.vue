<template>
  <div class="page-fill train-session" v-loading="loading">
    <div class="toolbar" v-if="session">
      <div class="left">
        <h1>{{ session.specialtyName }} · {{ session.categoryName }}</h1>
        <p class="sub">
          {{ difficultyLabel(session.difficulty) }} ·
          {{ session.answeredCount }}/{{ session.actualCount }} 已作答
          <span v-if="saveState" class="save-state">· {{ saveState }}</span>
        </p>
      </div>
      <el-tag v-if="session.status === 'in_progress'" type="warning">进行中</el-tag>
      <el-tag v-else-if="session.status === 'completed'" type="success">已完成</el-tag>
      <el-tag v-else type="info">已取消</el-tag>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      style="margin-bottom: 12px"
    >
      <el-button size="small" type="primary" link @click="reload">重试</el-button>
    </el-alert>

    <template v-if="session && current">
      <el-card shadow="never" class="q-card">
        <div class="q-head">
          <span>第 {{ current.sortOrder }} / {{ session.actualCount }} 题</span>
          <el-tag size="small" effect="plain">{{ qtypeLabel(current.qtype) }}</el-tag>
        </div>

        <MathStem class="stem" :text="current.stem" />

        <div class="ans">
          <MathOptionList
            v-if="current.qtype === 'single' || current.qtype === 'multi'"
            :mode="current.qtype"
            :options="optionList"
            :model-value="optionDraft"
            :disabled="!canAnswer"
            @update:model-value="onOptionChange"
          />
          <MathJudgeInput
            v-else-if="current.qtype === 'judge'"
            v-model="judgeDraft"
            :disabled="!canAnswer"
            @update:model-value="onJudgeChange"
          />
          <MathNumericInput
            v-else-if="current.qtype === 'numeric'"
            v-model="numericDraft"
            :disabled="!canAnswer"
            @update:model-value="onNumericChange"
          />
          <MathApplicationInput
            v-else-if="current.qtype === 'application'"
            v-model="applicationDraft"
            :session-id="session.id"
            :session-item-id="current.id"
            :disabled="!canAnswer"
            @update:model-value="onApplicationChange"
            @uploading-change="onApplicationUploading"
          />
        </div>

        <div class="nav">
          <el-button :disabled="current.sortOrder <= 1" @click="goPrev">上一题</el-button>
          <el-button
            v-if="canAnswer"
            :loading="saving"
            type="primary"
            plain
            :disabled="applicationUploading"
            @click="() => void saveCurrent(true)"
          >
            保存答案
          </el-button>
          <el-button
            :disabled="current.sortOrder >= session.actualCount"
            @click="goNext"
          >
            下一题
          </el-button>
        </div>
      </el-card>

      <div class="footer">
        <el-button @click="goHome">返回首页</el-button>
        <el-button
          v-if="session.status === 'completed'"
          type="primary"
          @click="goResult"
        >
          查看结果
        </el-button>
        <el-button
          v-else-if="canAnswer"
          type="primary"
          :loading="submitting"
          :disabled="applicationUploading"
          @click="onSubmit"
        >
          提交训练
        </el-button>
        <span v-if="applicationUploading" class="upload-hint">图片上传中，请稍候…</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MathStem from '@/components/hs-math/MathStem.vue'
import MathOptionList from '@/components/hs-math/MathOptionList.vue'
import MathJudgeInput from '@/components/hs-math/MathJudgeInput.vue'
import MathNumericInput from '@/components/hs-math/MathNumericInput.vue'
import MathApplicationInput from '@/components/hs-math/MathApplicationInput.vue'
import {
  getHsMathTrainSession,
  saveHsMathTrainAnswer,
  submitHsMathTrainSession,
  type HsMathSessionDetail,
  type HsMathSessionItem,
  type HsMathUserAnswerPayload,
} from '@/api/hs-math-train'
import { difficultyLabel, qtypeLabel } from '@/utils/hs-math-format'
import {
  buildApplicationUserAnswer,
  draftFromApplicationPayload,
  emptyApplicationDraft,
  type ApplicationAnswerDraft,
} from '@/utils/hs-math-auth-image'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const session = ref<HsMathSessionDetail | null>(null)
const index = ref(0)
const saving = ref(false)
const submitting = ref(false)
const saveState = ref('')
const optionDraft = ref<string | string[] | null>(null)
const judgeDraft = ref<boolean | null>(null)
const numericDraft = ref('')
const applicationDraft = ref<ApplicationAnswerDraft>(emptyApplicationDraft())
const applicationUploading = ref(false)

/** 进行中的保存 Promise，提交前必须全部完成 */
const inflight = new Map<number, Promise<void>>()
let dirtySortOrder: number | null = null

const canAnswer = computed(() => session.value?.status === 'in_progress')
const current = computed<HsMathSessionItem | null>(() => {
  if (!session.value) return null
  return session.value.items[index.value] || null
})
const optionList = computed(
  () => current.value?.optionsJson?.options || [],
)

function syncDraftFromItem(item: HsMathSessionItem | null) {
  dirtySortOrder = null
  if (!item) {
    optionDraft.value = null
    judgeDraft.value = null
    numericDraft.value = ''
    applicationDraft.value = emptyApplicationDraft()
    applicationUploading.value = false
    return
  }
  const a = item.userAnswerPayloadJson
  if (item.qtype === 'single') {
    optionDraft.value =
      a && a.kind === 'single' ? a.optionId : null
  } else if (item.qtype === 'multi') {
    optionDraft.value =
      a && a.kind === 'multi' ? [...a.optionIds] : []
  } else if (item.qtype === 'judge') {
    judgeDraft.value =
      a && a.kind === 'judge' ? a.value : null
  } else if (item.qtype === 'numeric') {
    numericDraft.value =
      a && a.kind === 'numeric' ? a.input : ''
  } else if (item.qtype === 'application') {
    applicationDraft.value = draftFromApplicationPayload(a)
    applicationUploading.value = false
  }
}

function buildPayload(item: HsMathSessionItem): HsMathUserAnswerPayload | null {
  if (item.qtype === 'single') {
    const id = typeof optionDraft.value === 'string' ? optionDraft.value : ''
    if (!id) return null
    return { kind: 'single', optionId: id }
  }
  if (item.qtype === 'multi') {
    const ids = Array.isArray(optionDraft.value) ? optionDraft.value : []
    if (!ids.length) return null
    return { kind: 'multi', optionIds: [...new Set(ids)] }
  }
  if (item.qtype === 'judge') {
    if (judgeDraft.value === null) return null
    return { kind: 'judge', value: judgeDraft.value }
  }
  if (item.qtype === 'numeric') {
    const input = numericDraft.value
    if (!input.trim()) return null
    return { kind: 'numeric', input }
  }
  if (item.qtype === 'application') {
    return buildApplicationUserAnswer(
      applicationDraft.value.text,
      applicationDraft.value.imageIds,
      applicationUploading.value,
      applicationDraft.value.gradingProvider,
    )
  }
  return null
}

function onOptionChange(v: string | string[]) {
  optionDraft.value = v
  dirtySortOrder = current.value?.sortOrder ?? null
  void saveCurrent(false)
}
function onJudgeChange(v: boolean) {
  judgeDraft.value = v
  dirtySortOrder = current.value?.sortOrder ?? null
  void saveCurrent(false)
}
function onNumericChange(v: string) {
  numericDraft.value = v
  dirtySortOrder = current.value?.sortOrder ?? null
}
function onApplicationChange(v: ApplicationAnswerDraft) {
  applicationDraft.value = {
    text: v.text,
    imageIds: [...v.imageIds],
    gradingProvider: v.gradingProvider === 'deepseek' ? 'deepseek' : 'qwen',
  }
  dirtySortOrder = current.value?.sortOrder ?? null
}

function onApplicationUploading(uploading: boolean) {
  applicationUploading.value = uploading
}

async function saveCurrent(showOk: boolean, opts?: { allowDuringSubmit?: boolean }) {
  if (!session.value || !current.value || !canAnswer.value) return
  // 提交过程中禁止「新的」用户触发保存；但提交前 flush 必须允许
  if (submitting.value && !opts?.allowDuringSubmit) return
  if (applicationUploading.value) {
    if (showOk) ElMessage.warning('图片仍在上传，请完成后再保存')
    return
  }
  const item = current.value
  const sortOrder = item.sortOrder
  const payload = buildPayload(item)

  const run = (async () => {
    saving.value = true
    saveState.value = '保存中…'
    try {
      const next = await saveHsMathTrainAnswer(session.value!.id, {
        sortOrder,
        userAnswerPayload: payload,
      })
      session.value = next
      if (dirtySortOrder === sortOrder) dirtySortOrder = null
      saveState.value = '已保存'
      if (showOk) ElMessage.success('答案已保存')
    } catch (e) {
      saveState.value = '保存失败'
      ElMessage.error(errMsg(e, '保存答案失败'))
      throw e
    } finally {
      saving.value = false
      inflight.delete(sortOrder)
    }
  })()

  inflight.set(sortOrder, run)
  await run
}

async function flushAllSaves(opts?: { allowDuringSubmit?: boolean }) {
  if (dirtySortOrder != null && current.value) {
    await saveCurrent(false, opts)
  }
  const pending = [...inflight.values()]
  if (pending.length) await Promise.all(pending)
}

async function goPrev() {
  if (!session.value || index.value <= 0) return
  try {
    await flushAllSaves()
  } catch {
    return
  }
  index.value -= 1
  syncDraftFromItem(current.value)
}

async function goNext() {
  if (!session.value || index.value >= session.value.items.length - 1) return
  try {
    await flushAllSaves()
  } catch {
    return
  }
  index.value += 1
  syncDraftFromItem(current.value)
}

function goHome() {
  void router.push('/hs-math')
}
function goResult() {
  if (!session.value) return
  void router.push(
    `/hs-math/train/result/${encodeURIComponent(session.value.id)}`,
  )
}

async function onSubmit() {
  if (!session.value || !canAnswer.value || submitting.value) return
  if (applicationUploading.value) {
    ElMessage.warning('图片仍在上传，请完成后再提交')
    return
  }
  const unanswered =
    session.value.actualCount - session.value.answeredCount
  try {
    await ElMessageBox.confirm(
      unanswered > 0
        ? `还有 ${unanswered} 题未作答，确认提交？未作答题将按错误或待复核/待 AI 批改处理（以后端为准）。`
        : '确认提交本场训练？提交后不可再修改答案。应用题将进入「待 AI 批改」。',
      '提交训练',
      { type: 'warning', confirmButtonText: '提交', cancelButtonText: '再检查' },
    )
  } catch {
    return
  }

  // 先 flush 未保存答案，再置 submitting，避免 saveCurrent 被 submitting 短路丢掉末题
  saveState.value = '提交前保存…'
  try {
    await flushAllSaves()
  } catch {
    ElMessage.error('仍有答案保存失败，请重试保存后再提交')
    return
  }

  submitting.value = true
  try {
    // 双保险：若 flush 期间又产生 dirty（极少），允许在 submitting 下再刷一次
    await flushAllSaves({ allowDuringSubmit: true })
  } catch {
    submitting.value = false
    ElMessage.error('仍有答案保存失败，请重试保存后再提交')
    return
  }

  try {
    const res = await submitHsMathTrainSession(session.value.id)
    session.value = res
    if (res.submitMeta?.idempotent) {
      ElMessage.info('该训练已提交过，已进入结果页')
    } else {
      ElMessage.success('提交成功')
    }
    void router.push(
      `/hs-math/train/result/${encodeURIComponent(res.id)}`,
    )
  } catch (e) {
    // 网络超时：查询是否已完成
    try {
      const latest = await getHsMathTrainSession(session.value.id)
      if (latest.status === 'completed') {
        session.value = latest
        ElMessage.success('训练已在服务端完成，进入结果页')
        void router.push(
          `/hs-math/train/result/${encodeURIComponent(latest.id)}`,
        )
        return
      }
    } catch {
      /* ignore */
    }
    ElMessage.error(errMsg(e, '提交失败，可重试'))
  } finally {
    submitting.value = false
  }
}

async function reload() {
  const id = String(route.params.id || '')
  if (!id) return
  loading.value = true
  loadError.value = ''
  try {
    session.value = await getHsMathTrainSession(id)
    if (session.value.status === 'completed') {
      // 允许查看但引导结果页也可
    }
    index.value = 0
    syncDraftFromItem(current.value)
  } catch (e) {
    session.value = null
    loadError.value = errMsg(e, '加载训练失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => void reload(),
)

onMounted(() => void reload())
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0 0 4px;
  font-size: 20px;
}
.sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.save-state {
  color: var(--el-color-primary);
}
.q-card {
  margin-bottom: 12px;
}
.q-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.stem {
  margin-bottom: 16px;
  font-size: 15px;
}
.ans {
  margin-bottom: 16px;
}
.nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.upload-hint {
  font-size: 13px;
  color: var(--el-color-warning);
}
</style>
