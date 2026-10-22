<template>
  <div class="page-fill" v-loading="loading">
    <div class="head">
      <h1>今日待复习（错题）</h1>
      <el-button text type="primary" @click="$router.push('/knowledge-cards')">
        公式定理库
      </el-button>
    </div>
    <div class="table-wrap">
      <el-table v-if="rows.length" :data="rows" stripe height="100%">
        <el-table-column prop="subjectName" label="科目" width="100" sortable>
          <template #default="{ row }">{{ row.subjectName || '—' }}</template>
        </el-table-column>
        <el-table-column label="分类" min-width="120">
          <template #default="{ row }">{{ row.categoryName || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="状态"
          width="110"
          sortable
          :sort-method="errorStatusSort"
        >
          <template #default="{ row }">
            <el-tag :type="errorStatusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nextReviewAt" label="计划复习" width="180" sortable />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/errors/${row.id}`)">
              去再练
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="今天没有待复习错题" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ErrorQuestionListItem } from '@/api/errors'
import { fetchTodayReviews } from '@/api/reviews'
import { statusLabel } from '@/utils/status-label'
import { errorStatusSort, errorStatusTagType } from '@/utils/table-ui'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const rows = ref<ErrorQuestionListItem[]>([])

onMounted(async () => {
  loading.value = true
  try {
    rows.value = await fetchTodayReviews()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
h1 {
  margin: 0;
  font-size: 20px;
}
</style>
