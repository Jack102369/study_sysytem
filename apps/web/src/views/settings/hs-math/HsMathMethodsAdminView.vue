<template>
  <div class="page admin-methods" v-loading="loading">
    <header class="head">
      <div>
        <h1>高一数学 · 解题方法词典</h1>
        <p class="sub">
          管理方法标签（code 唯一）。禁用后不可新增题目关联；仅 ADMIN。正式种子须另授权。
        </p>
      </div>
      <div class="acts">
        <el-button type="primary" @click="openCreate">新增方法</el-button>
        <el-button @click="reload">刷新</el-button>
      </div>
    </header>

    <el-form :inline="true" class="filters">
      <el-form-item label="搜索">
        <el-input
          v-model="q"
          clearable
          placeholder="code / 名称"
          style="width: 200px"
          @keyup.enter="noop"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="activeFilter" style="width: 120px">
          <el-option label="全部" value="all" />
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-empty
      v-if="!loading && !filtered.length"
      description="方法词典为空。可新增标签；正式种子须另授权。"
    />

    <el-table v-else :data="filtered" stripe empty-text="无匹配方法">
      <el-table-column prop="code" label="code" width="160" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="summary" label="简介" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sortOrder" label="排序" width="72" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            link
            :type="row.isActive ? 'warning' : 'success'"
            @click="toggleActive(row)"
          >
            {{ row.isActive ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialog"
      :title="form.id ? '编辑方法' : '新增方法'"
      width="480px"
      destroy-on-close
      :before-close="onDialogClose"
    >
      <el-form label-position="top">
        <el-form-item label="code" required>
          <el-input
            v-model="form.code"
            :disabled="!!form.id"
            maxlength="64"
            show-word-limit
            placeholder="如 defn / classification"
            @input="dirty = true"
          />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input
            v-model="form.name"
            maxlength="64"
            show-word-limit
            placeholder="如 定义法"
            @input="dirty = true"
          />
        </el-form-item>
        <el-form-item label="简介">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            maxlength="512"
            show-word-limit
            @input="dirty = true"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :step="10" @change="dirty = true" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" @change="dirty = true" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tryClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAdminHsMathMethod,
  listAdminHsMathMethods,
  updateAdminHsMathMethod,
  type HsMathAdminMethod,
} from '@/api/hs-math-admin'
import {
  adminWriteErrorHint,
  isConflictHttpError,
  validateMethodForm,
} from '@/utils/hs-math-admin-meta'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const dirty = ref(false)
const rows = ref<HsMathAdminMethod[]>([])
const q = ref('')
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')

const form = reactive({
  id: '',
  code: '',
  name: '',
  summary: '',
  sortOrder: 10,
  isActive: true,
})

const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (activeFilter.value === 'active' && !r.isActive) return false
    if (activeFilter.value === 'inactive' && r.isActive) return false
    if (!kw) return true
    return (
      r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)
    )
  })
})

function noop() {}

function openCreate() {
  Object.assign(form, {
    id: '',
    code: '',
    name: '',
    summary: '',
    sortOrder: 10,
    isActive: true,
  })
  dirty.value = false
  dialog.value = true
}

function openEdit(row: HsMathAdminMethod) {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    summary: row.summary || '',
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  })
  dirty.value = false
  dialog.value = true
}

async function tryClose() {
  if (dirty.value) {
    try {
      await ElMessageBox.confirm('有未保存修改，确认关闭？', '提示', {
        type: 'warning',
      })
    } catch {
      return
    }
  }
  dialog.value = false
}

function onDialogClose(done: () => void) {
  if (!dirty.value) {
    done()
    return
  }
  ElMessageBox.confirm('有未保存修改，确认关闭？', '提示', { type: 'warning' })
    .then(() => done())
    .catch(() => undefined)
}

async function save() {
  const invalid = validateMethodForm({
    code: form.code,
    name: form.name,
    summary: form.summary,
    isCreate: !form.id,
  })
  if (invalid) {
    ElMessage.warning(invalid)
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await updateAdminHsMathMethod(form.id, {
        name: form.name.trim(),
        summary: form.summary.trim() || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      })
      ElMessage.success('已保存')
    } else {
      await createAdminHsMathMethod({
        code: form.code.trim(),
        name: form.name.trim(),
        summary: form.summary.trim() || null,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      })
      ElMessage.success('已创建')
    }
    dirty.value = false
    dialog.value = false
    await reload()
  } catch (e) {
    if (isConflictHttpError(e)) {
      ElMessage.error(adminWriteErrorHint(e, 'code 冲突'))
    } else {
      ElMessage.error(adminWriteErrorHint(e, errMsg(e, '保存失败')))
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: HsMathAdminMethod) {
  const next = !row.isActive
  if (!next) {
    try {
      await ElMessageBox.confirm(
        `确认禁用方法「${row.code} ${row.name}」？\n禁用后不可新增题目关联；已关联题目仍可识别展示。`,
        '禁用确认',
        { type: 'warning' },
      )
    } catch {
      return
    }
  }
  try {
    await updateAdminHsMathMethod(row.id, { isActive: next })
    ElMessage.success(next ? '已启用' : '已禁用')
    await reload()
  } catch (e) {
    ElMessage.error(adminWriteErrorHint(e, errMsg(e, '更新状态失败')))
  }
}

async function reload() {
  loading.value = true
  try {
    const res = await listAdminHsMathMethods()
    rows.value = res.items || []
  } catch (e) {
    rows.value = []
    ElMessage.error(errMsg(e, '加载方法词典失败'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.head h1 {
  margin: 0 0 4px;
  font-size: 20px;
}
.sub {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  max-width: 640px;
}
.acts {
  display: flex;
  gap: 8px;
}
.filters {
  margin-bottom: 8px;
}
</style>
