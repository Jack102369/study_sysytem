<template>
  <div class="page-fill train-history" v-loading="loading">
    <div class="toolbar">
      <div>
        <h1>训练历史</h1>
        <p class="sub">仅显示当前账号的记录 · 列表不含标准答案</p>
      </div>
      <el-button @click="goHome">返回数学首页</el-button>
    </div>

    <div class="filters">
      <el-select
        v-model="status"
        clearable
        placeholder="状态"
        style="width: 120px"
        @change="onFilter"
      >
        <el-option label="进行中" value="in_progress" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-select
        v-model="specialtyId"
        clearable
        filterable
        placeholder="章节"
        style="width: 200px"
        @change="onSpecialtyChange"
      >
        <el-option
          v-for="sp in specialties"
          :key="sp.id"
          :label="sp.name"
          :value="sp.id"
        />
      </el-select>
      <el-select
        v-model="categoryId"
        clearable
        filterable
        placeholder="分类"
        style="width: 180px"
        :disabled="!specialtyId"
        @change="onFilter"
      >
        <el-option
          v-for="c in categories"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日"
        end-placeholder="结束日"
        @change="onFilter"
      />
    </div>

    <el-empty v-if="!loading && !rows.length" description="暂无训练记录" />

    <el-table v-else :data="rows" stripe style="width: 100%">
      <el-table-column label="时间" min-width="160">
        <template #default="{ row }">{{ formatTime(row.startedAt) }}</template>
      </el-table-column>
      <el-table-column label="章节" min-width="160">
        <template #default="{ row }">
          {{ row.specialtyName || '—' }} / {{ row.categoryName || '—' }}
        </template>
      </el-table-column>
      <el-table-column label="难度" width="90">
        <template #default="{ row }">
          {{ difficultyLabel(row.difficulty) }}
        </template>
      </el-table-column>
      <el-table-column label="题量" width="80">
        <template #default="{ row }">{{ row.questionCount }}</template>
      </el-table-column>
      <el-table-column label="正确率" width="90">
        <template #default="{ row }">
          {{ formatAccuracyRatio(row.accuracy) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)">
            {{ sessionStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'in_progress'"
            link
            type="primary"
            @click="goSession(row.sessionId)"
          >
            继续训练
          </el-button>
          <el-button
            v-else-if="row.status === 'completed'"
            link
            type="primary"
            @click="goResult(row.sessionId)"
          >
            查看结果
          </el-button>
          <el-button
            v-else
            link
            type="info"
            @click="goSession(row.sessionId)"
          >
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getHsMathSpecialty,
  listHsMathSpecialties,
  type HsMathCategoryItem,
  type HsMathSessionSummary,
  type HsMathSpecialtySummary,
} from '@/api/hs-math'
import {
  listHsMathTrainSessions,
  type HsMathSessionStatus,
} from '@/api/hs-math-train'
import {
  difficultyLabel,
  formatAccuracyRatio,
  sessionStatusLabel,
} from '@/utils/hs-math-format'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const rows = ref<HsMathSessionSummary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const status = ref<HsMathSessionStatus | undefined>()
const specialtyId = ref<string | undefined>()
const categoryId = ref<string | undefined>()
const dateRange = ref<[string, string] | null>(null)
const specialties = ref<HsMathSpecialtySummary[]>([])
const categories = ref<HsMathCategoryItem[]>([])

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}
function statusType(s: string) {
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'info'
  return 'warning'
}
function goHome() {
  void router.push('/hs-math')
}
function goSession(id: string) {
  void router.push(`/hs-math/train/session/${encodeURIComponent(id)}`)
}
function goResult(id: string) {
  void router.push(`/hs-math/train/result/${encodeURIComponent(id)}`)
}

function onFilter() {
  page.value = 1
  void load()
}

async function onSpecialtyChange() {
  categoryId.value = undefined
  categories.value = []
  if (specialtyId.value) {
    const sp = specialties.value.find((s) => s.id === specialtyId.value)
    if (sp) {
      try {
        const detail = await getHsMathSpecialty(sp.code)
        categories.value = detail.categories
      } catch {
        categories.value = []
      }
    }
  }
  onFilter()
}

function onPage(p: number) {
  page.value = p
  void load()
}

async function load() {
  loading.value = true
  try {
    const res = await listHsMathTrainSessions({
      page: page.value,
      pageSize,
      status: status.value,
      specialtyId: specialtyId.value,
      categoryId: categoryId.value,
      dateFrom: dateRange.value?.[0],
      dateTo: dateRange.value?.[1],
      sortBy: 'startedAt',
      sortOrder: 'DESC',
    })
    rows.value = res.items
    total.value = res.total
  } catch (e) {
    rows.value = []
    total.value = 0
    ElMessage.error(errMsg(e, '加载历史失败'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    specialties.value = await listHsMathSpecialties()
  } catch {
    specialties.value = []
  }
  void load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
