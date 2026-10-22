<template>
  <div class="page-fill train-history" v-loading="loading">
    <div class="toolbar">
      <div>
        <h1>训练历史</h1>
        <p class="sub">仅显示当前账号的训练记录 · 旧记录默认归入专项训练</p>
      </div>
      <el-button @click="goHome">返回化学首页</el-button>
    </div>

    <el-alert
      v-if="canUseTestPool"
      type="info"
      :closable="false"
      show-icon
      title="你有个人试运行权限。默认列表仅显示正式训练；可切换查看个人试运行记录。"
      style="margin-bottom: 12px"
    />

    <div class="filters">
      <div class="filter">
        <span class="filter-label">训练类型</span>
        <el-radio-group v-model="kindFilter" @change="reload">
          <el-radio-button value="specialty">专项训练</el-radio-button>
          <el-radio-button value="advanced">提高与挑战</el-radio-button>
          <el-radio-button value="daily">每日10分钟</el-radio-button>
          <el-radio-button value="wrong_review">错题复练</el-radio-button>
          <el-radio-button value="wrong_variation">变式训练</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
      </div>
      <div v-if="canUseTestPool" class="filter">
        <span class="filter-label">题库</span>
        <el-radio-group v-model="poolFilter" @change="reload">
          <el-radio-button value="formal">正式</el-radio-button>
          <el-radio-button value="test">个人试运行</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-empty v-if="!loading && !rows.length" description="暂无训练记录" />

    <el-table v-else :data="rows" stripe style="width: 100%">
      <el-table-column prop="startedAt" label="时间" min-width="160">
        <template #default="{ row }">
          {{ formatTime(row.startedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="kindTagType(row.sessionKind)">
            {{ kindText(row.sessionKind) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="专项" min-width="140">
        <template #default="{ row }">
          {{ row.specialtyName }} / {{ row.categoryName }}
        </template>
      </el-table-column>
      <el-table-column prop="difficultyLabel" label="难度" width="100" />
      <el-table-column label="题量" width="80">
        <template #default="{ row }">{{ row.actualCount }}</template>
      </el-table-column>
      <el-table-column label="正确率" width="100">
        <template #default="{ row }">
          {{ row.accuracyPercent == null ? '—' : row.accuracyPercent + '%' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'in_progress'"
            link
            type="primary"
            @click="goSession(row.id)"
          >
            继续答题
          </el-button>
          <el-button
            v-else
            link
            type="primary"
            @click="goResult(row.id)"
          >
            查看结果
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
  getChemTrainTestAccess,
  listChemTrainSessions,
  type TrainSessionKind,
  type TrainSessionSummary,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const rows = ref<TrainSessionSummary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const poolFilter = ref<'formal' | 'test' | 'all'>('formal')
const kindFilter = ref<TrainSessionKind | 'all'>('specialty')
const canUseTestPool = ref(false)

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

function statusText(s: string) {
  if (s === 'completed') return '已完成'
  if (s === 'cancelled') return '已取消'
  return '进行中'
}

function statusType(s: string) {
  if (s === 'completed') return 'success'
  if (s === 'cancelled') return 'info'
  return 'warning'
}

function kindText(k?: string) {
  if (k === 'daily') return '每日10分钟'
  if (k === 'advanced') return '提高与挑战'
  if (k === 'wrong_review') return '错题复练'
  if (k === 'wrong_variation') return '变式训练'
  return '专项训练'
}

function kindTagType(k?: string) {
  if (k === 'daily') return 'primary'
  if (k === 'advanced') return 'warning'
  if (k === 'wrong_review' || k === 'wrong_variation') return 'danger'
  return 'info'
}

function goHome() {
  void router.push('/chemistry')
}

function goSession(id: string) {
  void router.push(`/chemistry/train/session/${id}`)
}

function goResult(id: string) {
  void router.push(`/chemistry/train/result/${id}`)
}

async function load() {
  loading.value = true
  try {
    const data = await listChemTrainSessions({
      page: page.value,
      pageSize,
      poolFilter: poolFilter.value,
      kindFilter: kindFilter.value,
    })
    rows.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载历史失败'))
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
  void load()
}

onMounted(async () => {
  try {
    const a = await getChemTrainTestAccess()
    canUseTestPool.value = a.canUseTestPool
  } catch {
    canUseTestPool.value = false
  }
  await load()
})
</script>

<style scoped>
.train-history {
  padding: 16px 20px 40px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar h1 {
  margin: 0;
  font-size: 1.2rem;
}
.sub {
  margin: 4px 0 0;
  color: #909399;
  font-size: 13px;
}
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 13px;
  color: #606266;
  min-width: 56px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 640px) {
  .train-history {
    padding: 12px;
  }
}
</style>
