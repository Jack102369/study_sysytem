<template>
  <div class="page-fill analytics" v-loading="loading">
    <header class="toolbar">
      <div>
        <el-button text @click="goHome">← 返回数学首页</el-button>
        <h1>高一数学 · 基础学情</h1>
        <p class="sub">统计口径以后端为准 · 正确率不是掌握度</p>
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

    <template v-if="data">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        :title="data.notes.accuracy"
        style="margin-bottom: 12px"
      />

      <section class="sec">
        <h2>总体统计（已完成训练）</h2>
        <div class="cards">
          <div class="card">
            <div class="n">{{ data.overview.completedSessions }}</div>
            <div class="l">完成场次</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.totalQuestions }}</div>
            <div class="l">答题总量</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.correctCount }}</div>
            <div class="l">正确</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.wrongCount }}</div>
            <div class="l">错误</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.pendingCount }}</div>
            <div class="l">待复核</div>
          </div>
          <div class="card">
            <div class="n">{{ formatAccuracyRatio(data.overview.accuracy) }}</div>
            <div class="l">正确率</div>
          </div>
        </div>
      </section>

      <section class="sec">
        <h2>最近 7 天趋势</h2>
        <div ref="trend7Ref" class="chart" />
        <el-empty
          v-if="!hasTrend(data.trend7d)"
          description="近 7 天暂无数据"
          :image-size="64"
        />
      </section>

      <section class="sec">
        <h2>最近 30 天趋势</h2>
        <div ref="trend30Ref" class="chart" />
        <el-empty
          v-if="!hasTrend(data.trend30d)"
          description="近 30 天暂无数据"
          :image-size="64"
        />
      </section>

      <section class="sec">
        <h2>各章节正确率</h2>
        <el-table
          :data="data.bySpecialty"
          stripe
          size="small"
          empty-text="暂无章节数据"
        >
          <el-table-column prop="specialtyName" label="章节" min-width="140" />
          <el-table-column prop="sessionCount" label="场次" width="80" />
          <el-table-column prop="questionCount" label="题量" width="80" />
          <el-table-column prop="correctCount" label="正确" width="70" />
          <el-table-column prop="wrongCount" label="错误" width="70" />
          <el-table-column prop="pendingCount" label="待复核" width="80" />
          <el-table-column label="正确率" width="100">
            <template #default="{ row }">
              {{ formatAccuracyRatio(row.accuracy) }}
            </template>
          </el-table-column>
        </el-table>
        <div ref="specRef" class="chart chart-spec" />
      </section>

      <section class="sec">
        <h2>各难度正确率</h2>
        <el-table
          :data="data.byDifficulty"
          stripe
          size="small"
          empty-text="暂无难度数据"
        >
          <el-table-column label="难度" width="100">
            <template #default="{ row }">
              {{ difficultyLabel(row.difficulty) }}
            </template>
          </el-table-column>
          <el-table-column prop="questionCount" label="题量" width="80" />
          <el-table-column prop="correctCount" label="正确" width="70" />
          <el-table-column prop="wrongCount" label="错误" width="70" />
          <el-table-column prop="pendingCount" label="待复核" width="80" />
          <el-table-column label="正确率" width="100">
            <template #default="{ row }">
              {{ formatAccuracyRatio(row.accuracy) }}
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  getHsMathAnalytics,
  type HsMathAnalytics,
} from '@/api/hs-math-train'
import type { HsMathTrendPoint } from '@/api/hs-math'
import {
  difficultyLabel,
  formatAccuracyRatio,
} from '@/utils/hs-math-format'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const data = ref<HsMathAnalytics | null>(null)
const trend7Ref = ref<HTMLElement | null>(null)
const trend30Ref = ref<HTMLElement | null>(null)
const specRef = ref<HTMLElement | null>(null)
let chart7: echarts.ECharts | null = null
let chart30: echarts.ECharts | null = null
let chartSpec: echarts.ECharts | null = null

function goHome() {
  void router.push('/hs-math')
}

function hasTrend(points: HsMathTrendPoint[]) {
  return points.some((p) => p.sessionCount > 0)
}

function trendOption(points: HsMathTrendPoint[]) {
  return {
    grid: { left: 40, right: 40, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['题量', '正确率'] },
    xAxis: {
      type: 'category',
      data: points.map((p) => p.date.slice(5)),
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
        data: points.map((p) => p.questionCount),
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        connectNulls: false,
        data: points.map((p) =>
          p.accuracy == null ? null : Math.round(p.accuracy * 1000) / 10,
        ),
      },
    ],
  }
}

function renderCharts() {
  if (!data.value) return
  if (trend7Ref.value) {
    if (!chart7) chart7 = echarts.init(trend7Ref.value)
    chart7.setOption(trendOption(data.value.trend7d))
  }
  if (trend30Ref.value) {
    if (!chart30) chart30 = echarts.init(trend30Ref.value)
    chart30.setOption(trendOption(data.value.trend30d))
  }
  if (specRef.value && data.value.bySpecialty.length) {
    if (!chartSpec) chartSpec = echarts.init(specRef.value)
    chartSpec.setOption({
      grid: { left: 100, right: 20, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: data.value.bySpecialty.map(
          (s) => s.specialtyName || s.specialtyCode || s.specialtyId,
        ),
      },
      series: [
        {
          type: 'bar',
          data: data.value.bySpecialty.map((s) =>
            s.accuracy == null ? null : Math.round(s.accuracy * 1000) / 10,
          ),
        },
      ],
    })
  }
}

function onResize() {
  chart7?.resize()
  chart30?.resize()
  chartSpec?.resize()
}

async function reload() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await getHsMathAnalytics()
    await nextTick()
    renderCharts()
  } catch (e) {
    data.value = null
    loadError.value = errMsg(e, '加载学情失败')
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
  chart7?.dispose()
  chart30?.dispose()
  chartSpec?.dispose()
  chart7 = chart30 = chartSpec = null
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 4px 0;
  font-size: 22px;
}
.sub {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.sec {
  margin-bottom: 20px;
}
.sec h2 {
  margin: 0 0 10px;
  font-size: 16px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.card {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.card .n {
  font-size: 22px;
  font-weight: 600;
}
.card .l {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.chart {
  height: 260px;
  width: 100%;
  margin-top: 8px;
}
.chart-spec {
  height: 280px;
}
</style>
