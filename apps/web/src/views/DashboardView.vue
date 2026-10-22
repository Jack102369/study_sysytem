<template>
  <div v-loading="loading" class="dash page-fill">
    <div v-if="data" class="dash-body">
      <section class="col-left">
        <div class="metrics">
          <CardSpotlight
            v-for="m in metrics"
            :key="m.label"
            class="metric-card ui-lift"
            slot-class="metric-inner"
          >
            <div class="metric">{{ m.label }}</div>
            <div class="value"><CountUp :value="m.value" /></div>
            <el-button
              v-if="m.link"
              type="primary"
              link
              size="small"
              @click="$router.push(m.link)"
            >
              {{ m.linkText }}
            </el-button>
          </CardSpotlight>
        </div>

        <el-card v-if="data.mood" shadow="never" class="mood-panel">
          <template #header>
            <div class="mood-head">
              <span>学情心情 · 最近考试对比</span>
              <div class="mood-actions">
                <el-select
                  v-model="compareMode"
                  size="small"
                  style="width: 118px"
                  :loading="prefsSaving"
                  @change="(v: string | number | boolean) => onCompareModeChange(String(v) as StudyCompareMode)"
                >
                  <el-option label="按分数" value="score" />
                  <el-option label="按班排" value="class_rank" />
                  <el-option label="按校排" value="school_rank" />
                </el-select>
                <el-button text type="primary" @click="$router.push('/settings/study-prefs')">
                  更多设置
                </el-button>
              </div>
            </div>
          </template>
          <p class="mood-summary">{{ data.mood.summary }}</p>
          <div v-if="data.mood.items?.length" class="mood-cards">
            <div
              v-for="item in data.mood.items"
              :key="item.subjectId"
              class="mood-card ui-lift"
              :class="[`mood-${item.mood}`, { warn: item.warn }]"
            >
              <div class="mood-face">{{ item.face }}</div>
              <div class="mood-body">
                <div class="mood-main">
                  <span class="mood-label">{{ item.label }}</span>
                  <span
                    v-if="moodDelta(item)"
                    class="mood-delta"
                    :class="item.mood"
                  >
                    {{ moodDelta(item) }}
                  </span>
                </div>
                <div class="mood-detail">{{ item.detail }}</div>
              </div>
              <div class="mood-ops">
                <el-button
                  v-if="item.warn || item.unmasteredErrorCount > 0"
                  link
                  type="warning"
                  size="small"
                  title="去复习该科错题"
                  @click="$router.push(`/errors?subjectId=${item.subjectId}`)"
                >
                  错题
                </el-button>
                <el-button
                  link
                  type="primary"
                  size="small"
                  title="今日复习"
                  @click="$router.push('/reviews')"
                >
                  复习
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="录入至少两场含同科目的成绩后可对比" :image-size="40" />
        </el-card>

        <el-card shadow="never" class="chart-panel">
          <template #header>
            <div class="card-head">
              <span>近30天总分趋势</span>
              <el-radio-group v-model="chartType" size="small" @change="renderTrend">
                <el-radio-button label="line">折线</el-radio-button>
                <el-radio-button label="bar">柱状</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartBodyRef" class="chart-body">
            <div v-show="data.scoreTrend30d?.length" ref="trendRef" class="chart" />
            <el-empty
              v-if="!data.scoreTrend30d?.length"
              description="暂无成绩"
              :image-size="48"
            />
          </div>
        </el-card>
      </section>

      <section class="col-right">
        <CardSpotlight
          v-if="data.points"
          class="points-bar ui-lift"
          slot-class="points-bar-inner"
          gradient-color="rgba(96, 165, 250, 0.28)"
          @click="$router.push('/settings/rewards')"
        >
          <div class="points-bar-main">
            <div class="points-bar-left">
              <span class="points-bar-label">累计积分</span>
              <b class="points-bar-num"><CountUp :value="data.points.totalPoints" /></b>
              <span class="points-bar-week">本周 {{ data.points.weekPoints }}</span>
              <el-tag
                v-if="latestUnlocked"
                type="success"
                effect="plain"
                size="small"
              >
                {{ latestUnlocked.title }}
              </el-tag>
            </div>
            <el-button link type="primary" size="small" @click.stop="$router.push('/settings/rewards')">
              奖励与流水
            </el-button>
          </div>
          <div v-if="data.points.nextTier" class="points-bar-goal">
            <span>
              下一目标
              <span class="points-bar-goal-title">「{{ data.points.nextTier.title }}」</span>
              还需
              <b>{{ data.points.nextTier.remain }}</b> 分
            </span>
            <span class="points-bar-reward">
              奖励：{{ data.points.nextTier.rewardNote?.trim() || '待约定，去设置吧' }}
            </span>
            <span class="points-bar-cheer">加油，冲下一档！</span>
          </div>
          <div v-else class="points-bar-goal">
            <span>已达最高档，继续保持！</span>
            <span class="points-bar-cheer">太棒了，继续加油！</span>
          </div>
        </CardSpotlight>

        <div class="lists-row">
          <el-card shadow="never" header="最紧急待复习" class="list-panel">
            <el-table
              v-if="data.urgentReviews?.length"
              :data="data.urgentReviews"
              size="small"
            >
              <el-table-column prop="subjectName" label="科目" min-width="72" sortable>
                <template #default="{ row }">{{ row.subjectName || '—' }}</template>
              </el-table-column>
              <el-table-column
                prop="status"
                label="状态"
                width="78"
                sortable
                :sort-method="errorStatusSort"
              >
                <template #default="{ row }">
                  <el-tag :type="errorStatusTagType(row.status)" size="small">
                    {{ statusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="56">
                <template #default="{ row }">
                  <el-button link type="primary" @click="$router.push(`/errors/${row.id}`)">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无待复习" :image-size="36" />
          </el-card>

          <el-card shadow="never" header="薄弱科目" class="list-panel">
            <el-table
              v-if="data.weakSubjects?.length"
              :data="data.weakSubjects"
              size="small"
            >
              <el-table-column prop="subjectName" label="科目" min-width="72" sortable />
              <el-table-column prop="errorCount" label="错题" width="58" />
              <el-table-column label="掌握%" width="64">
                <template #default="{ row }">
                  <span :class="{ rank: row.masteryRate < 50 }">{{ row.masteryRate }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无数据" :image-size="36" />
          </el-card>
        </div>

        <el-card shadow="never" header="高频错因类别 TOP5" class="top-panel">
          <el-table
            v-if="data.topCategories?.length"
            :data="data.topCategories"
            size="small"
            height="100%"
          >
            <el-table-column prop="name" label="类别" min-width="100" show-overflow-tooltip />
            <el-table-column prop="count" label="次数" width="56" />
            <el-table-column prop="suggestion" label="建议" min-width="90" show-overflow-tooltip />
          </el-table>
          <el-empty v-else description="暂无数据" :image-size="36" />
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { fetchDashboard, type DashboardMoodItem } from '@/api/dashboard'
import { updateStudyPrefs, type StudyCompareMode } from '@/api/study-prefs'
import { useTheme } from '@/composables/useTheme'
import { getChartPalette, seriesStyle, type ChartType } from '@/utils/chart-theme'
import { statusLabel } from '@/utils/status-label'
import { errorStatusSort, errorStatusTagType } from '@/utils/table-ui'
import errMsg from '@/utils/err-msg'
import CountUp from '@/components/ui/CountUp.vue'
import { CardSpotlight } from '@/components/ui/card-spotlight'

const loading = ref(false)
const data = ref<any>(null)
const chartType = ref<ChartType>('line')
const compareMode = ref<StudyCompareMode>('score')
const prefsSaving = ref(false)
const trendRef = ref<HTMLDivElement>()
const chartBodyRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let chartRo: ResizeObserver | null = null
const { isDark } = useTheme()

const metrics = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    {
      label: '今日待复习',
      value: d.todayReviewCount,
      link: '/reviews',
      linkText: '去复习',
    },
    { label: '错题总数', value: d.errorStats?.total ?? 0 },
    { label: '掌握率', value: `${d.errorStats?.masteryRate ?? 0}%` },
    {
      label: '近7天新增/掌握',
      value: `${d.errorStats?.last7Days?.created ?? 0} / ${d.errorStats?.last7Days?.mastered ?? 0}`,
    },
  ]
})

const latestUnlocked = computed(() => {
  const tiers = data.value?.points?.unlockedTiers
  if (!tiers?.length) return null
  return tiers[tiers.length - 1]
})

function moodDelta(item: DashboardMoodItem): string | null {
  const rise = item.detail.match(/上升\s*(\d+)/)
  if (rise) return `+${rise[1]}`
  const drop = item.detail.match(/下降\s*(\d+)/)
  if (drop) return `-${drop[1]}`
  const pct = item.label.match(/([+-]\d+(?:\.\d+)?%)/)
  if (pct) return pct[1]
  const scored = item.label.match(/\s([+-]\d+)$/)
  if (scored) return scored[1]
  return null
}

onMounted(async () => {
  loading.value = true
  try {
    const dash = await fetchDashboard()
    data.value = dash
    compareMode.value = dash.studyPrefs?.compareMode || 'score'
    window.addEventListener('resize', onResize)
  } catch (e) {
    ElMessage.error(errMsg(e, '加载仪表盘失败'))
  } finally {
    loading.value = false
    await nextTick()
    bindChartObserver()
    renderTrend()
  }
})

async function onCompareModeChange(mode: StudyCompareMode) {
  prefsSaving.value = true
  try {
    await updateStudyPrefs({ compareMode: mode })
    data.value = await fetchDashboard()
    compareMode.value = data.value.studyPrefs?.compareMode || mode
    ElMessage.success('已切换对比口径')
    await nextTick()
    renderTrend()
  } catch (e) {
    ElMessage.error(errMsg(e, '切换失败'))
    compareMode.value = data.value?.studyPrefs?.compareMode || 'score'
  } finally {
    prefsSaving.value = false
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartRo?.disconnect()
  chartRo = null
  chart?.dispose()
  chart = null
})

watch(isDark, () => nextTick(() => renderTrend()))

function onResize() {
  chart?.resize()
}

function bindChartObserver() {
  chartRo?.disconnect()
  chartRo = null
  if (!chartBodyRef.value || typeof ResizeObserver === 'undefined') return
  chartRo = new ResizeObserver(() => {
    chart?.resize()
  })
  chartRo.observe(chartBodyRef.value)
}

function renderTrend() {
  const points = data.value?.scoreTrend30d || []
  if (!trendRef.value || !points.length) return
  if (!chart) chart = echarts.init(trendRef.value)
  else chart.clear()

  const p = getChartPalette(isDark.value)
  const t = chartType.value
  const labelOpts = { labelColor: p.legend }

  chart.setOption({
    backgroundColor: 'transparent',
    textStyle: { color: p.axis },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['总分', '班排', '校排'],
      textStyle: { color: p.legend },
      top: 0,
    },
    grid: { left: 28, right: 36, top: 28, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: points.map((pt: any) => formatShortDate(pt.heldAt)),
      axisLabel: { color: p.axis, fontSize: 11, hideOverlap: true },
      axisLine: { lineStyle: { color: p.axis } },
    },
    yAxis: [
      {
        type: 'value',
        name: '分',
        scale: true,
        axisLabel: { color: p.axis },
        nameTextStyle: { color: p.axis },
        splitLine: { lineStyle: { color: p.split } },
      },
      {
        type: 'value',
        name: '名次',
        inverse: true,
        minInterval: 1,
        scale: true,
        axisLabel: { color: p.schoolRank },
        nameTextStyle: { color: p.schoolRank },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '总分',
        data: points.map((pt: any) => pt.totalScore),
        ...seriesStyle(t, p.score, { lineWidth: 3, ...labelOpts }),
      },
      {
        name: '班排',
        yAxisIndex: 1,
        data: points.map((pt: any) => pt.classRank ?? null),
        ...seriesStyle(t, p.classRank, {
          lineWidth: 2,
          rankAxis: true,
          ...labelOpts,
        }),
      },
      {
        name: '校排',
        yAxisIndex: 1,
        data: points.map((pt: any) => pt.schoolRank ?? null),
        ...seriesStyle(t, p.schoolRank, {
          lineWidth: 3,
          rankAxis: true,
          ...labelOpts,
        }),
      },
    ],
  })
  requestAnimationFrame(() => chart?.resize())
}

function formatShortDate(raw: string | Date | null | undefined): string {
  if (!raw) return ''
  const s = String(raw)
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[2]}-${m[3]}`
  const d = raw instanceof Date ? raw : new Date(s.replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return s
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${mo}-${day}`
}
</script>

<style scoped>
.dash {
  min-height: 0;
}
.dash-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
  height: 100%;
}
.col-left {
  flex: 1.55;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.col-right {
  flex: 1;
  min-width: 280px;
  max-width: 520px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.mood-panel {
  flex-shrink: 0;
}
.mood-panel :deep(.el-card__header) {
  padding: 8px 12px;
}
.mood-panel :deep(.el-card__body) {
  padding: 8px 12px 10px;
}
.mood-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  font-weight: 600;
}
.mood-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.mood-summary {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--app-text-secondary);
  line-height: 1.4;
}
.mood-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.mood-card {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-bg, transparent);
  min-width: 0;
}
.mood-card.mood-up {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.08);
}
.mood-card.mood-down {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}
.mood-card.mood-flat {
  border-color: #909399;
}
.mood-card.warn {
  box-shadow: inset 3px 0 0 #e6a23c;
}
.mood-face {
  font-size: 22px;
  line-height: 1.2;
  flex-shrink: 0;
}
.mood-body {
  flex: 1;
  min-width: 0;
}
.mood-main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.mood-label {
  font-weight: 700;
  font-size: 13px;
  color: var(--app-text);
  line-height: 1.3;
}
.mood-delta {
  font-size: 11px;
  font-weight: 700;
  padding: 0 5px;
  border-radius: 4px;
  line-height: 18px;
}
.mood-delta.up {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.15);
}
.mood-delta.down {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.15);
}
.mood-delta.flat,
.mood-delta.skip {
  color: #909399;
  background: rgba(144, 147, 153, 0.12);
}
.mood-detail {
  margin-top: 2px;
  font-size: 11px;
  color: var(--app-text-secondary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mood-ops {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  flex-shrink: 0;
}
.mood-ops :deep(.el-button) {
  margin: 0;
  padding: 0;
  height: auto;
}

.chart-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chart-panel :deep(.el-card__header) {
  padding: 8px 12px;
  flex-shrink: 0;
}
.chart-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 4px 8px 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.chart-body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.chart {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.chart :deep(canvas),
.chart > div {
  max-width: 100% !important;
  max-height: 100% !important;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  flex-shrink: 0;
}
.metric-card {
  min-width: 0;
  box-shadow: var(--app-shadow-sm);
}
.metric-inner {
  padding: 8px 10px;
}
.metric {
  color: var(--app-text-secondary);
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.value {
  font-size: 18px;
  font-weight: 700;
  margin: 2px 0 0;
  color: var(--app-text);
  line-height: 1.25;
}

.points-bar {
  flex-shrink: 0;
  border-color: color-mix(in srgb, var(--app-primary) 35%, transparent) !important;
  background: var(--app-primary-soft) !important;
  cursor: pointer;
}
.points-bar-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
}
.points-bar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}
.points-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.points-bar-label {
  font-size: 13px;
  color: var(--app-text-secondary);
}
.points-bar-num {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}
html.dark .points-bar-num {
  color: #69b1ff;
}
.points-bar-week {
  font-size: 12px;
  color: var(--app-text-secondary);
}
.points-bar-goal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 12px;
  color: var(--app-text-secondary);
  line-height: 1.4;
}
.points-bar-goal-title {
  font-weight: 700;
  background-image: linear-gradient(
    110deg,
    #8a6a1f 0%,
    #c9a227 18%,
    #ffe9a0 36%,
    #f5d76e 48%,
    #fff8d6 52%,
    #d4af37 68%,
    #a67c00 100%
  );
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 0.5px rgba(212, 175, 55, 0.55));
  animation: points-goal-gilt 2.8s linear infinite;
}
@keyframes points-goal-gilt {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: -100% 50%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .points-bar-goal-title {
    animation: none;
    background-position: 40% 50%;
  }
}
.points-bar-goal b {
  color: #409eff;
  font-weight: 700;
}
html.dark .points-bar-goal b {
  color: #69b1ff;
}
.points-bar-reward {
  color: var(--app-text);
}
.points-bar-cheer {
  color: #e6a23c;
  font-weight: 600;
}

.lists-row {
  flex: 0 1 auto;
  max-height: 34%;
  min-height: 0;
  display: flex;
  gap: 8px;
  overflow: hidden;
}
.list-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.list-panel :deep(.el-card__header) {
  padding: 8px 10px;
  font-size: 13px;
  flex-shrink: 0;
}
.list-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 0 4px 6px;
  overflow: auto;
}

.top-panel {
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-panel :deep(.el-card__header) {
  padding: 8px 10px;
  font-size: 13px;
  flex-shrink: 0;
}
.top-panel :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  padding: 4px 6px 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1100px) {
  .dash.page-fill {
    overflow: auto;
  }
  .dash-body {
    flex-direction: column;
    height: auto;
    min-height: 100%;
  }
  .col-left,
  .col-right {
    max-width: none;
    flex: none;
  }
  .chart-panel {
    min-height: 260px;
  }
  .chart {
    position: relative;
    height: 220px;
  }
  .lists-row {
    max-height: none;
    min-height: 180px;
  }
  .top-panel {
    flex: none;
    min-height: 180px;
  }
  .mood-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mood-cards {
    grid-template-columns: 1fr;
  }
  .lists-row {
    flex-direction: column;
    min-height: 360px;
  }
}
</style>
