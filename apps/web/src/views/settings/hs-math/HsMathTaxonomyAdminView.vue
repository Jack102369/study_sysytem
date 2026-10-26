<template>
  <div class="page admin-tax" v-loading="loading">
    <header class="head">
      <h1>高一数学 · 专项与分类</h1>
      <p class="sub">启用/停用与排序；不删除种子章节含义。仅 ADMIN。</p>
    </header>

    <el-tabs v-model="tab">
      <el-tab-pane label="专项（章节）" name="sp">
        <div class="acts">
          <el-button type="primary" @click="openSpCreate">新增专项</el-button>
          <el-button @click="loadAll">刷新</el-button>
        </div>
        <el-table :data="specialties" stripe>
          <el-table-column prop="code" label="code" width="120" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column prop="bookCode" label="册" width="90" />
          <el-table-column prop="chapterNo" label="章号" width="70" />
          <el-table-column prop="sortOrder" label="排序" width="70" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openSpEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.isActive ? 'warning' : 'success'"
                @click="toggleSp(row)"
              >
                {{ row.isActive ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="分类" name="cat">
        <div class="acts">
          <el-select
            v-model="filterSpecialtyId"
            clearable
            filterable
            placeholder="按专项筛选"
            style="width: 220px"
            @change="loadCategories"
          >
            <el-option
              v-for="s in specialties"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
          <el-button type="primary" @click="openCatCreate">新增分类</el-button>
          <el-button @click="loadCategories">刷新</el-button>
        </div>
        <el-table :data="categories" stripe>
          <el-table-column prop="code" label="code" width="140" />
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column label="所属专项" min-width="140">
            <template #default="{ row }">
              {{ specialtyName(row.specialtyId) }}
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="70" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openCatEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.isActive ? 'warning' : 'success'"
                @click="toggleCat(row)"
              >
                {{ row.isActive ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="spDialog"
      :title="spForm.id ? '编辑专项' : '新增专项'"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="code" required>
          <el-input v-model="spForm.code" :disabled="!!spForm.id" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="spForm.name" />
        </el-form-item>
        <el-form-item label="册 (bookCode)">
          <el-input v-model="spForm.bookCode" placeholder="如 必修一" />
        </el-form-item>
        <el-form-item label="章号">
          <el-input-number v-model="spForm.chapterNo" :min="1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="spForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="spForm.intro" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="spDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveSp">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="catDialog"
      :title="catForm.id ? '编辑分类' : '新增分类'"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="所属专项" required>
          <el-select v-model="catForm.specialtyId" filterable style="width: 100%">
            <el-option
              v-for="s in specialties"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="code" required>
          <el-input v-model="catForm.code" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="catForm.name" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="catForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="catDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCat">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAdminHsMathCategory,
  createAdminHsMathSpecialty,
  listAdminHsMathCategories,
  listAdminHsMathSpecialties,
  updateAdminHsMathCategory,
  updateAdminHsMathSpecialty,
  type HsMathAdminCategory,
  type HsMathAdminSpecialty,
} from '@/api/hs-math-admin'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const saving = ref(false)
const tab = ref('sp')
const specialties = ref<HsMathAdminSpecialty[]>([])
const categories = ref<HsMathAdminCategory[]>([])
const filterSpecialtyId = ref<string | undefined>()

const spDialog = ref(false)
const spForm = reactive({
  id: '',
  code: '',
  name: '',
  bookCode: '' as string | null,
  chapterNo: null as number | null,
  sortOrder: 0,
  intro: '',
})

const catDialog = ref(false)
const catForm = reactive({
  id: '',
  specialtyId: '',
  code: '',
  name: '',
  sortOrder: 0,
})

function specialtyName(id: string) {
  return specialties.value.find((s) => s.id === id)?.name || id
}

function openSpCreate() {
  Object.assign(spForm, {
    id: '',
    code: '',
    name: '',
    bookCode: '必修一',
    chapterNo: 1,
    sortOrder: 0,
    intro: '',
  })
  spDialog.value = true
}

function openSpEdit(row: HsMathAdminSpecialty) {
  Object.assign(spForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    bookCode: row.bookCode,
    chapterNo: row.chapterNo,
    sortOrder: row.sortOrder,
    intro: row.intro || '',
  })
  spDialog.value = true
}

async function saveSp() {
  if (!spForm.code.trim() || !spForm.name.trim()) {
    ElMessage.warning('请填写 code 与名称')
    return
  }
  saving.value = true
  try {
    const body = {
      code: spForm.code.trim(),
      name: spForm.name.trim(),
      bookCode: spForm.bookCode || null,
      chapterNo: spForm.chapterNo,
      sortOrder: spForm.sortOrder,
      intro: spForm.intro,
    }
    if (spForm.id) {
      await updateAdminHsMathSpecialty(spForm.id, body)
    } else {
      await createAdminHsMathSpecialty(body)
    }
    ElMessage.success('已保存')
    spDialog.value = false
    await loadSpecialties()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function toggleSp(row: HsMathAdminSpecialty) {
  try {
    await updateAdminHsMathSpecialty(row.id, { isActive: !row.isActive })
    ElMessage.success(row.isActive ? '已停用' : '已启用')
    await loadSpecialties()
  } catch (e) {
    ElMessage.error(errMsg(e, '更新失败'))
  }
}

function openCatCreate() {
  Object.assign(catForm, {
    id: '',
    specialtyId: filterSpecialtyId.value || specialties.value[0]?.id || '',
    code: '',
    name: '',
    sortOrder: 0,
  })
  catDialog.value = true
}

function openCatEdit(row: HsMathAdminCategory) {
  Object.assign(catForm, {
    id: row.id,
    specialtyId: row.specialtyId,
    code: row.code,
    name: row.name,
    sortOrder: row.sortOrder,
  })
  catDialog.value = true
}

async function saveCat() {
  if (!catForm.specialtyId || !catForm.code.trim() || !catForm.name.trim()) {
    ElMessage.warning('请填写专项、code 与名称')
    return
  }
  saving.value = true
  try {
    const body = {
      specialtyId: catForm.specialtyId,
      code: catForm.code.trim(),
      name: catForm.name.trim(),
      sortOrder: catForm.sortOrder,
    }
    if (catForm.id) {
      await updateAdminHsMathCategory(catForm.id, body)
    } else {
      await createAdminHsMathCategory(body)
    }
    ElMessage.success('已保存')
    catDialog.value = false
    await loadCategories()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function toggleCat(row: HsMathAdminCategory) {
  try {
    await updateAdminHsMathCategory(row.id, { isActive: !row.isActive })
    ElMessage.success(row.isActive ? '已停用' : '已启用')
    await loadCategories()
  } catch (e) {
    ElMessage.error(errMsg(e, '更新失败'))
  }
}

async function loadSpecialties() {
  specialties.value = await listAdminHsMathSpecialties()
}

async function loadCategories() {
  categories.value = await listAdminHsMathCategories(
    filterSpecialtyId.value
      ? { specialtyId: filterSpecialtyId.value }
      : undefined,
  )
}

async function loadAll() {
  loading.value = true
  try {
    await loadSpecialties()
    await loadCategories()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

onMounted(() => void loadAll())
</script>

<style scoped>
.head {
  margin-bottom: 12px;
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
.acts {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
</style>
