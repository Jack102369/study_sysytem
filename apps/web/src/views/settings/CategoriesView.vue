<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>错因分类</h1>
      <div>
        <el-select
          v-model="subjectId"
          clearable
          placeholder="筛选科目"
          style="width: 180px"
          @change="load"
        >
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-switch v-model="includeArchived" active-text="显示归档" @change="load" />
        <el-button type="primary" @click="openCreate">新增</el-button>
      </div>
    </div>

    <el-table
      v-if="treeRows.length"
      :data="treeRows"
      stripe
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children' }"
    >
      <el-table-column prop="name" label="名称（树状）" />
      <el-table-column label="科目" width="140" sortable :sort-method="sortBySubject">
        <template #default="{ row }">{{ subjectName(row.subjectId) }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="90" />
      <el-table-column prop="isArchived" label="归档" width="110" sortable>
        <template #default="{ row }">
          <el-tag :type="row.isArchived ? 'info' : 'success'" size="small">
            {{ row.isArchived ? '已归档' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            link
            :type="row.isArchived ? 'success' : 'warning'"
            @click="toggleArchive(row)"
          >
            {{ row.isArchived ? '取消归档' : '归档' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else-if="!loading" description="暂无分类" />

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑分类' : '新增分类'" width="480px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="64" />
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="form.subjectId" clearable placeholder="可选" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="form.parentId" clearable placeholder="可选" style="width: 100%">
            <el-option
              v-for="c in parentOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item v-if="editing" label="归档">
          <el-switch v-model="form.isArchived" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createErrorCategory,
  listErrorCategories,
  updateErrorCategory,
  type ErrorCategory,
} from '@/api/categories'
import { listSubjects, type Subject } from '@/api/subjects'
import { zhTextSort } from '@/utils/table-ui'

const loading = ref(false)
const saving = ref(false)
const includeArchived = ref(false)
const subjectId = ref<string | undefined>()
const subjects = ref<Subject[]>([])
const rows = ref<ErrorCategory[]>([])
const allForParent = ref<ErrorCategory[]>([])
const dialogVisible = ref(false)
const editing = ref<ErrorCategory | null>(null)
const form = reactive({
  name: '',
  subjectId: '' as string | undefined,
  parentId: '' as string | undefined,
  sortOrder: 0,
  isArchived: false,
})

const parentOptions = computed(() =>
  allForParent.value.filter((c) => !editing.value || c.id !== editing.value.id),
)

type CatNode = ErrorCategory & { children?: CatNode[] }

const treeRows = computed(() => {
  const map = new Map<string, CatNode>()
  rows.value.forEach((r) => map.set(r.id, { ...r, children: [] }))
  const roots: CatNode[] = []
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  const prune = (list: CatNode[]) => {
    list.forEach((n) => {
      if (n.children && n.children.length === 0) delete n.children
      else if (n.children) prune(n.children)
    })
  }
  prune(roots)
  return roots
})

function errMsg(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  )
}

function sortBySubject(a: ErrorCategory, b: ErrorCategory) {
  return zhTextSort(subjectName(a.subjectId), subjectName(b.subjectId))
}

function subjectName(id: string | null) {
  if (!id) return '-'
  return subjects.value.find((s) => s.id === id)?.name || id
}

async function load() {
  loading.value = true
  try {
    rows.value = await listErrorCategories({
      subjectId: subjectId.value,
      includeArchived: includeArchived.value,
    })
    allForParent.value = await listErrorCategories({ includeArchived: true })
  } catch (error) {
    ElMessage.error(errMsg(error, '加载分类失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.subjectId = subjectId.value
  form.parentId = undefined
  form.sortOrder = 0
  form.isArchived = false
  dialogVisible.value = true
}

function openEdit(row: ErrorCategory) {
  editing.value = row
  form.name = row.name
  form.subjectId = row.subjectId || undefined
  form.parentId = row.parentId || undefined
  form.sortOrder = row.sortOrder
  form.isArchived = row.isArchived
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      subjectId: form.subjectId || null,
      parentId: form.parentId || null,
      sortOrder: form.sortOrder,
    }
    if (editing.value) {
      await updateErrorCategory(editing.value.id, {
        ...payload,
        isArchived: form.isArchived,
      })
    } else {
      await createErrorCategory(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(errMsg(error, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function toggleArchive(row: ErrorCategory) {
  try {
    await updateErrorCategory(row.id, { isArchived: !row.isArchived })
    ElMessage.success('已更新')
    await load()
  } catch (error) {
    ElMessage.error(errMsg(error, '更新失败'))
  }
}

onMounted(async () => {
  try {
    subjects.value = await listSubjects(true)
  } catch (error) {
    ElMessage.error(errMsg(error, '加载科目失败'))
  }
  await load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar > div {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
