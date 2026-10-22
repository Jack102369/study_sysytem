<template>
  <div class="page-fill train-result" v-loading="loading">
    <div class="toolbar" v-if="session">
      <h1>训练结果</h1>
      <div class="acts">
        <el-button
          v-if="session?.sessionKind === 'daily'"
          @click="goDaily"
        >
          每日10分钟
        </el-button>
        <el-button
          v-if="session?.sessionKind === 'wrong_variation' && session.sourceWrongItemId"
          type="primary"
          plain
          @click="goSourceWrong"
        >
          返回错题详情
        </el-button>
        <el-button @click="goHistory">训练历史</el-button>
        <el-button type="primary" @click="goHome">返回化学首页</el-button>
      </div>
    </div>

    <el-card v-if="session" shadow="never" class="summary">
      <p class="title">
        <span class="title-text">{{ session.specialtyName }} · {{ session.categoryName }}</span>
        <el-tag size="small" class="ml">{{ session.difficultyLabel }}</el-tag>
        <el-tag
          v-if="session.sessionKind === 'daily'"
          size="small"
          type="primary"
          class="ml"
        >
          每日巩固
        </el-tag>
        <el-tag
          v-else-if="session.sessionKind === 'advanced'"
          size="small"
          type="warning"
          class="ml"
        >
          提高与挑战
        </el-tag>
        <el-tag
          v-else-if="session.sessionKind === 'wrong_variation'"
          size="small"
          type="danger"
          class="ml"
        >
          变式训练
        </el-tag>
        <el-tag
          v-else-if="session.sessionKind === 'wrong_review'"
          size="small"
          type="danger"
          effect="plain"
          class="ml"
        >
          错题复练
        </el-tag>
        <el-tag
          size="small"
          :type="session.poolMode === 'test' ? 'warning' : 'success'"
          class="ml"
        >
          {{
            session.poolMode === 'test'
              ? '试运行（不计入正式统计）'
              : '正式训练'
          }}
        </el-tag>
      </p>
      <el-alert
        v-if="session.sessionKind === 'daily' && session.poolMode === 'test'"
        type="warning"
        :closable="false"
        show-icon
        title="AI初审题库，尚未完成全部人工学科审核。"
        style="margin-bottom: 12px"
      />
      <el-descriptions :column="2" border class="summary-grid">
        <el-descriptions-item label="实际题量">{{ session.actualCount }}</el-descriptions-item>
        <el-descriptions-item label="已答题数">{{ session.answeredCount }}</el-descriptions-item>
        <el-descriptions-item label="正确">{{ session.correctCount }}</el-descriptions-item>
        <el-descriptions-item label="错误">{{ session.wrongCount }}</el-descriptions-item>
        <el-descriptions-item label="待复核">{{ session.pendingCount }}</el-descriptions-item>
        <el-descriptions-item label="正确率">
          {{
            session.accuracyPercent == null
              ? '—'
              : session.accuracyPercent + '%'
          }}
          <span class="note">{{ session.accuracyNote }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="用时">
          {{ formatDuration(session.durationMs) }}
          <span class="note">{{ session.durationNote || '开始到提交的经过时间' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText(session.status) }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="insight" class="insight">
        <el-alert type="success" :closable="false" :title="insight.reviewTip" />
        <p v-if="insight.involvedKnowledge.length" class="kp">
          本次涉及：{{ insight.involvedKnowledge.join('；') }}
        </p>
        <p v-if="insight.wrongKnowledge.length" class="kp wrong">
          本次答错相关：{{ insight.wrongKnowledge.join('；') }}
        </p>
      </div>

      <div v-if="nextSteps.length" class="next-steps">
        <h2>接下来建议</h2>
        <p class="next-note">建议顺序，非强制；其他学习入口随时可用。</p>
        <div class="next-list">
          <el-button
            v-for="(step, idx) in nextSteps"
            :key="idx"
            :type="step.type || 'default'"
            :plain="step.plain"
            @click="goStep(step.path)"
          >
            {{ step.label }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card v-if="session" shadow="never" class="list">
      <h2>逐题结果</h2>
      <div v-for="it in session.items" :key="it.id" class="row">
        <div class="row-head">
          <span>第 {{ it.sortOrder }} 题 · {{ qtypeLabel(it.qtype) }}</span>
          <el-tag size="small" :type="gradeTag(it.gradeResult)">
            {{ gradeText(it.gradeResult) }}
          </el-tag>
        </div>
        <p
          v-if="session.sessionKind === 'advanced' && itemSpecLabel(it)"
          class="item-spec"
        >
          {{ itemSpecLabel(it) }}
        </p>
        <p class="stem">{{ displayStem(it) }}</p>
        <p class="ans-line">
          你的答案：
          <span
            class="user-answer"
            :class="{ empty: !it.userAnswer, [gradeClass(it.gradeResult)]: !!it.userAnswer }"
          >
            {{
              it.userAnswer
                ? displayAnswer(it, it.userAnswer)
                : '（未作答）'
            }}
          </span>
        </p>
        <p>
          标准答案：{{
            it.standardAnswer ? displayAnswer(it, it.standardAnswer) : '—'
          }}
        </p>
        <p v-if="it.gradeReason" class="reason">错误原因：{{ it.gradeReason }}</p>
        <p v-if="it.analysis" class="ana">解析：</p>
        <pre v-if="it.analysis" class="ana-pre">{{ it.analysis }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getChemDailyInsight,
  getChemLearningHome,
  getChemTrainSession,
  type ChemDailyInsight,
  type ChemLearningHome,
  type TrainSessionDetail,
  type TrainSessionItem,
} from '@/api/chemistry-train'
import {
  formatChemFormulaDisplay,
  formatChemTextDisplay,
} from '@/utils/chem-formula-display'
import errMsg from '@/utils/err-msg'

type NextStep = {
  label: string
  path: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  plain?: boolean
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const session = ref<TrainSessionDetail | null>(null)
const insight = ref<ChemDailyInsight | null>(null)
const learningHome = ref<ChemLearningHome | null>(null)

function formatDuration(ms: number) {
  const s = Math.round((ms || 0) / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m} 分 ${r} 秒` : `${r} 秒`
}

function statusText(s: string) {
  if (s === 'completed') return '已完成'
  if (s === 'cancelled') return '已取消'
  return '进行中'
}

function qtypeLabel(t: string) {
  if (t === 'single') return '单选'
  if (t === 'judge') return '判断'
  return '填空'
}

function itemSpecLabel(it: TrainSessionItem) {
  if (!it.specialtyName) return ''
  if (it.categoryName) return `${it.specialtyName} · ${it.categoryName}`
  return it.specialtyName
}

function isChemFormula(it: TrainSessionItem) {
  return it.qtype === 'blank' && it.answerType === 'chem_formula'
}

function displayStem(it: TrainSessionItem) {
  return formatChemTextDisplay(it.stem)
}

function displayAnswer(it: TrainSessionItem, raw: string) {
  if (isChemFormula(it)) return formatChemFormulaDisplay(raw)
  return raw
}

function gradeTag(g?: string | null) {
  if (g === 'correct') return 'success'
  if (g === 'wrong') return 'danger'
  return 'warning'
}

function gradeClass(g?: string | null) {
  if (g === 'correct') return 'is-correct'
  if (g === 'wrong') return 'is-wrong'
  return 'is-pending'
}

function gradeText(g?: string | null) {
  if (g === 'correct') return '正确'
  if (g === 'wrong') return '错误'
  return '待复核'
}

function goHome() {
  void router.push('/chemistry')
}

function goDaily() {
  void router.push('/chemistry/daily')
}

function goHistory() {
  if (session.value?.sessionKind === 'daily') {
    void router.push('/chemistry/daily')
    return
  }
  void router.push('/chemistry/train/history')
}

function goSourceWrong() {
  const id = session.value?.sourceWrongItemId
  if (!id) return
  void router.push(`/chemistry/wrong-questions/${encodeURIComponent(id)}`)
}

function goStep(path: string) {
  if (!path) return
  void router.push(path)
}

const nextSteps = computed((): NextStep[] => {
  const s = session.value
  if (!s) return []
  const home = learningHome.value
  const due = home?.wrong?.dueTodayCount || 0
  const adv = home?.recommendAdvanced
  const steps: NextStep[] = []
  const kind = s.sessionKind

  const pushUnique = (step: NextStep) => {
    if (steps.some((x) => x.path === step.path && x.label === step.label)) return
    steps.push(step)
  }

  if (kind === 'wrong_variation' && s.sourceWrongItemId) {
    pushUnique({
      label: '返回来源错题详情',
      path: `/chemistry/wrong-questions/${encodeURIComponent(s.sourceWrongItemId)}`,
      type: 'primary',
    })
  }

  if (kind === 'daily') {
    if (due > 0) {
      pushUnique({
        label: `复习今日错题（${due}）`,
        path: '/chemistry/wrong-questions?focus=due',
        type: 'danger',
      })
    } else {
      pushUnique({
        label: '进入错题中心',
        path: '/chemistry/wrong-questions',
        type: 'danger',
        plain: true,
      })
    }
    pushUnique({
      label: '错题变式巩固',
      path: '/chemistry/wrong-questions',
      type: 'danger',
      plain: true,
    })
  } else if (kind === 'wrong_review') {
    pushUnique({
      label: '继续错题复练',
      path: '/chemistry/wrong-questions',
      type: 'danger',
    })
    if (due > 0) {
      pushUnique({
        label: `查看今日待复习（${due}）`,
        path: '/chemistry/wrong-questions?focus=due',
        type: 'danger',
        plain: true,
      })
    }
    pushUnique({
      label: '去错题详情找变式',
      path: '/chemistry/wrong-questions',
      plain: true,
    })
  } else if (kind === 'wrong_variation') {
    pushUnique({
      label: '返回错题中心',
      path: '/chemistry/wrong-questions',
      type: 'danger',
      plain: true,
    })
  } else if (kind === 'advanced') {
    if (due > 0) {
      pushUnique({
        label: `复习今日错题（${due}）`,
        path: '/chemistry/wrong-questions?focus=due',
        type: 'danger',
      })
    }
    pushUnique({
      label: '继续提高与挑战',
      path: '/chemistry/advanced',
      type: 'warning',
    })
  } else {
    // specialty 等
    if (due > 0) {
      pushUnique({
        label: `复习今日错题（${due}）`,
        path: '/chemistry/wrong-questions?focus=due',
        type: 'danger',
      })
    }
    pushUnique({
      label: '每日10分钟',
      path: '/chemistry/daily',
      type: 'primary',
      plain: true,
    })
  }

  if (adv?.availableCount && adv.path) {
    pushUnique({
      label: `提高/挑战：${adv.specialtyName || '推荐'}（约${adv.availableCount}题）`,
      path: adv.path,
      type: 'warning',
      plain: kind === 'advanced',
    })
  } else if (kind !== 'advanced') {
    pushUnique({
      label: '提高与挑战（自主选择）',
      path: '/chemistry/advanced',
      type: 'warning',
      plain: true,
    })
  }

  if (kind !== 'daily') {
    pushUnique({
      label: '每日10分钟',
      path: '/chemistry/daily',
      plain: true,
    })
  } else {
    pushUnique({
      label: '再次每日巩固',
      path: '/chemistry/daily',
      plain: true,
    })
  }

  pushUnique({
    label: '返回化学首页',
    path: '/chemistry',
  })

  return steps
})

async function load() {
  loading.value = true
  insight.value = null
  learningHome.value = null
  try {
    const id = String(route.params.id || '')
    session.value = await getChemTrainSession(id)
    const tasks: Promise<unknown>[] = [
      getChemLearningHome()
        .then((h) => {
          learningHome.value = h
        })
        .catch(() => null),
    ]
    if (session.value.sessionKind === 'daily' && session.value.status === 'completed') {
      tasks.push(
        getChemDailyInsight(id)
          .then((i) => {
            insight.value = i
          })
          .catch(() => null),
      )
    }
    await Promise.all(tasks)
  } catch (e) {
    ElMessage.error(errMsg(e, '加载结果失败'))
    goHome()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.train-result {
  padding: 16px 20px 24px;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 0;
  font-size: 1.2rem;
}
.summary {
  margin-bottom: 16px;
  flex-shrink: 0;
}
.summary :deep(.el-card__body) {
  padding: 16px 18px;
  overflow: visible;
}
.title {
  margin: 0 0 14px;
  font-weight: 600;
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.title-text {
  margin-right: 4px;
}
.ml {
  margin-left: 0;
}
.summary-grid {
  width: 100%;
}
.summary-grid :deep(.el-descriptions__label) {
  width: 96px;
  font-weight: 500;
}
.summary-grid :deep(.el-descriptions__cell) {
  padding: 10px 12px;
  vertical-align: top;
}
.insight {
  margin-top: 14px;
}
.next-steps {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #ebeef5;
}
.next-steps h2 {
  margin: 0 0 6px;
  font-size: 1rem;
}
.next-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: #909399;
}
.next-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.list {
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.list :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 20px;
}
.kp {
  margin: 10px 0 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
.kp.wrong {
  color: #c45656;
}
.note {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}
.list h2 {
  margin: 0 0 12px;
  font-size: 1rem;
}
.row {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}
.row-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.item-spec {
  margin: 0 0 6px;
  font-size: 13px;
  color: #909399;
}
.stem {
  white-space: pre-wrap;
  margin: 0 0 6px;
}
.ans-line {
  margin: 6px 0;
}
.user-answer {
  display: inline-block;
  margin-left: 2px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  line-height: 1.5;
}
.user-answer.is-correct {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.18);
}
.user-answer.is-wrong {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.18);
}
.user-answer.is-pending {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.18);
}
.user-answer.empty {
  color: #909399;
  background: rgba(144, 147, 153, 0.15);
  font-weight: 500;
}
.reason {
  color: #e6a23c;
  margin: 4px 0;
}
.ana {
  color: #606266;
  margin-bottom: 4px;
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
@media (max-width: 640px) {
  .train-result {
    padding: 12px;
  }
}
</style>
