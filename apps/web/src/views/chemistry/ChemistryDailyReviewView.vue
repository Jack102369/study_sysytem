<template>
  <div class="page-fill daily-review" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goHome">← 返回化学首页</el-button>
      <h1>每日10分钟 · 基础巩固</h1>
    </div>

    <el-alert
      v-if="status?.aiTrialNotice"
      type="warning"
      :closable="false"
      show-icon
      :title="status.aiTrialNotice"
      style="margin-bottom: 12px"
    />

    <el-card shadow="never" class="card">
      <template v-if="status">
        <p class="today">今日（北京时间 {{ status.today }}）</p>

        <el-tag
          v-if="status.todayCompletedOnce"
          type="success"
          effect="plain"
          class="badge"
        >
          今日基础巩固已完成（共 {{ status.todayCompletedCount }} 次）
        </el-tag>
        <el-tag v-else type="info" effect="plain" class="badge">
          今日尚未完成基础巩固
        </el-tag>

        <el-descriptions :column="1" border size="small" class="desc">
          <el-descriptions-item label="目标题量">
            {{ status.targetCount }} 道（可用题库约 {{ status.candidateCount }} 道）
          </el-descriptions-item>
          <el-descriptions-item label="预计用时">约 {{ status.estimatedMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="用时说明">{{ status.durationNote }}</el-descriptions-item>
        </el-descriptions>

        <el-alert
          v-if="status.emptyHint"
          type="warning"
          :closable="false"
          :title="status.emptyHint"
          style="margin: 12px 0"
        />

        <div class="actions">
          <el-button
            v-if="status.inProgressSessionId"
            type="primary"
            :loading="starting"
            @click="continueSession"
          >
            继续上次训练（{{ status.inProgressAnswered }}/{{ status.inProgressActual }}）
          </el-button>
          <el-button
            type="primary"
            :plain="!!status.inProgressSessionId"
            :disabled="!status.canTrain"
            :loading="starting"
            @click="startNew"
          >
            {{
              status.inProgressSessionId
                ? '开始新训练'
                : status.todayCompletedOnce
                  ? '再次练习'
                  : '开始今日训练'
            }}
          </el-button>
        </div>
        <p v-if="status.inProgressSessionId" class="hint">
          开始新训练将取消未完成的上次每日训练。
        </p>
      </template>
    </el-card>

    <el-card shadow="never" class="card hist">
      <div class="hist-head">
        <h2>每日训练记录</h2>
        <el-button text type="primary" :loading="histLoading" @click="loadHistory">
          刷新
        </el-button>
      </div>
      <el-empty
        v-if="!histLoading && (!history || !history.days.length)"
        description="暂无每日训练记录"
      />
      <div v-else class="day-list">
        <div v-for="day in history?.days || []" :key="day.date" class="day-block">
          <div class="day-title">
            <strong>{{ day.date }}</strong>
            <span>完成 {{ day.completedCount }} 次</span>
          </div>
          <div
            v-for="s in day.sessions"
            :key="s.id"
            class="sess-row"
            @click="goResult(s.id)"
          >
            <span>{{ s.actualCount }} 题</span>
            <span>
              正确率
              {{ s.accuracyPercent == null ? '—' : s.accuracyPercent + '%' }}
            </span>
            <span>{{ formatDuration(s.durationMs) }}</span>
            <el-button link type="primary">详情</el-button>
          </div>
        </div>
      </div>
      <p v-if="history" class="hint">{{ history.durationNote }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createChemDailySession,
  getChemDailyStatus,
  listChemDailyHistory,
  type ChemDailyHistory,
  type ChemDailyStatus,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const starting = ref(false)
const histLoading = ref(false)
const status = ref<ChemDailyStatus | null>(null)
const history = ref<ChemDailyHistory | null>(null)

function goHome() {
  void router.push('/chemistry')
}

function goResult(id: string) {
  void router.push(`/chemistry/train/result/${encodeURIComponent(id)}`)
}

function formatDuration(ms: number) {
  const s = Math.round((ms || 0) / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m} 分 ${r} 秒` : `${r} 秒`
}

function continueSession() {
  const id = status.value?.inProgressSessionId
  if (!id) return
  void router.push(`/chemistry/train/session/${encodeURIComponent(id)}`)
}

async function startNew() {
  if (status.value?.inProgressSessionId) {
    try {
      await ElMessageBox.confirm(
        '开始新训练将取消未完成的上次每日训练，是否继续？',
        '开始新训练',
        { type: 'warning' },
      )
    } catch {
      return
    }
  }
  starting.value = true
  try {
    const session = await createChemDailySession()
    if (session.pickMeta?.shortfall) {
      ElMessage.warning(session.pickMeta.shortfall)
    }
    void router.push(`/chemistry/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '创建每日训练失败'))
  } finally {
    starting.value = false
  }
}

async function loadStatus() {
  loading.value = true
  try {
    status.value = await getChemDailyStatus()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载每日状态失败'))
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  histLoading.value = true
  try {
    history.value = await listChemDailyHistory({ page: 1, pageSize: 30 })
  } catch (e) {
    ElMessage.error(errMsg(e, '加载每日历史失败'))
  } finally {
    histLoading.value = false
  }
}

onMounted(() => {
  void loadStatus()
  void loadHistory()
})
</script>

<style scoped>
.daily-review {
  padding: 16px 20px 32px;
  max-width: 720px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.toolbar h1 {
  margin: 0;
  font-size: 1.25rem;
}
.card {
  margin-bottom: 14px;
  border-radius: 12px;
}
.today {
  margin: 0 0 10px;
  color: #606266;
  font-size: 13px;
}
.badge {
  margin-bottom: 12px;
}
.desc {
  margin-top: 8px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}
.hist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.hist-head h2 {
  margin: 0;
  font-size: 16px;
}
.day-block {
  margin-bottom: 14px;
}
.day-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}
.sess-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  margin-bottom: 6px;
  font-size: 13px;
}
.sess-row:hover {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
@media (max-width: 640px) {
  .daily-review {
    padding: 12px;
  }
}
</style>
