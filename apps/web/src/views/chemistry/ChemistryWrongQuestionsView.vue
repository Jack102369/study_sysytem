<template>
  <div class="page-fill wrong-center" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goHome">← 返回化学首页</el-button>
        <h1>我的错题</h1>
        <p class="sub">原题复练 · 状态按真实答题回放 · 不计入每日完成次数</p>
      </div>
      <div class="acts">
        <el-button :loading="rebuilding" @click="onRebuild">重建索引</el-button>
        <el-dropdown trigger="click" @command="startPractice">
          <el-button type="primary" :loading="practicing">
            一键复练
            <span class="caret">▾</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="5">5 题</el-dropdown-item>
              <el-dropdown-item :command="10">10 题</el-dropdown-item>
              <el-dropdown-item :command="20">20 题</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div v-if="summary" class="stats">
      <div class="stat">
        <div class="n">{{ summary.openCount }}</div>
        <div class="l">待攻克</div>
      </div>
      <div class="stat">
        <div class="n">{{ summary.consolidatingCount }}</div>
        <div class="l">巩固中</div>
      </div>
      <div class="stat">
        <div class="n">{{ summary.masteredCount }}</div>
        <div class="l">已掌握</div>
      </div>
      <div class="stat due">
        <div class="n">{{ summary.dueTodayCount }}</div>
        <div class="l">今天建议复习</div>
      </div>
    </div>
    <p v-if="summary?.rules" class="rule-hint">{{ summary.rules.dueTodayNote }}</p>

    <el-card shadow="never" class="card">
      <div class="filters">
        <el-radio-group v-model="statusFilter" @change="onStatusChange">
          <el-radio-button value="due_today">今日复习</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="open">待攻克</el-radio-button>
          <el-radio-button value="consolidating">巩固中</el-radio-button>
          <el-radio-button value="mastered">已掌握</el-radio-button>
        </el-radio-group>
        <el-tag v-if="focusDue" type="danger" effect="plain" size="small">
          已筛选：今日建议复习
        </el-tag>
        <el-select
          v-model="sort"
          style="width: 140px"
          @change="reload"
        >
          <el-option label="优先复练" value="priority" />
          <el-option label="错误次数" value="wrong_count" />
          <el-option label="最近做错" value="recent_wrong" />
        </el-select>
      </div>

      <el-empty
        v-if="!loading && !rows.length"
        :description="
          focusDue
            ? '今天暂无需要复习的错题'
            : '暂无错题记录（完成训练后做错的题目会出现在这里）'
        "
      />

      <el-table v-else :data="rows" stripe style="width: 100%" @row-click="goDetail">
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTag(row.status)">
              {{ row.statusLabel }}
            </el-tag>
            <el-tag
              v-if="row.dueToday"
              size="small"
              type="danger"
              effect="plain"
              style="margin-left: 4px"
            >
              今
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题干" min-width="220">
          <template #default="{ row }">
            <span class="stem">{{ row.stemPreview }}</span>
          </template>
        </el-table-column>
        <el-table-column label="专项/分类" min-width="140">
          <template #default="{ row }">
            {{ row.specialtyName || '—' }} / {{ row.categoryName || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="wrongCount" label="错次" width="70" />
        <el-table-column label="最近做错" width="150">
          <template #default="{ row }">{{ formatTime(row.lastWrongAt) }}</template>
        </el-table-column>
        <el-table-column label="可复练" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.practiceEligible ? 'success' : 'info'">
              {{ row.practiceEligible ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="goDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @current-change="onPage"
        />
      </div>
    </el-card>

    <el-card v-if="weak?.items?.length" shadow="never" class="card">
      <h2>薄弱分类（答题统计）</h2>
      <p class="sub">{{ weak.note }}</p>
      <el-table :data="weak.items.slice(0, 8)" size="small" stripe>
        <el-table-column label="分类" min-width="160">
          <template #default="{ row }">
            {{ row.specialtyName }} / {{ row.categoryName }}
          </template>
        </el-table-column>
        <el-table-column prop="wrongCount" label="错误" width="70" />
        <el-table-column label="正确率" width="90">
          <template #default="{ row }">
            {{ row.accuracyPercent == null ? '—' : row.accuracyPercent + '%' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="openOrConsolidatingWrongItems"
          label="待巩固题"
          width="90"
        />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createChemWrongPractice,
  getChemWrongSummary,
  getChemWrongWeakStats,
  listChemWrongQuestions,
  rebuildChemWrongBook,
  type ChemWrongListItem,
  type ChemWrongSummary,
  type ChemWrongWeakItem,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const practicing = ref(false)
const rebuilding = ref(false)
const summary = ref<ChemWrongSummary | null>(null)
const weak = ref<{ note: string; items: ChemWrongWeakItem[] } | null>(null)
const rows = ref<ChemWrongListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const statusFilter = ref('all')
const sort = ref('priority')

const focusDue = computed(
  () =>
    String(route.query.focus || '') === 'due' || statusFilter.value === 'due_today',
)

function applyFocusFromRoute() {
  if (String(route.query.focus || '') === 'due') {
    statusFilter.value = 'due_today'
  }
}

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

function statusTag(s: string) {
  if (s === 'open') return 'danger'
  if (s === 'consolidating') return 'warning'
  if (s === 'mastered') return 'success'
  return 'info'
}

function goHome() {
  void router.push('/chemistry')
}

function goDetail(row: ChemWrongListItem) {
  void router.push(`/chemistry/wrong-questions/${encodeURIComponent(row.id)}`)
}

async function loadSummary() {
  summary.value = await getChemWrongSummary()
  weak.value = await getChemWrongWeakStats(20)
}

async function loadList() {
  const due = statusFilter.value === 'due_today'
  const specialtyCode = String(route.query.specialtyCode || '') || undefined
  const data = await listChemWrongQuestions({
    status: due ? undefined : statusFilter.value,
    dueToday: due ? '1' : undefined,
    specialtyCode,
    sort: sort.value,
    page: page.value,
    pageSize,
  })
  rows.value = data.items
  total.value = data.total
}

function onStatusChange() {
  // 离开今日筛选时清掉 URL focus，避免刷新又回到 due
  if (statusFilter.value !== 'due_today' && route.query.focus === 'due') {
    void router.replace({ path: '/chemistry/wrong-questions', query: {} })
  } else if (statusFilter.value === 'due_today' && route.query.focus !== 'due') {
    void router.replace({
      path: '/chemistry/wrong-questions',
      query: { focus: 'due' },
    })
  }
  reload()
}

async function load() {
  loading.value = true
  try {
    await Promise.all([loadSummary(), loadList()])
  } catch (e) {
    ElMessage.error(errMsg(e, '加载错题中心失败'))
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  void load()
}

function onPage(p: number) {
  page.value = p
  void loadList().catch((e) => ElMessage.error(errMsg(e, '加载失败')))
}

async function startPractice(count: number) {
  practicing.value = true
  try {
    const session = await createChemWrongPractice(count as 5 | 10 | 20)
    if (session.pickMeta?.shortfall) {
      ElMessage.warning(session.pickMeta.shortfall)
    }
    void router.push(`/chemistry/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '无法开始复练'))
  } finally {
    practicing.value = false
  }
}

async function onRebuild() {
  rebuilding.value = true
  try {
    const r = await rebuildChemWrongBook()
    ElMessage.success(`已重建 ${r.itemCount} 道错题索引`)
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '重建失败'))
  } finally {
    rebuilding.value = false
  }
}

watch(
  () => route.query.focus,
  () => {
    applyFocusFromRoute()
    page.value = 1
    void load()
  },
)

onMounted(() => {
  applyFocusFromRoute()
  void load()
})
</script>

<style scoped>
.wrong-center {
  padding: 16px 20px 40px;
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
  margin: 4px 0 0;
  font-size: 1.25rem;
}
.sub {
  margin: 4px 0 0;
  color: #909399;
  font-size: 13px;
}
.acts {
  display: flex;
  gap: 8px;
  align-items: center;
}
.caret {
  margin-left: 4px;
  font-size: 12px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}
.stat {
  border-radius: 10px;
  padding: 12px 14px;
  background: color-mix(in srgb, var(--el-color-info) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
}
.stat.due {
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}
.stat .n {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.stat .l {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.75;
}
.rule-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
}
.card {
  margin-bottom: 14px;
  border-radius: 12px;
}
.card h2 {
  margin: 0 0 4px;
  font-size: 16px;
}
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  align-items: center;
}
.stem {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 720px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .wrong-center {
    padding: 12px;
  }
}
</style>
