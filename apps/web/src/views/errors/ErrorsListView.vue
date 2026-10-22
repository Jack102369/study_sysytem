<template>
  <div class="page-fill" v-loading="loading">
    <div class="toolbar">
      <h1>错题列表</h1>
      <el-button type="primary" @click="$router.push('/errors/new')">新增错题</el-button>
    </div>

    <el-form :inline="true" class="filters">
      <el-form-item label="科目">
        <el-select v-model="query.subjectId" clearable style="width: 140px" @change="reload">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable style="width: 130px" @change="reload">
          <el-option
            v-for="o in ERROR_STATUS_OPTIONS"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="query.tagId" clearable style="width: 140px" @change="reload">
          <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" clearable style="width: 160px" @keyup.enter="reload" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="reload">查询</el-button>
      </el-form-item>
    </el-form>

    <div class="table-wrap">
      <el-table
        v-if="rows.length"
        :key="listAnimKey"
        class="errors-stagger-table"
        :data="rows"
        stripe
        height="100%"
      >
        <el-table-column prop="subjectName" label="科目" width="100" sortable>
          <template #default="{ row }">{{ row.subjectName || '—' }}</template>
        </el-table-column>
        <el-table-column label="分类" min-width="120">
          <template #default="{ row }">{{ row.categoryName || '—' }}</template>
        </el-table-column>
        <el-table-column prop="occurredAt" label="日期" width="120" sortable />
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
        <el-table-column label="标签" min-width="140" sortable :sort-method="tagNamesSort">
          <template #default="{ row }">
            <NamedColorTag
              v-for="t in row.tags"
              :key="t.id"
              class="tag"
              :label="t.name"
              :color="t.color"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/errors/${row.id}`)">详情</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无错题" />
    </div>

    <div class="pager" v-if="total > 0">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="total"
        :page-size="query.pageSize"
        :current-page="query.page"
        @current-change="onPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteErrorQuestion, listErrorQuestions, type ErrorQuestionListItem } from '@/api/errors'
import { listSubjects, type Subject } from '@/api/subjects'
import { listTags, type Tag } from '@/api/tags'
import { ERROR_STATUS_OPTIONS, statusLabel } from '@/utils/status-label'
import { errorStatusSort, errorStatusTagType, tagNamesSort } from '@/utils/table-ui'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const loading = ref(false)
const rows = ref<ErrorQuestionListItem[]>([])
const total = ref(0)
const listAnimKey = ref(0)
const subjects = ref<Subject[]>([])
const tags = ref<Tag[]>([])
const query = reactive({
  subjectId: '',
  status: '',
  tagId: '',
  keyword: '',
  page: 1,
  pageSize: 20,
})

async function reload() {
  loading.value = true
  try {
    const data = await listErrorQuestions({
      subjectId: query.subjectId || undefined,
      status: query.status || undefined,
      tagId: query.tagId || undefined,
      keyword: query.keyword || undefined,
      page: query.page,
      pageSize: query.pageSize,
    })
    rows.value = data.items
    total.value = data.total
    listAnimKey.value += 1
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  query.page = p
  reload()
}

async function onDelete(row: ErrorQuestionListItem) {
  try {
    await ElMessageBox.confirm('确定删除该错题？', '提示', { type: 'warning' })
    await deleteErrorQuestion(row.id)
    ElMessage.success('已删除')
    await reload()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error(errMsg(e, '删除失败'))
  }
}

onMounted(async () => {
  const sid = String(route.query.subjectId || '')
  if (sid) query.subjectId = sid
  subjects.value = await listSubjects(true).catch(() => [])
  tags.value = await listTags().catch(() => [])
  await reload()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.filters {
  margin: 12px 0;
  flex-shrink: 0;
}
.tag {
  margin-right: 4px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.errors-stagger-table :deep(.el-table__body tr) {
  animation: errors-row-in 0.34s ease both;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(1)) {
  animation-delay: 0.02s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(2)) {
  animation-delay: 0.05s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(3)) {
  animation-delay: 0.08s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(4)) {
  animation-delay: 0.11s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(5)) {
  animation-delay: 0.14s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(6)) {
  animation-delay: 0.17s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(7)) {
  animation-delay: 0.2s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(8)) {
  animation-delay: 0.23s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(9)) {
  animation-delay: 0.26s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(10)) {
  animation-delay: 0.29s;
}
.errors-stagger-table :deep(.el-table__body tr:nth-child(n + 11)) {
  animation-delay: 0.32s;
}

@keyframes errors-row-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .errors-stagger-table :deep(.el-table__body tr) {
    animation: none !important;
  }
}
</style>
