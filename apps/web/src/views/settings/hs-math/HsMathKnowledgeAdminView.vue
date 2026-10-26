<template>
  <div class="page admin-kp" v-loading="loading">
    <header class="head">
      <div>
        <h1>高一数学 · 知识点</h1>
        <p class="sub">新增/编辑/启停与排序；无物理删除。仅 ADMIN。</p>
      </div>
      <div class="acts">
        <el-button type="primary" @click="openCreate">新增知识点</el-button>
        <el-button @click="reload">刷新</el-button>
      </div>
    </header>

    <el-form :inline="true" class="filters">
      <el-form-item label="章节">
        <el-select
          v-model="filters.specialtyId"
          clearable
          filterable
          style="width: 200px"
          @change="onSpecialtyFilter"
        >
          <el-option
            v-for="s in specialties"
            :key="s.id"
            :label="s.name"
            :value="s.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="小节">
        <el-select
          v-model="filters.categoryId"
          clearable
          filterable
          style="width: 180px"
          @change="onFilter"
        >
          <el-option
            v-for="c in filterCategories"
            :key="c.id"
            :label="`${c.code} ${c.name}`"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="filters.isActive"
          clearable
          style="width: 110px"
          @change="onFilter"
        >
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input
          v-model="filters.q"
          clearable
          placeholder="code/名称"
          style="width: 160px"
          @keyup.enter="onFilter"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onFilter">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" stripe empty-text="无知识点">
      <el-table-column prop="code" label="code" width="140" show-overflow-tooltip />
      <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="章节" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ specialtyName(row.specialtyId) }}</template>
      </el-table-column>
      <el-table-column label="小节" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ categoryLabel(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="70" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
            {{ row.isActive ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            link
            :type="row.isActive ? 'warning' : 'success'"
            @click="toggleActive(row)"
          >
            {{ row.isActive ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, sizes"
        :page-sizes="[10, 20, 50]"
        @current-change="reload"
        @size-change="onPageSize"
      />
    </div>

    <el-dialog
      v-model="dialog"
      :title="form.id ? '编辑知识点' : '新增知识点'"
      width="560px"
      destroy-on-close
      @closed="onDialogClosed"
    >
      <el-form label-position="top">
        <el-form-item label="code" required>
          <el-input v-model="form.code" :disabled="!!form.id" placeholder="如 rja.1.1.01" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="章节" required>
          <el-select
            v-model="form.specialtyId"
            filterable
            style="width: 100%"
            @change="onFormSpecialty"
          >
            <el-option
              v-for="s in specialties"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="小节" required>
          <el-select v-model="form.categoryId" filterable style="width: 100%">
            <el-option
              v-for="c in formCategories"
              :key="c.id"
              :label="`${c.code} ${c.name}`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="父知识点（可选）">
          <el-select
            v-model="form.parentId"
            clearable
            filterable
            style="width: 100%"
            placeholder="平级可留空"
          >
            <el-option
              v-for="p in parentOptions"
              :key="p.id"
              :label="`${p.code} ${p.name}`"
              :value="p.id"
              :disabled="p.id === form.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明（可含 $LaTeX$）">
          <el-input v-model="form.summary" type="textarea" :rows="4" maxlength="512" show-word-limit />
        </el-form-item>
        <el-form-item v-if="form.summary" label="公式预览">
          <div class="preview" v-html="previewHtml" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :step="10" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAdminHsMathKnowledgePoint,
  listAdminHsMathCategories,
  listAdminHsMathKnowledgePoints,
  listAdminHsMathSpecialties,
  updateAdminHsMathKnowledgePoint,
  type HsMathAdminCategory,
  type HsMathAdminKnowledgePoint,
  type HsMathAdminSpecialty,
} from '@/api/hs-math-admin'
import errMsg from '@/utils/err-msg'
import { renderMathHtml } from '@/utils/render-math'

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const specialties = ref<HsMathAdminSpecialty[]>([])
const allCategories = ref<HsMathAdminCategory[]>([])
const rows = ref<HsMathAdminKnowledgePoint[]>([])
const parentPool = ref<HsMathAdminKnowledgePoint[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = reactive<{
  specialtyId?: string
  categoryId?: string
  isActive?: boolean
  q: string
}>({
  specialtyId: undefined,
  categoryId: undefined,
  isActive: undefined,
  q: '',
})

const form = reactive({
  id: '' as string,
  code: '',
  name: '',
  specialtyId: '',
  categoryId: '',
  parentId: '' as string | null | undefined,
  summary: '',
  sortOrder: 10,
  isActive: true,
})

const filterCategories = computed(() => {
  if (!filters.specialtyId) return allCategories.value
  return allCategories.value.filter((c) => c.specialtyId === filters.specialtyId)
})

const formCategories = computed(() =>
  allCategories.value.filter((c) => c.specialtyId === form.specialtyId),
)

const parentOptions = computed(() =>
  parentPool.value.filter(
    (r) =>
      r.specialtyId === form.specialtyId &&
      (form.id ? r.id !== form.id : true),
  ),
)

const previewHtml = computed(() => renderMathHtml(form.summary || ''))

function specialtyName(id: string) {
  return specialties.value.find((s) => s.id === id)?.name || id
}
function categoryLabel(id: string) {
  const c = allCategories.value.find((x) => x.id === id)
  return c ? `${c.code} ${c.name}` : id
}

function onSpecialtyFilter() {
  filters.categoryId = undefined
  page.value = 1
  void reload()
}
function onFilter() {
  page.value = 1
  void reload()
}
function onPageSize() {
  page.value = 1
  void reload()
}

async function loadMeta() {
  const [sp, cats] = await Promise.all([
    listAdminHsMathSpecialties(),
    listAdminHsMathCategories({}),
  ])
  specialties.value = sp
  allCategories.value = cats
}

async function reload() {
  loading.value = true
  try {
    const res = await listAdminHsMathKnowledgePoints({
      page: page.value,
      pageSize: pageSize.value,
      specialtyId: filters.specialtyId || undefined,
      categoryId: filters.categoryId || undefined,
      isActive: filters.isActive,
      q: filters.q.trim() || undefined,
      sortBy: 'sortOrder',
      sortDir: 'ASC',
    })
    rows.value = res.items
    total.value = res.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载知识点失败'))
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = ''
  form.code = ''
  form.name = ''
  form.specialtyId = specialties.value[0]?.id || ''
  form.categoryId = ''
  form.parentId = undefined
  form.summary = ''
  form.sortOrder = 10
  form.isActive = true
  onFormSpecialty()
}

async function loadParentPool(specialtyId: string) {
  if (!specialtyId) {
    parentPool.value = []
    return
  }
  try {
    const res = await listAdminHsMathKnowledgePoints({
      specialtyId,
      page: 1,
      pageSize: 100,
      sortBy: 'sortOrder',
      sortDir: 'ASC',
    })
    parentPool.value = res.items
  } catch {
    parentPool.value = []
  }
}

function onFormSpecialty() {
  const cats = formCategories.value
  if (!cats.some((c) => c.id === form.categoryId)) {
    form.categoryId = cats[0]?.id || ''
  }
  form.parentId = undefined
  void loadParentPool(form.specialtyId)
}

function openCreate() {
  resetForm()
  void loadParentPool(form.specialtyId)
  dialog.value = true
}

function openEdit(row: HsMathAdminKnowledgePoint) {
  form.id = row.id
  form.code = row.code
  form.name = row.name
  form.specialtyId = row.specialtyId
  form.categoryId = row.categoryId
  form.parentId = row.parentId || undefined
  form.summary = row.summary || ''
  form.sortOrder = row.sortOrder
  form.isActive = row.isActive
  void loadParentPool(row.specialtyId)
  dialog.value = true
}

function onDialogClosed() {
  // 保留失败时用户可能再次打开；成功后由 openCreate/openEdit 覆盖
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    ElMessage.warning('请填写 code 与名称')
    return
  }
  if (!form.specialtyId || !form.categoryId) {
    ElMessage.warning('请选择章节与小节')
    return
  }
  saving.value = true
  try {
    const body = {
      code: form.code.trim(),
      name: form.name.trim(),
      specialtyId: form.specialtyId,
      categoryId: form.categoryId,
      parentId: form.parentId || null,
      summary: form.summary.trim() || null,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    }
    if (form.id) {
      const { code: _c, ...patch } = body
      await updateAdminHsMathKnowledgePoint(form.id, patch)
    } else {
      await createAdminHsMathKnowledgePoint(body)
    }
    ElMessage.success('已保存')
    dialog.value = false
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: HsMathAdminKnowledgePoint) {
  try {
    await updateAdminHsMathKnowledgePoint(row.id, {
      isActive: !row.isActive,
    })
    ElMessage.success(row.isActive ? '已停用' : '已启用')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '更新状态失败'))
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadMeta()
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '初始化失败'))
  } finally {
    loading.value = false
  }
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
}
.filters {
  margin-bottom: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.preview {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  min-height: 40px;
  line-height: 1.6;
}
</style>
