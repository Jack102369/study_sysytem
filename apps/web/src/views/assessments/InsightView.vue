<template>
  <div class="page-scroll" v-loading="loading">
    <div class="toolbar">
      <h1>科目洞察</h1>
      <el-radio-group v-model="chartType" size="small" @change="renderAll">
        <el-radio-button label="line">折线</el-radio-button>
        <el-radio-button label="bar">柱状</el-radio-button>
      </el-radio-group>
    </div>
    <p class="sub">科目 ID：{{ subjectId }}</p>
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never" header="成绩点">
          <div ref="scoreRef" class="chart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="错题月新增">
          <div ref="errRef" class="chart" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { fetchInsight } from '@/api/assessments'
import { useTheme } from '@/composables/useTheme'
import { getChartPalette, seriesStyle, type ChartType } from '@/utils/chart-theme'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const subjectId = String(route.params.subjectId)
const loading = ref(false)
const chartType = ref<ChartType>('line')
const insight = ref<any>(null)
const scoreRef = ref<HTMLDivElement>()
const errRef = ref<HTMLDivElement>()
let scoreChart: echarts.ECharts | null = null
let errChart: echarts.ECharts | null = null
const { isDark } = useTheme()

watch(isDark, () => nextTick(() => renderAll()))

onMounted(async () => {
  loading.value = true
  try {
    insight.value = await fetchInsight(subjectId)
    await nextTick()
    renderAll()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
})

function renderAll() {
  if (!insight.value) return
  const p = getChartPalette(isDark.value)
  const t = chartType.value
  const data = insight.value

  if (scoreRef.value) {
    if (!scoreChart) scoreChart = echarts.init(scoreRef.value)
    else scoreChart.clear()
    scoreChart.setOption({
      backgroundColor: 'transparent',
      textStyle: { color: p.axis },
      tooltip: { trigger: 'axis' },
      grid: { bottom: 64, left: 40, right: 16, top: 24 },
      xAxis: {
        type: 'category',
        data: data.scorePoints.map(
          (pt: any) => `${pt.title || '未命名'}\n${formatChineseDate(pt.heldAt)}`,
        ),
        axisLabel: { interval: 0, hideOverlap: true, lineHeight: 14, color: p.axis, fontSize: 11 },
        axisLine: { lineStyle: { color: p.axis } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: p.axis },
        splitLine: { lineStyle: { color: p.split } },
      },
      series: [
        {
          name: '得分',
          data: data.scorePoints.map((pt: any) => pt.score),
          ...seriesStyle(t, p.score, { lineWidth: 3, labelColor: p.legend }),
        },
      ],
    })
  }

  if (errRef.value) {
    if (!errChart) errChart = echarts.init(errRef.value)
    else errChart.clear()
    // 月新增始终柱状更直观；主题色随深浅切换
    errChart.setOption({
      backgroundColor: 'transparent',
      textStyle: { color: p.axis },
      tooltip: {},
      grid: { left: 40, right: 16, top: 24, bottom: 40 },
      xAxis: {
        type: 'category',
        data: data.errorMonthly.map((pt: any) => pt.month),
        axisLabel: { color: p.axis },
        axisLine: { lineStyle: { color: p.axis } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: p.axis },
        splitLine: { lineStyle: { color: p.split } },
      },
      series: [
        {
          type: 'bar',
          data: data.errorMonthly.map((pt: any) => pt.count),
          barMaxWidth: 36,
          itemStyle: { color: p.barAlt, borderRadius: [3, 3, 0, 0] },
          label: {
            show: true,
            position: 'top',
            color: p.legend,
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    })
  }
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
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.sub {
  margin: 0 0 12px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
.chart {
  height: 260px;
}
</style>
