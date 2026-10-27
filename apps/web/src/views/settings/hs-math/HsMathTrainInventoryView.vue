<template>
  <div class="inv-page" v-loading="loading">
    <header class="head">
      <div>
        <h1>高一数学 · 题库库存统计</h1>
        <p class="sub">
          按章节 / 题型 / 难度查看正式题库存结构。默认口径为可抽取正式题（formal +
          approved + 启用）。仅 ADMIN。
        </p>
      </div>
      <div class="acts">
        <el-radio-group v-model="scope" size="default" @change="reload">
          <el-radio-button value="drawable">可抽取正式题</el-radio-button>
          <el-radio-button value="all_formal">全部 formal</el-radio-button>
        </el-radio-group>
        <el-button @click="reload">刷新</el-button>
        <el-button @click="$router.push({ name: 'settings-hs-math-train-items' })">
          题库管理
        </el-button>
      </div>
    </header>

    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
      class="mb"
    />

    <template v-else-if="stats">
      <el-alert type="info" :title="stats.note" show-icon :closable="false" class="mb" />

      <div class="kpi">
        <div class="kpi-card">
          <div class="kpi-label">题目总数</div>
          <div class="kpi-value">{{ stats.total }}</div>
        </div>
        <div class="kpi-card" v-for="d in difficultyKpis" :key="d.difficulty">
          <div class="kpi-label">{{ d.label }}</div>
          <div class="kpi-value">{{ d.n }}</div>
          <div class="kpi-sub">{{ d.percent }}%</div>
        </div>
      </div>

      <div class="grid">
        <section class="panel">
          <h2>按难度</h2>
          <el-table :data="stats.byDifficulty" stripe size="small" empty-text="暂无数据">
            <el-table-column label="难度" min-width="100">
              <template #default="{ row }">{{ difficultyLabel(row.difficulty) }}</template>
            </el-table-column>
            <el-table-column prop="n" label="数量" width="90" />
            <el-table-column label="占比" width="90">
              <template #default="{ row }">{{ row.percent }}%</template>
            </el-table-column>
          </el-table>
        </section>

        <section class="panel">
          <h2>按题型</h2>
          <el-table :data="stats.byQtype" stripe size="small" empty-text="暂无数据">
            <el-table-column label="题型" min-width="100">
              <template #default="{ row }">{{ qtypeLabel(row.qtype) }}</template>
            </el-table-column>
            <el-table-column prop="n" label="数量" width="90" />
            <el-table-column label="占比" width="90">
              <template #default="{ row }">{{ row.percent }}%</template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <section class="panel">
        <h2>按章节（专项）</h2>
        <el-table
          :data="specialtyRows"
          stripe
          size="small"
          empty-text="暂无数据"
          :default-sort="{ prop: 'specialtyCode', order: 'ascending' }"
        >
          <el-table-column prop="specialtyCode" label="编码" width="120" sortable />
          <el-table-column prop="specialtyName" label="章节" min-width="180" />
          <el-table-column prop="n" label="合计" width="80" sortable />
          <el-table-column label="占比" width="80">
            <template #default="{ row }">{{ row.percent }}%</template>
          </el-table-column>
          <el-table-column label="基础(1)" width="90">
            <template #default="{ row }">{{ row.d1 }}</template>
          </el-table-column>
          <el-table-column label="提高(2)" width="90">
            <template #default="{ row }">{{ row.d2 }}</template>
          </el-table-column>
          <el-table-column label="压轴(3)" width="90">
            <template #default="{ row }">{{ row.d3 }}</template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <h2>难度 × 题型</h2>
        <el-table :data="crossRows" stripe size="small" empty-text="暂无数据">
          <el-table-column prop="qtypeLabel" label="题型" min-width="100" />
          <el-table-column label="基础(1)" width="100">
            <template #default="{ row }">{{ row.d1 }}</template>
          </el-table-column>
          <el-table-column label="提高(2)" width="100">
            <template #default="{ row }">{{ row.d2 }}</template>
          </el-table-column>
          <el-table-column label="压轴(3)" width="100">
            <template #default="{ row }">{{ row.d3 }}</template>
          </el-table-column>
          <el-table-column prop="total" label="合计" width="90" />
        </el-table>
      </section>

      <section class="panel">
        <h2>按小节</h2>
        <el-table
          :data="stats.bySection"
          stripe
          size="small"
          empty-text="暂无数据"
          max-height="420"
        >
          <el-table-column prop="specialtyName" label="章节" min-width="140" />
          <el-table-column prop="sectionCode" label="小节编码" width="140" />
          <el-table-column prop="sectionName" label="小节" min-width="160" />
          <el-table-column prop="n" label="数量" width="80" sortable />
          <el-table-column label="占比" width="80">
            <template #default="{ row }">{{ row.percent }}%</template>
          </el-table-column>
        </el-table>
      </section>
    </template>

    <el-empty v-else-if="!loading && !error" description="暂无统计数据" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getAdminHsMathInventoryStats,
  type HsMathInventoryScope,
  type HsMathInventoryStats,
} from '@/api/hs-math-admin'
import errMsg from '@/utils/err-msg'
import { difficultyLabel, qtypeLabel } from '@/utils/hs-math-format'

const loading = ref(false)
const error = ref('')
const scope = ref<HsMathInventoryScope>('drawable')
const stats = ref<HsMathInventoryStats | null>(null)

const difficultyKpis = computed(() => {
  const rows = stats.value?.byDifficulty ?? []
  return [1, 2, 3].map((difficulty) => {
    const hit = rows.find((r) => r.difficulty === difficulty)
    return {
      difficulty,
      label: difficultyLabel(difficulty),
      n: hit?.n ?? 0,
      percent: hit?.percent ?? 0,
    }
  })
})

const specialtyRows = computed(() => {
  const s = stats.value
  if (!s) return []
  return s.bySpecialty.map((row) => {
    const dmap = s.specialtyByDifficulty.filter(
      (x) => x.specialtyCode === row.specialtyCode,
    )
    const pick = (d: number) => dmap.find((x) => x.difficulty === d)?.n ?? 0
    return {
      ...row,
      d1: pick(1),
      d2: pick(2),
      d3: pick(3),
    }
  })
})

const crossRows = computed(() => {
  const s = stats.value
  if (!s) return []
  const qtypes = [...new Set(s.crossDifficultyQtype.map((x) => x.qtype))].sort()
  return qtypes.map((qtype) => {
    const pick = (d: number) =>
      s.crossDifficultyQtype.find((x) => x.qtype === qtype && x.difficulty === d)?.n ??
      0
    const d1 = pick(1)
    const d2 = pick(2)
    const d3 = pick(3)
    return {
      qtype,
      qtypeLabel: qtypeLabel(qtype),
      d1,
      d2,
      d3,
      total: d1 + d2 + d3,
    }
  })
})

async function reload() {
  loading.value = true
  error.value = ''
  try {
    stats.value = await getAdminHsMathInventoryStats(scope.value)
  } catch (e) {
    stats.value = null
    error.value = errMsg(e, '加载库存统计失败')
  } finally {
    loading.value = false
  }
}

onMounted(reload)
</script>

<style scoped>
.inv-page {
  padding: 8px 4px 24px;
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.head h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 600;
}
.sub {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  max-width: 640px;
  line-height: 1.5;
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.mb {
  margin-bottom: 14px;
}
.kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.kpi-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 16px;
}
.kpi-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.kpi-value {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 650;
  line-height: 1.2;
}
.kpi-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px 14px 16px;
  margin-bottom: 14px;
}
.panel h2 {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
}
@media (max-width: 900px) {
  .kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
