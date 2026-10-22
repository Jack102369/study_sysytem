<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>考试类型</h1>
      <div>
        <el-switch v-model="includeArchived" active-text="显示归档" @change="load" />
        <el-button type="primary" @click="openCreate">新增</el-button>
      </div>
    </div>

    <el-table v-if="rows.length" :data="rows" stripe>
      <el-table-column prop="name" label="名称" sortable />
      <el-table-column prop="sortOrder" label="排序" width="100" sortable />
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
    <el-empty v-else-if="!loading" description="暂无考试类型" />

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑考试类型' : '新增考试类型'"
      width="420px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="32" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAssessmentType,
  listAssessmentTypes,
  updateAssessmentType,
  type AssessmentType,
} from '@/api/assessmentTypes'

const loading = ref(false)
const saving = ref(false)
const includeArchived = ref(false)
const rows = ref<AssessmentType[]>([])
const dialogVisible = ref(false)
const editing = ref<AssessmentType | null>(null)
const form = reactive({ name: '', sortOrder: 0, isArchived: false })

function errMsg(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  )
}

async function load() {
  loading.value = true
  try {
    rows.value = await listAssessmentTypes(includeArchived.value)
  } catch (error) {
    ElMessage.error(errMsg(error, '加载考试类型失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.sortOrder = 0
  form.isArchived = false
  dialogVisible.value = true
}

function openEdit(row: AssessmentType) {
  editing.value = row
  form.name = row.name
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
    if (editing.value) {
      await updateAssessmentType(editing.value.id, {
        name: form.name.trim(),
        sortOrder: form.sortOrder,
        isArchived: form.isArchived,
      })
    } else {
      await createAssessmentType({
        name: form.name.trim(),
        sortOrder: form.sortOrder,
      })
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

async function toggleArchive(row: AssessmentType) {
  try {
    await updateAssessmentType(row.id, { isArchived: !row.isArchived })
    ElMessage.success('已更新')
    await load()
  } catch (error) {
    ElMessage.error(errMsg(error, '更新失败'))
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.toolbar > div {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
