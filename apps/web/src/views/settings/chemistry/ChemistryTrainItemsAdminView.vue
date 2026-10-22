<template>
  <div class="page-fill items-admin" v-loading="loading">
    <div class="toolbar">
      <div>
        <h1>化学训练题库</h1>
        <p class="sub">
          查看质量审查结论与 AI 试运行准入。PASS ≠ 人工审核；正式训练仍关闭。
        </p>
      </div>
      <div class="actions">
        <el-button @click="$router.push('/settings/chemistry-generator')">
          本地出题器
        </el-button>
        <el-button @click="reload">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="stats"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      :title="`总计 ${stats.total} · 可试运行 ${stats.trial_allow} · 禁止/停用 ${stats.trial_block} · PASS ${stats.qa_pass} · FIX ${stats.qa_fix} · VERIFY ${stats.qa_verify} · kb_pending ${stats.class_kb_pending}`"
    />

    <el-card shadow="never" class="mb">
      <el-form :inline="true" class="filters">
        <el-form-item label="质量结论">
          <el-select v-model="filters.qa" clearable style="width: 160px" @change="reload">
            <el-option label="PASS" value="PASS" />
            <el-option label="NEEDS_FIX" value="NEEDS_FIX" />
            <el-option label="NEEDS_VERIFICATION" value="NEEDS_VERIFICATION" />
          </el-select>
        </el-form-item>
        <el-form-item label="试运行">
          <el-select
            v-model="filters.trialFilter"
            clearable
            style="width: 160px"
            @change="reload"
          >
            <el-option label="可试运行" value="allow" />
            <el-option label="禁止试运行" value="block" />
            <el-option label="待人工审核(知识)" value="pending_human" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filters.q"
            clearable
            placeholder="编码/题干"
            style="width: 200px"
            @keyup.enter="reload"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="reload">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="rows" stripe height="520" empty-text="无数据">
      <el-table-column prop="code" label="编码" width="220" show-overflow-tooltip />
      <el-table-column prop="qtype" label="题型" width="70" />
      <el-table-column prop="difficulty" label="难度" width="60" />
      <el-table-column label="专项/分类" width="160">
        <template #default="{ row }">
          {{ row.specialtyCode }}.{{ row.categoryCode }}
        </template>
      </el-table-column>
      <el-table-column prop="stem" label="题干" min-width="220" show-overflow-tooltip />
      <el-table-column label="来源知识" width="140" show-overflow-tooltip>
        <template #default="{ row }">
          {{
            row.sources?.map((s: any) => s.kbCode || `${s.entityType}:${s.entityId}`).join(', ') ||
            '—'
          }}
        </template>
      </el-table-column>
      <el-table-column label="知识状态" width="110">
        <template #default="{ row }">
          <span v-if="row.sources?.[0]?.humanUnreviewed">AI试运行知识</span>
          <span v-else>{{ row.sources?.[0]?.kbStatus || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="qaConclusion" label="质量结论" width="130" />
      <el-table-column label="试运行" width="90">
        <template #default="{ row }">
          <el-tag :type="row.trialAllowed ? 'success' : 'info'" size="small">
            {{ row.trialAllowed ? '允许' : '禁止' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="正式" width="80">
        <template #default>否</template>
      </el-table-column>
      <el-table-column prop="limitReason" label="限制原因" min-width="160" show-overflow-tooltip />
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listAdminTrainItems,
  type TrainItemAdminRow,
} from '@/api/chemistry-train-items-admin'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const rows = ref<TrainItemAdminRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const stats = ref<Record<string, number> | null>(null)
const filters = reactive({
  qa: '' as string,
  trialFilter: '' as string,
  q: '',
})

async function reload() {
  loading.value = true
  try {
    const data = await listAdminTrainItems({
      qa: filters.qa || undefined,
      trialFilter: filters.trialFilter || undefined,
      q: filters.q || undefined,
      page: page.value,
      pageSize,
    })
    rows.value = data.items
    total.value = data.total
    stats.value = data.stats as Record<string, number>
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  page.value = p
  reload()
}

onMounted(reload)
</script>

<style scoped>
.items-admin {
  padding: 16px 20px 32px;
  overflow: auto;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
h1 {
  margin: 0;
  font-size: 20px;
}
.sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.mb {
  margin-bottom: 12px;
}
.actions {
  display: flex;
  gap: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
