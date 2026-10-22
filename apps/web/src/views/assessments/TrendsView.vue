<template>
  <div v-loading="loading" class="trends-page page-scroll">
    <div class="toolbar">
      <h1>成绩趋势</h1>
      <div class="toolbar-right">
        <el-radio-group v-model="chartType" size="small" @change="renderChart">
          <el-radio-button label="line">折线</el-radio-button>
          <el-radio-button label="bar">柱状</el-radio-button>
        </el-radio-group>
        <el-select v-model="metricKey" placeholder="科目" style="width: 140px" @change="load">
          <el-option label="总分" value="__TOTAL__" />
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-button @click="goInsight" :disabled="metricKey === '__TOTAL__'">查看洞察</el-button>
      </div>
    </div>
    <div ref="chartRef" class="chart" />
    <el-empty v-if="!loading && !points.length" description="暂无趋势数据" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { fetchTrends } from '@/api/assessments'
import { listSubjects, type Subject } from '@/api/subjects'
import { useTheme } from '@/composables/useTheme'
import { getChartPalette, seriesStyle, type ChartType } from '@/utils/chart-theme'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const subjects = ref<Subject[]>([])
const metricKey = ref('__TOTAL__')
const chartType = ref<ChartType>('line')
const points = ref<any[]>([])
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
const { isDark } = useTheme()

const isTotal = computed(() => metricKey.value === '__TOTAL__')

watch(isDark, () => nextTick(() => renderChart()))

async function load() {
  loading.value = true
  try {
    points.value = await fetchTrends({
      subjectId: isTotal.value ? undefined : metricKey.value,
    })
    await nextTick()
    renderChart()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function renderChart() {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  else chart.clear()
  if (!points.value.length) return

  const p = getChartPalette(isDark.value)
  const t = chartType.value
  const x = points.value.map((pt) => formatAxisLabel(pt.title, pt.heldAt))
  const scoreName = isTotal.value ? '总分' : '得分'
  const scoreData = isTotal.value
    ? points.value.map((pt) => pt.totalScore ?? null)
    : points.value.map((pt) => pt.subjects?.[0]?.score ?? null)
  const classData = isTotal.value
    ? points.value.map((pt) => pt.classRank ?? null)
    : points.value.map((pt) => pt.subjects?.[0]?.classRank ?? null)
  const schoolData = isTotal.value
    ? points.value.map((pt) => pt.schoolRank ?? null)
    : points.value.map((pt) => pt.subjects?.[0]?.schoolRank ?? null)

  chart.setOption({
    backgroundColor: 'transparent',
    textStyle: { color: p.axis },
    tooltip: { trigger: 'axis' },
    legend: {
      data: [scoreName, '班排', '校排'],
      textStyle: { color: p.legend },
    },
    grid: { bottom: 64, left: 48, right: 56, top: 48 },
    xAxis: {
      type: 'category',
      data: x,
      axisLabel: { interval: 0, hideOverlap: true, lineHeight: 14, color: p.axis, fontSize: 11 },
      axisLine: { lineStyle: { color: p.axis } },
    },
    yAxis: [
      {
        type: 'value',
        name: '分',
        axisLabel: { color: p.axis },
        nameTextStyle: { color: p.axis },
        splitLine: { lineStyle: { color: p.split } },
      },
      {
        type: 'value',
        name: '名次',
        inverse: true,
        minInterval: 1,
        axisLabel: { color: p.schoolRank },
        nameTextStyle: { color: p.schoolRank },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: scoreName,
        data: scoreData,
        ...seriesStyle(t, p.score, { lineWidth: 3, labelColor: p.legend }),
      },
      {
        name: '班排',
        yAxisIndex: 1,
        data: classData,
        ...seriesStyle(t, p.classRank, {
          lineWidth: 2,
          rankAxis: true,
          labelColor: p.legend,
        }),
      },
      {
        name: '校排',
        yAxisIndex: 1,
        data: schoolData,
        ...seriesStyle(t, p.schoolRank, {
          lineWidth: 3,
          rankAxis: true,
          labelColor: p.legend,
        }),
      },
    ],
  })
}

function formatChineseDate(raw: string | Date | null | undefined): string {
  if (!raw) return ''
  const s = String(raw)
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}年${m[2]}月${m[3]}日`
  const d = raw instanceof Date ? raw : new Date(s.replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return s
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}年${mo}月${day}日`
}

function formatAxisLabel(title: string | undefined, heldAt: string | Date | undefined) {
  return `${(title || '未命名').trim()}\n${formatChineseDate(heldAt)}`
}

function goInsight() {
  if (!isTotal.value) router.push(`/assessments/insight/${metricKey.value}`)
}

onMounted(async () => {
  subjects.value = await listSubjects().catch(() => [])
  await load()
})
</script>

<style scoped>
.trends-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
  gap: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chart {
  flex: 1;
  min-height: 260px;
  max-height: 520px;
  background: transparent;
}
</style>
