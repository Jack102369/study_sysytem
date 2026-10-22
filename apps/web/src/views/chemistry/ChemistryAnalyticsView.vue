<template>
  <div class="page-fill analytics" v-loading="loading">
    <header class="toolbar">
      <div>
        <el-button text @click="goHome">← 返回化学学习中心</el-button>
        <h1>高一化学 · 学习分析</h1>
        <p class="sub">
          通过真实训练记录，了解近期学习情况与薄弱环节。
          <span v-if="data">北京时间 {{ data.today }}</span>
        </p>
      </div>
      <el-radio-group v-model="days" size="default" @change="reload">
        <el-radio-button :value="7">最近7天</el-radio-button>
        <el-radio-button :value="30">最近30天</el-radio-button>
      </el-radio-group>
    </header>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      style="margin-bottom: 12px"
    />

    <el-alert
      v-if="data"
      type="info"
      :closable="false"
      show-icon
      :title="data.attribution.note"
      style="margin-bottom: 12px"
    />

    <template v-if="data">
      <!-- 1 概览 -->
      <section class="sec">
        <h2>学习数据概览（近 {{ days }} 天）</h2>
        <div class="cards">
          <div class="card">
            <div class="n">{{ data.overview.submittedSessions }}</div>
            <div class="l">已完成训练</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.practicedItems }}</div>
            <div class="l">实际练习题次</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.correctCount }}</div>
            <div class="l">明确正确</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.wrongCount }}</div>
            <div class="l">明确错误</div>
          </div>
          <div class="card">
            <div class="n">
              {{
                data.overview.accuracyPercent == null
                  ? '—'
                  : data.overview.accuracyPercent + '%'
              }}
            </div>
            <div class="l">明确正确率</div>
          </div>
          <div class="card">
            <div class="n">{{ data.overview.pendingReviewCount }}</div>
            <div class="l">待复核（不计正确率）</div>
          </div>
        </div>
        <p class="hint">{{ data.overview.accuracyNote }}</p>
      </section>

      <!-- 2 日历 -->
      <section class="sec">
        <h2>学习活跃度日历（最近30天）</h2>
        <p class="hint">颜色深浅表示当日实际练习题次；仅统计已提交训练。</p>
        <div ref="calRef" class="chart chart-cal" />
        <el-empty
          v-if="!loading && calendarEmpty"
          description="最近30天暂无已提交训练"
        />
      </section>

      <!-- 3 趋势 -->
      <section class="sec">
        <h2>正确率与练习量趋势</h2>
        <p class="hint">
          柱：练习题次 · 线：明确正确率。无明确对错的日期正确率显示为「无数据」，不是 0%。
        </p>
        <div ref="trendRef" class="chart chart-trend" />
      </section>

      <!-- 4 专项 -->
      <section class="sec">
        <h2>{{ data.specialties.title }}</h2>
        <p class="hint">{{ data.specialties.titleNote }} · 无记录专项不显示 0% 正确率。</p>
        <div ref="specRef" class="chart chart-spec" />
        <el-table
          :data="data.specialties.items"
          stripe
          size="small"
          class="table"
          empty-text="暂无专项数据"
        >
          <el-table-column prop="specialtyName" label="专项" min-width="120" />
          <el-table-column prop="practicedItems" label="练习题次" width="90" />
          <el-table-column prop="correctCount" label="正确" width="70" />
          <el-table-column prop="wrongCount" label="错误" width="70" />
          <el-table-column label="正确率" width="100">
            <template #default="{ row }">
              <span v-if="row.empty">无数据</span>
              <span v-else-if="row.accuracyPercent == null">—</span>
              <span v-else>{{ row.accuracyPercent }}%</span>
              <el-tag v-if="row.sampleLow" size="small" type="warning" class="ml">
                样本较少
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="gradedItems" label="样本量" width="80" />
        </el-table>
      </section>

      <!-- 5 难度 -->
      <section class="sec">
        <h2>{{ data.difficulties.title }}</h2>
        <p class="hint">难度归属按题目当前 difficulty；会话级难度字段不用于本图。</p>
        <div ref="diffRef" class="chart chart-diff" />
        <ul class="diff-notes">
          <li v-for="d in data.difficulties.items" :key="d.key">
            <strong>{{ d.label }}</strong>：练习 {{ d.practicedItems }} · 正确
            {{ d.correctCount }} · 错误 {{ d.wrongCount }} · 待复核
            {{ d.pendingReviewCount }} · 正确率
            {{
              d.empty || d.accuracyPercent == null
                ? '无数据'
                : d.accuracyPercent + '%'
            }}
            <el-tag v-if="d.sampleNote" size="small" type="warning" class="ml">
              {{ d.sampleNote }}
            </el-tag>
          </li>
        </ul>
      </section>

      <!-- 6 错题 -->
      <section class="sec">
        <h2>错题分析</h2>
        <p class="hint">{{ data.wrongStatus.note }}</p>
        <div class="wrong-grid">
          <div ref="wrongRef" class="chart chart-wrong" />
          <div class="wrong-side">
            <p>待攻克 <strong>{{ data.wrongStatus.openCount }}</strong></p>
            <p>巩固中 <strong>{{ data.wrongStatus.consolidatingCount }}</strong></p>
            <p>已掌握 <strong>{{ data.wrongStatus.masteredCount }}</strong></p>
            <p>
              今日建议复习
              <strong class="due">{{ data.wrongStatus.dueTodayCount }}</strong>
            </p>
            <el-button
              type="danger"
              :disabled="!data.wrongStatus.dueTodayCount"
              @click="goDue"
            >
              复习今日错题
            </el-button>
          </div>
        </div>

        <h3>{{ data.topWrongSpecialties.title }}</h3>
        <p class="hint">{{ data.topWrongSpecialties.titleNote }}</p>
        <div ref="topWrongRef" class="chart chart-top" />
        <el-empty
          v-if="!data.topWrongSpecialties.items.length"
          description="窗口内暂无明确错误记录"
        />
      </section>

      <!-- 7 建议 -->
      <section class="sec">
        <h2>下一步建议</h2>
        <p class="hint">基于真实训练数据的轻量建议，非 AI 诊断；非强制路径。</p>
        <el-empty
          v-if="!data.suggestions.length"
          description="暂无额外建议，可继续每日巩固或自主选择训练"
        />
        <div v-else class="sug-list">
          <el-card
            v-for="s in data.suggestions"
            :key="s.id"
            shadow="never"
            class="sug"
          >
            <p>{{ s.reason }}</p>
            <el-button type="primary" @click="goPath(s.path)">{{ s.cta }}</el-button>
          </el-card>
        </div>
      </section>
    </template>

    <el-empty
      v-else-if="!loading && !loadError"
      description="暂无分析数据"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  getChemAnalytics,
  type ChemAnalytics,
} from '@/api/chemistry-train'
import { useTheme } from '@/composables/useTheme'
import { getChartPalette } from '@/utils/chart-theme'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const days = ref<7 | 30>(30)
const data = ref<ChemAnalytics | null>(null)
const { isDark } = useTheme()

const calRef = ref<HTMLDivElement>()
const trendRef = ref<HTMLDivElement>()
const specRef = ref<HTMLDivElement>()
const diffRef = ref<HTMLDivElement>()
const wrongRef = ref<HTMLDivElement>()
const topWrongRef = ref<HTMLDivElement>()

let calChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let specChart: echarts.ECharts | null = null
let diffChart: echarts.ECharts | null = null
let wrongChart: echarts.ECharts | null = null
let topWrongChart: echarts.ECharts | null = null
const observers: ResizeObserver[] = []

const calendarEmpty = computed(() => {
  const c = data.value?.calendar
  if (!c?.length) return true
  return c.every((d) => d.practicedItems === 0 && d.submittedSessions === 0)
})

function goHome() {
  void router.push('/chemistry')
}
function goDue() {
  void router.push('/chemistry/wrong-questions?focus=due')
}
function goPath(path: string) {
  if (!path) return
  void router.push(path)
}

function disposeAll() {
  for (const o of observers) o.disconnect()
  observers.length = 0
  ;[
    calChart,
    trendChart,
    specChart,
    diffChart,
    wrongChart,
    topWrongChart,
  ].forEach((c) => c?.dispose())
  calChart = trendChart = specChart = diffChart = wrongChart = topWrongChart = null
}

function bindRo(el: HTMLDivElement | undefined, chart: echarts.ECharts | null) {
  if (!el || !chart) return
  const ro = new ResizeObserver(() => chart.resize())
  ro.observe(el)
  observers.push(ro)
}

function safeRender(name: string, fn: () => void) {
  try {
    fn()
  } catch (e) {
    console.warn('[analytics chart]', name, e)
  }
}

function renderAll() {
  if (!data.value) return
  const p = getChartPalette(isDark.value)
  safeRender('calendar', () => renderCalendar(p))
  safeRender('trend', () => renderTrend(p))
  safeRender('specialty', () => renderSpecialty(p))
  safeRender('difficulty', () => renderDifficulty(p))
  safeRender('wrong', () => renderWrong(p))
  safeRender('topWrong', () => renderTopWrong(p))
}

function heatColor(n: number) {
  if (n <= 0) return isDark.value ? '#2a2f3a' : '#ebeef5'
  if (n <= 5) return '#b3d8ff'
  if (n <= 15) return '#409eff'
  return '#1d6fd8'
}

function renderCalendar(p: ReturnType<typeof getChartPalette>) {
  if (!calRef.value || !data.value) return
  if (!calChart) calChart = echarts.init(calRef.value)
  else calChart.clear()
  const daysArr = data.value.calendar
  const weeks: string[][] = []
  let row: string[] = []
  // 简化：按日期顺序分列展示为热力条（非完整月历网格，避免复杂对齐）
  const cats = daysArr.map((d) => d.date.slice(5))
  const vals = daysArr.map((d) => d.practicedItems)
  calChart.setOption({
    backgroundColor: 'transparent',
    textStyle: { color: p.axis },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = (arr[0] as { dataIndex?: number })?.dataIndex ?? 0
        const d = daysArr[idx]
        if (!d) return ''
        return [
          d.date,
          `已完成训练 ${d.submittedSessions}`,
          `练习题次 ${d.practicedItems}`,
          `明确正确 ${d.correctCount}`,
          `明确错误 ${d.wrongCount}`,
        ].join('<br/>')
      },
    },
    grid: { left: 40, right: 16, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      data: cats,
      axisLabel: {
        color: p.axis,
        fontSize: 10,
        interval: 4,
        rotate: 40,
      },
      axisLine: { lineStyle: { color: p.axis } },
    },
    yAxis: {
      type: 'value',
      name: '题次',
      minInterval: 1,
      axisLabel: { color: p.axis },
      splitLine: { lineStyle: { color: p.split } },
    },
    series: [
      {
        type: 'bar',
        data: vals.map((v) => ({
          value: v,
          itemStyle: { color: heatColor(v), borderRadius: [3, 3, 0, 0] },
        })),
        barMaxWidth: 18,
      },
    ],
  })
  bindRo(calRef.value, calChart)
  void row
  void weeks
}

function renderTrend(p: ReturnType<typeof getChartPalette>) {
  if (!trendRef.value || !data.value) return
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  else trendChart.clear()
  const t = data.value.trend
  trendChart.setOption({
    backgroundColor: 'transparent',
    textStyle: { color: p.axis },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = (arr[0] as { dataIndex?: number })?.dataIndex ?? 0
        const d = t[idx]
        if (!d) return ''
        const acc =
          d.accuracyPercent == null ? '无数据' : `${d.accuracyPercent}%`
        return [
          d.date,
          `练习题次 ${d.practicedItems}`,
          `正确 ${d.correctCount}`,
          `错误 ${d.wrongCount}`,
          `待复核 ${d.pendingReviewCount}`,
          `正确率 ${acc}`,
        ].join('<br/>')
      },
    },
    legend: {
      data: ['练习题次', '正确率'],
      textStyle: { color: p.legend },
    },
    grid: { left: 48, right: 48, top: 40, bottom: 48 },
    xAxis: {
      type: 'category',
      data: t.map((d) => d.date.slice(5)),
      axisLabel: { color: p.axis, fontSize: 11, rotate: days.value === 30 ? 40 : 0 },
      axisLine: { lineStyle: { color: p.axis } },
    },
    yAxis: [
      {
        type: 'value',
        name: '题次',
        minInterval: 1,
        axisLabel: { color: p.axis },
        splitLine: { lineStyle: { color: p.split } },
      },
      {
        type: 'value',
        name: '正确率%',
        min: 0,
        max: 100,
        axisLabel: { color: p.classRank },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '练习题次',
        type: 'bar',
        data: t.map((d) => d.practicedItems),
        itemStyle: { color: p.bar, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        data: t.map((d) => d.accuracyPercent),
        connectNulls: false,
        itemStyle: { color: p.classRank },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 7,
      },
    ],
  })
  bindRo(trendRef.value, trendChart)
}

function renderSpecialty(p: ReturnType<typeof getChartPalette>) {
  if (!specRef.value || !data.value) return
  if (!specChart) specChart = echarts.init(specRef.value)
  else specChart.clear()
  const items = data.value.specialties.items.filter((x) => !x.empty)
  if (!items.length) {
    specChart.setOption({
      title: {
        text: '窗口内暂无专项答题记录',
        left: 'center',
        top: 'middle',
        textStyle: { color: p.axis, fontSize: 14, fontWeight: 400 },
      },
    })
    bindRo(specRef.value, specChart)
    return
  }
  const names = items.map((x) => x.specialtyName)
  const acc = items.map((x) =>
    x.accuracyPercent == null ? null : x.accuracyPercent,
  )
  specChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = (arr[0] as { dataIndex?: number })?.dataIndex ?? 0
        const it = items[idx]
        if (!it) return ''
        return [
          it.specialtyName,
          `练习 ${it.practicedItems}`,
          `正确 ${it.correctCount} / 错误 ${it.wrongCount}`,
          `正确率 ${it.accuracyPercent == null ? '无数据' : it.accuracyPercent + '%'}`,
          `样本量 ${it.gradedItems}${it.sampleLow ? '（样本较少）' : ''}`,
        ].join('<br/>')
      },
    },
    grid: { left: 110, right: 40, top: 16, bottom: 24 },
    xAxis: {
      type: 'value',
      max: 100,
      name: '%',
      axisLabel: { color: p.axis },
      splitLine: { lineStyle: { color: p.split } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: p.axis, fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: acc,
        itemStyle: { color: p.score, borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 18,
        label: {
          show: true,
          position: 'right',
          formatter: (p2: { value?: number | null }) =>
            p2.value == null ? '无数据' : `${p2.value}%`,
          color: p.legend,
          fontSize: 11,
        },
      },
    ],
  })
  bindRo(specRef.value, specChart)
}

function renderDifficulty(p: ReturnType<typeof getChartPalette>) {
  if (!diffRef.value || !data.value) return
  if (!diffChart) diffChart = echarts.init(diffRef.value)
  else diffChart.clear()
  const items = data.value.difficulties.items
  const labels = items.map((d) => d.label)
  diffChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['练习题次', '正确', '错误', '待复核'],
      textStyle: { color: p.legend },
    },
    grid: { left: 48, right: 16, top: 40, bottom: 32 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: p.axis },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: p.axis },
      splitLine: { lineStyle: { color: p.split } },
    },
    series: [
      {
        name: '练习题次',
        type: 'bar',
        data: items.map((d) => d.practicedItems),
        itemStyle: { color: p.bar },
        barMaxWidth: 28,
      },
      {
        name: '正确',
        type: 'bar',
        data: items.map((d) => d.correctCount),
        itemStyle: { color: '#67c23a' },
        barMaxWidth: 28,
      },
      {
        name: '错误',
        type: 'bar',
        data: items.map((d) => d.wrongCount),
        itemStyle: { color: '#f56c6c' },
        barMaxWidth: 28,
      },
      {
        name: '待复核',
        type: 'bar',
        data: items.map((d) => d.pendingReviewCount),
        itemStyle: { color: '#e6a23c' },
        barMaxWidth: 28,
      },
    ],
  })
  bindRo(diffRef.value, diffChart)
}

function renderWrong(p: ReturnType<typeof getChartPalette>) {
  if (!wrongRef.value || !data.value) return
  if (!wrongChart) wrongChart = echarts.init(wrongRef.value)
  else wrongChart.clear()
  const w = data.value.wrongStatus
  const total = w.totalWrongItems
  if (!total) {
    wrongChart.setOption({
      title: {
        text: '暂无错题记录',
        left: 'center',
        top: 'middle',
        textStyle: { color: p.axis, fontSize: 14, fontWeight: 400 },
      },
    })
    bindRo(wrongRef.value, wrongChart)
    return
  }
  wrongChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '50%'],
        label: {
          formatter: '{b}\n{c} ({d}%)',
          color: p.axis,
          fontSize: 11,
        },
        data: [
          { name: '待攻克', value: w.openCount, itemStyle: { color: '#f56c6c' } },
          {
            name: '巩固中',
            value: w.consolidatingCount,
            itemStyle: { color: '#e6a23c' },
          },
          {
            name: '已掌握',
            value: w.masteredCount,
            itemStyle: { color: '#67c23a' },
          },
        ],
      },
    ],
    graphic: {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: `共 ${total}`,
        fill: p.legend,
        fontSize: 16,
        fontWeight: 600,
      },
    },
  })
  bindRo(wrongRef.value, wrongChart)
}

function renderTopWrong(p: ReturnType<typeof getChartPalette>) {
  if (!topWrongRef.value || !data.value) return
  if (!topWrongChart) topWrongChart = echarts.init(topWrongRef.value)
  else topWrongChart.clear()
  const items = data.value.topWrongSpecialties.items
  if (!items.length) {
    topWrongChart.clear()
    return
  }
  topWrongChart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = Array.isArray(params) ? params : [params]
        const idx = (arr[0] as { dataIndex?: number })?.dataIndex ?? 0
        const it = items[idx]
        if (!it) return ''
        return [
          it.specialtyName,
          `明确错误 ${it.wrongCount}`,
          `练习题次 ${it.practicedItems}`,
          `错误率 ${it.errorRatePercent == null ? '—' : it.errorRatePercent + '%'}`,
          `当前待攻克 ${it.openWrongCount}`,
          it.sampleNote || '',
        ]
          .filter(Boolean)
          .join('<br/>')
      },
    },
    grid: { left: 110, right: 40, top: 12, bottom: 24 },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: p.axis },
      splitLine: { lineStyle: { color: p.split } },
    },
    yAxis: {
      type: 'category',
      data: items.map((x) => x.specialtyName).reverse(),
      axisLabel: { color: p.axis },
    },
    series: [
      {
        type: 'bar',
        data: items.map((x) => x.wrongCount).reverse(),
        itemStyle: { color: '#f56c6c', borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 18,
      },
    ],
  })
  bindRo(topWrongRef.value, topWrongChart)
}

async function reload() {
  loading.value = true
  loadError.value = ''
  try {
    data.value = await getChemAnalytics(days.value)
    await nextTick()
    disposeAll()
    renderAll()
  } catch (e) {
    loadError.value = errMsg(e, '加载学习分析失败')
    data.value = null
  } finally {
    loading.value = false
  }
}

watch(isDark, () => nextTick(() => renderAll()))

onMounted(() => {
  void reload()
})

onBeforeUnmount(() => {
  disposeAll()
})
</script>

<style scoped>
.analytics {
  padding: 16px 20px 32px;
  max-width: 1080px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 4px 0 6px;
  font-size: 1.25rem;
}
.sub {
  margin: 0;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}
.sec {
  margin-bottom: 22px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.sec h2 {
  margin: 0 0 6px;
  font-size: 1.05rem;
}
.sec h3 {
  margin: 16px 0 6px;
  font-size: 0.98rem;
}
.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 14px;
}
.card .n {
  font-size: 1.4rem;
  font-weight: 700;
  color: #303133;
}
.card .l {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
.chart {
  width: 100%;
  min-height: 260px;
}
.chart-cal {
  min-height: 220px;
}
.chart-spec,
.chart-top {
  min-height: 320px;
}
.chart-wrong {
  min-height: 280px;
}
.table {
  margin-top: 10px;
  width: 100%;
}
.ml {
  margin-left: 6px;
}
.diff-notes {
  margin: 10px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: #606266;
  line-height: 1.7;
}
.wrong-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
  align-items: center;
}
.wrong-side p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #606266;
}
.wrong-side .due {
  color: #f56c6c;
}
.sug-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sug p {
  margin: 0 0 10px;
  line-height: 1.55;
  color: #303133;
}
@media (max-width: 720px) {
  .analytics {
    padding: 12px;
  }
  .wrong-grid {
    grid-template-columns: 1fr;
  }
  .chart-spec,
  .chart-top {
    min-height: 280px;
  }
}
</style>
