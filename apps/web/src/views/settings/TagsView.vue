<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>标签管理</h1>
      <el-button type="primary" @click="openCreate">新增</el-button>
    </div>

    <el-table v-if="rows.length" :data="rows" stripe>
      <el-table-column prop="name" label="名称" sortable />
      <el-table-column label="预览" width="140">
        <template #default="{ row }">
          <NamedColorTag :label="row.name" :color="row.color" />
        </template>
      </el-table-column>
      <el-table-column label="颜色" width="140">
        <template #default="{ row }">
          <span v-if="row.color" class="color" :style="{ background: row.color }" />
          <span>{{ row.color || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else-if="!loading" description="暂无标签" />

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑标签' : '新增标签'" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="32" />
        </el-form-item>
        <el-form-item label="颜色">
          <div class="color-row">
            <el-color-picker v-model="form.color" />
            <el-input v-model="form.color" maxlength="16" placeholder="#409EFF" style="flex: 1" />
            <NamedColorTag v-if="form.name" :label="form.name" :color="form.color" />
          </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { createTag, deleteTag, listTags, updateTag, type Tag } from '@/api/tags'

const loading = ref(false)
const saving = ref(false)
const rows = ref<Tag[]>([])
const dialogVisible = ref(false)
const editing = ref<Tag | null>(null)
const form = reactive({ name: '', color: '' })

function errMsg(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    fallback
  )
}

async function load() {
  loading.value = true
  try {
    rows.value = await listTags()
  } catch (error) {
    ElMessage.error(errMsg(error, '加载标签失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.color = ''
  dialogVisible.value = true
}

function openEdit(row: Tag) {
  editing.value = row
  form.name = row.name
  form.color = row.color || ''
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  saving.value = true
  try {
    const color = (form.color || '').trim() || null
    if (editing.value) {
      await updateTag(editing.value.id, { name: form.name.trim(), color })
    } else {
      await createTag({ name: form.name.trim(), color })
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

async function onDelete(row: Tag) {
  try {
    await ElMessageBox.confirm(`确定删除标签「${row.name}」？`, '提示', { type: 'warning' })
    await deleteTag(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error(errMsg(error, '删除失败'))
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
}
.color {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  margin-right: 6px;
  vertical-align: middle;
  border: 1px solid #dcdfe6;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
</style>
