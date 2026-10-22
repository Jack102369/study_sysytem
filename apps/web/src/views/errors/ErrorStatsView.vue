<template>
  <div v-loading="loading" class="stats-page page-scroll">
    <h1>错题统计</h1>
    <el-row :gutter="12" v-if="stats">
      <el-col :span="6"><el-statistic title="总数" :value="stats.total" /></el-col>
      <el-col :span="6"><el-statistic title="掌握率%" :value="stats.masteryRate" /></el-col>
      <el-col :span="6">
        <el-statistic title="近7天新增" :value="stats.last7Days?.created || 0" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="近7天掌握" :value="stats.last7Days?.mastered || 0" />
      </el-col>
    </el-row>

    <el-row :gutter="12" class="charts-row" v-if="stats">
      <el-col :span="12">
        <el-card shadow="never" header="类别分布">
          <div ref="catRef" class="chart" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" header="高频标签">
          <div ref="tagRef" class="chart" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getErrorStats } from '@/api/errors'
import { useTheme } from '@/composables/useTheme'
import { getChartPalette } from '@/utils/chart-theme'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const stats = ref<any>(null)
const catRef = ref<HTMLDivElement>()
const tagRef = ref<HTMLDivElement>()
let catChart: echarts.ECharts | null = null
let tagChart: echarts.ECharts | null = null
const { isDark } = useTheme()

watch(isDark, () => nextTick(() => renderCharts()))

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await getErrorStats()
    await nextTick()
    renderCharts()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
})

function renderCharts() {
  if (!stats.value) return
  const p = getChartPalette(isDark.value)

  const barOpt = (names: string[], values: number[], color: string) => ({
    backgroundColor: 'transparent',
    textStyle: { color: p.axis },
    tooltip: {},
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: names,
      axisLabel: { color: p.axis, hideOverlap: true },
      axisLine: { lineStyle: { color: p.axis } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: p.axis },
      splitLine: { lineStyle: { color: p.split } },
    },
    series: [
      {
        type: 'bar' as const,
        data: values,
        barMaxWidth: 36,
        itemStyle: { color, borderRadius: [3, 3, 0, 0] },
        label: {
          show: true,
          position: 'top' as const,
          color: p.legend,
          fontSize: 11,
          fontWeight: 600 as const,
        },
      },
    ],
  })

  if (catRef.value) {
    if (!catChart) catChart = echarts.init(catRef.value)
    else catChart.clear()
    catChart.setOption(
      barOpt(
        stats.value.byCategory.map((x: any) => x.name),
        stats.value.byCategory.map((x: any) => x.count),
        p.bar,
      ),
    )
  }
  if (tagRef.value) {
    if (!tagChart) tagChart = echarts.init(tagRef.value)
    else tagChart.clear()
    tagChart.setOption(
      barOpt(
        stats.value.topTags.map((x: any) => x.name),
        stats.value.topTags.map((x: any) => x.count),
        p.barAlt,
      ),
    )
  }
}
</script>

<style scoped>
.stats-page h1 {
  margin: 0 0 12px;
  font-size: 20px;
}
.charts-row {
  margin-top: 12px;
}
.chart {
  height: min(260px, calc(100vh - 280px));
  min-height: 180px;
}
</style>
