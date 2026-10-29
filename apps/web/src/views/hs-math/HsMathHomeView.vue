<template>
  <div class="page-fill hs-home" v-loading="loading">
    <header class="toolbar">
      <div>
        <h1>高一数学</h1>
        <p class="sub">人教 A 版 · 专项训练与基础学情（正确率 ≠ 掌握度）</p>
      </div>
      <div class="acts">
        <el-button type="primary" @click="goTrainStart">开始训练</el-button>
        <el-button @click="goSpecialties">章节目录</el-button>
        <el-button @click="goHistory">训练历史</el-button>
        <el-button @click="goAnalytics">学情分析</el-button>
      </div>
    </header>

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

    <template v-if="home">
      <el-row :gutter="12" class="stats">
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="累计训练" :value="home.overview.completedSessions" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="累计答题" :value="home.overview.totalQuestions" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="正确" :value="home.overview.correctCount" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="错误" :value="home.overview.wrongCount" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="待复核" :value="home.overview.pendingCount" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="stat-plain">
              <div class="lab">总体正确率</div>
              <div class="val">{{ formatAccuracyRatio(home.overview.accuracy) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="sec">
        <template #header>最近 7 天训练趋势</template>
        <div ref="chartRef" class="chart" />
        <el-empty
          v-if="!loading && trendEmpty"
          description="近 7 天暂无已完成训练"
          :image-size="64"
        />
      </el-card>

      <el-card shadow="never" class="sec">
        <template #header>
          <div class="card-head">
            <span>最近训练</span>
            <el-button link type="primary" @click="goHistory">全部历史</el-button>
          </div>
        </template>
        <el-empty
          v-if="!home.recentSessions.length"
          description="暂无训练记录，去选一个章节开始吧"
        />
        <el-table v-else :data="home.recentSessions" stripe size="small">
          <el-table-column label="时间" min-width="150">
            <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
          </el-table-column>
          <el-table-column label="章节" min-width="140">
            <template #default="{ row }">
              {{ row.specialtyName || '—' }} / {{ row.categoryName || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              {{ sessionStatusLabel(row.status) }}
            </template>
          </el-table-column>
          <el-table-column label="正确率" width="90">
            <template #default="{ row }">
              {{ formatAccuracyRatio(row.accuracy) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'in_progress'"
                link
                type="primary"
                @click="goSession(row.sessionId)"
              >
                继续
              </el-button>
              <el-button
                v-else-if="row.status === 'completed'"
                link
                type="primary"
                @click="goResult(row.sessionId)"
              >
                结果
              </el-button>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never" class="sec">
        <template #header>可用专项</template>
        <p class="hint">
          当前启用章节：{{ home.availableSpecialties }} 个
          <template v-if="!home.shortcuts.canStartSpecialtyTrain">
            · 暂无可用专项
          </template>
        </p>
        <el-button
          type="primary"
          :disabled="!home.shortcuts.canStartSpecialtyTrain"
          @click="goSpecialties"
        >
          进入专项目录
        </el-button>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getHsMathHome, type HsMathHome } from '@/api/hs-math'
import {
  formatAccuracyRatio,
  sessionStatusLabel,
} from '@/utils/hs-math-format'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const home = ref<HsMathHome | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const trendEmpty = computed(() => {
  const t = home.value?.weeklyTrend || []
  return !t.some((p) => p.sessionCount > 0)
})

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

function goSpecialties() {
  void router.push('/hs-math/specialties')
}
function goTrainStart() {
  void router.push('/hs-math/train/start')
}
function goHistory() {
  void router.push('/hs-math/train/history')
}
function goAnalytics() {
  void router.push('/hs-math/analytics')
}
function goSession(id: string) {
  void router.push(`/hs-math/train/session/${encodeURIComponent(id)}`)
}
function goResult(id: string) {
  void router.push(`/hs-math/train/result/${encodeURIComponent(id)}`)
}

function renderChart() {
  if (!chartRef.value || !home.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  const trend = home.value.weeklyTrend
  chart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['题量', '正确率'] },
    xAxis: {
      type: 'category',
      data: trend.map((p) => p.date.slice(5)),
    },
    yAxis: [
      { type: 'value', name: '题量', minInterval: 1 },
      {
        type: 'value',
        name: '正确率',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
    ],
    series: [
      {
        name: '题量',
        type: 'bar',
        data: trend.map((p) => p.questionCount),
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        connectNulls: false,
        data: trend.map((p) =>
          p.accuracy == null ? null : Math.round(p.accuracy * 1000) / 10,
        ),
      },
    ],
  })
}

function onResize() {
  chart?.resize()
}

async function reload() {
  loading.value = true
  loadError.value = ''
  try {
    home.value = await getHsMathHome()
    await nextTick()
    renderChart()
  } catch (e) {
    home.value = null
    loadError.value = errMsg(e, '加载首页失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  void reload()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.toolbar h1 {
  margin: 0 0 4px;
  font-size: 22px;
}
.sub {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stats {
  margin-bottom: 12px;
}
.stats .el-card {
  margin-bottom: 12px;
}
.stat-plain .lab {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stat-plain .val {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 600;
}
.sec {
  margin-bottom: 12px;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chart {
  height: 260px;
  width: 100%;
}
.hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.muted {
  color: var(--el-text-color-placeholder);
}
</style>
