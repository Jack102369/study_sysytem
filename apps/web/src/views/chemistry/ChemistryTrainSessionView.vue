<template>
  <div class="page-fill train-session" v-loading="loading">
    <div class="toolbar" v-if="session">
      <div class="left">
        <h1>{{ session.specialtyName }} · {{ session.categoryName }}</h1>
        <p class="sub">
          {{ session.difficultyLabel }} ·
          {{ session.poolMode === 'test' ? '个人试运行' : '正式训练' }} ·
          {{ session.answeredCount }}/{{ session.actualCount }}
        </p>
      </div>
      <el-tag v-if="session.status === 'in_progress'" type="warning">进行中</el-tag>
      <el-tag v-else-if="session.status === 'completed'" type="success">已完成</el-tag>
      <el-tag v-else type="info">已取消</el-tag>
    </div>

    <el-alert
      v-if="session?.poolMode === 'test'"
      type="warning"
      :closable="false"
      show-icon
      title="AI初审题库，尚未完成全部人工学科审核。"
      style="margin-bottom: 12px"
    />

    <template v-if="session && current">
      <el-card shadow="never" class="q-card">
        <div class="q-head">
          <span>第 {{ current.sortOrder }} / {{ session.actualCount }} 题</span>
          <el-tag size="small" effect="plain">{{ qtypeLabel(current.qtype) }}</el-tag>
        </div>
        <p
          v-if="session.sessionKind === 'advanced' && itemSpecLabel(current)"
          class="item-spec"
        >
          {{ itemSpecLabel(current) }}
        </p>
        <div class="stem">{{ displayStem(current) }}</div>

        <div v-if="current.qtype === 'single'" class="opts">
          <el-radio-group
            v-model="draft"
            :disabled="session.status !== 'in_progress'"
            class="opt-col"
          >
            <el-radio
              v-for="opt in optionList(current)"
              :key="opt.key"
              :value="opt.key"
            >
              {{ opt.key }}. {{ opt.text }}
            </el-radio>
          </el-radio-group>
        </div>

        <div v-else-if="current.qtype === 'judge'" class="opts">
          <el-radio-group
            v-model="draft"
            :disabled="session.status !== 'in_progress'"
          >
            <el-radio value="正确">正确</el-radio>
            <el-radio value="错误">错误</el-radio>
          </el-radio-group>
        </div>

        <div v-else class="opts">
          <el-input
            v-model="draft"
            :disabled="session.status !== 'in_progress'"
            :placeholder="
              isChemFormula(current)
                ? '请输入化学式，如 H2O（可用普通数字）'
                : '请输入答案'
            "
            maxlength="200"
          />
          <template v-if="isChemFormula(current)">
            <p class="hint">
              可以输入 H2O，系统预览按 H₂O 显示。请注意元素符号大小写（H/O 等）。提交仍保留你的原始输入。
            </p>
            <p v-if="draft.trim()" class="preview">
              规范预览：<strong>{{ formulaPreview }}</strong>
            </p>
          </template>
        </div>

        <div
          v-if="session.status === 'completed' && current.gradeResult"
          class="result-box"
        >
          <el-tag :type="gradeTag(current.gradeResult)" effect="dark">
            {{ gradeText(current.gradeResult) }}
          </el-tag>
          <p>
            标准答案：{{
              isChemFormula(current)
                ? formatChemFormulaDisplay(String(current.standardAnswer || ''))
                : current.standardAnswer
            }}
          </p>
          <p v-if="current.gradeReason" class="reason">
            说明：{{ current.gradeReason }}
          </p>
          <div v-if="current.analysis" class="analysis-block">
            <p>解析：</p>
            <pre class="ana-pre">{{ current.analysis }}</pre>
          </div>
        </div>
      </el-card>

      <div class="nav">
        <el-button :disabled="index <= 0" @click="go(-1)">上一题</el-button>
        <el-button
          v-if="session.status === 'in_progress'"
          type="primary"
          plain
          :loading="saving"
          @click="saveCurrent"
        >
          保存本题
        </el-button>
        <el-button
          :disabled="index >= session.items.length - 1"
          @click="go(1)"
        >
          下一题
        </el-button>
        <el-button
          v-if="session.status === 'in_progress'"
          type="primary"
          :loading="submitting"
          @click="confirmSubmit"
        >
          提交训练
        </el-button>
        <el-button
          v-if="session.status === 'completed'"
          type="success"
          @click="goResult"
        >
          查看结果
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getChemTrainSession,
  saveChemTrainAnswer,
  submitChemTrainSession,
  type TrainSessionDetail,
  type TrainSessionItem,
} from '@/api/chemistry-train'
import {
  formatChemFormulaDisplay,
  formatChemTextDisplay,
  previewChemFormulaInput,
} from '@/utils/chem-formula-display'
import { pickPetLine } from '@/components/pet/scripts'
import { usePetStore } from '@/stores/pet'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const pet = usePetStore()
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const session = ref<TrainSessionDetail | null>(null)
const index = ref(0)
const draft = ref('')

const current = computed(() => session.value?.items[index.value] || null)

const formulaPreview = computed(() => previewChemFormulaInput(draft.value))

function isChemFormula(item: TrainSessionItem | null) {
  return item?.qtype === 'blank' && item.answerType === 'chem_formula'
}

function displayStem(item: TrainSessionItem) {
  if (isChemFormula(item) || /[A-Z][a-z]?\d/.test(item.stem)) {
    return formatChemTextDisplay(item.stem)
  }
  return item.stem
}

function qtypeLabel(t: string) {
  if (t === 'single') return '单选'
  if (t === 'judge') return '判断'
  return '填空'
}

function itemSpecLabel(it: TrainSessionItem | null) {
  if (!it?.specialtyName) return ''
  if (it.categoryName) return `${it.specialtyName} · ${it.categoryName}`
  return it.specialtyName
}

function optionList(item: TrainSessionItem) {
  const opts = item.options
  if (Array.isArray(opts)) return opts as { key: string; text: string }[]
  return []
}

function gradeTag(g: string) {
  if (g === 'correct') return 'success'
  if (g === 'wrong') return 'danger'
  return 'warning'
}

function gradeText(g: string) {
  if (g === 'correct') return '正确'
  if (g === 'wrong') return '错误'
  return '待复核'
}

function syncDraft() {
  draft.value = current.value?.userAnswer || ''
}

async function load() {
  const id = String(route.params.id || '')
  loading.value = true
  try {
    session.value = await getChemTrainSession(id)
    if (session.value.status === 'completed') {
      void router.replace(`/chemistry/train/result/${id}`)
      return
    }
    index.value = 0
    syncDraft()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载训练失败'))
    void router.push('/chemistry')
  } finally {
    loading.value = false
  }
}

async function saveCurrent() {
  if (!session.value || !current.value) return
  if (session.value.status !== 'in_progress') return
  saving.value = true
  try {
    session.value = await saveChemTrainAnswer(session.value.id, {
      sortOrder: current.value.sortOrder,
      answer: draft.value,
    })
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function go(delta: number) {
  if (session.value?.status === 'in_progress' && draft.value !== (current.value?.userAnswer || '')) {
    await saveCurrent()
  }
  index.value = Math.min(
    Math.max(0, index.value + delta),
    (session.value?.items.length || 1) - 1,
  )
  syncDraft()
}

async function confirmSubmit() {
  if (!session.value) return
  let unansweredCount = 0
  for (const it of session.value.items) {
    if (it.sortOrder === current.value?.sortOrder) {
      if (!draft.value.trim()) unansweredCount++
    } else if (!it.answered) unansweredCount++
  }
  try {
    await ElMessageBox.confirm(
      unansweredCount > 0
        ? `还有 ${unansweredCount} 题未作答，确定提交吗？未答题将进入待复核。`
        : '确认提交本套训练？提交后不可再次作答。',
      '提交确认',
      { type: 'warning', confirmButtonText: '提交', cancelButtonText: '继续答题' },
    )
  } catch {
    return
  }
  if (session.value.status === 'in_progress') {
    await saveCurrent()
  }
  submitting.value = true
  try {
    const res = await submitChemTrainSession(session.value.id)
    session.value = res
    // 整套全对（无错题、无待复核）→ 宠物全屏祝贺
    if (
      res.status === 'completed' &&
      res.actualCount > 0 &&
      res.wrongCount === 0 &&
      res.pendingCount === 0 &&
      res.correctCount === res.actualCount
    ) {
      pet.requestCelebration({
        line: pickPetLine('attempt_correct', pet.skinId),
      })
    }
    void router.push(`/chemistry/train/result/${res.id}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '提交失败'))
  } finally {
    submitting.value = false
  }
}

function goResult() {
  if (session.value) void router.push(`/chemistry/train/result/${session.value.id}`)
}

watch(index, () => syncDraft())

onMounted(() => {
  void load()
})
</script>

<style scoped>
.train-session {
  padding: 16px 20px 40px;
  max-width: 800px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 1.15rem;
}
.sub {
  margin: 4px 0 0;
  color: #909399;
  font-size: 13px;
}
.q-card {
  margin-bottom: 16px;
}
.q-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #606266;
}
.item-spec {
  margin: 0 0 10px;
  font-size: 13px;
  color: #909399;
}
.stem {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
  white-space: pre-wrap;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.preview {
  margin: 6px 0 0;
  font-size: 14px;
  color: #606266;
}
.reason {
  margin-top: 8px;
  color: #e6a23c;
}
.opt-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.result-box {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
.analysis-block p {
  margin: 0 0 4px;
  color: #606266;
}
.ana-pre {
  margin: 0;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
  color: #606266;
  background: #f5f7fa;
  border-radius: 6px;
}
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 640px) {
  .train-session {
    padding: 12px;
  }
}
</style>
