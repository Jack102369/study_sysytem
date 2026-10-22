<template>
  <div class="page-fill" v-loading="loading">
    <div class="toolbar">
      <h1>延伸训练</h1>
      <el-button type="primary" @click="openCreate">新增题目</el-button>
    </div>

    <el-form :inline="true" class="filters">
      <el-form-item label="科目">
        <el-select
          v-model="query.subjectId"
          clearable
          placeholder="全部"
          style="width: 140px"
          @change="onSubjectFilter"
        >
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="文件类型">
        <el-select
          v-model="query.categoryId"
          clearable
          placeholder="全部"
          style="width: 160px"
          :disabled="!query.subjectId"
          @change="reload"
        >
          <el-option v-for="c in filterCategories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="学习状态">
        <el-select
          v-model="query.learnStatus"
          clearable
          placeholder="全部"
          style="width: 120px"
          @change="onLearnStatusFilter"
        >
          <el-option
            v-for="o in LEARN_STATUS_OPTIONS"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="reload">查询</el-button>
      </el-form-item>
    </el-form>

    <div class="table-wrap">
      <el-table v-if="rows.length" :data="rows" stripe height="100%" table-layout="fixed">
        <el-table-column prop="subjectName" label="科目" width="88" sortable>
          <template #default="{ row }">{{ row.subjectName || '—' }}</template>
        </el-table-column>
        <el-table-column
          prop="categoryName"
          label="文件类型"
          width="160"
          show-overflow-tooltip
          sortable
        >
          <template #default="{ row }">{{ row.categoryName || '—' }}</template>
        </el-table-column>
        <el-table-column label="说明" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.contentText || '—' }}</template>
        </el-table-column>
        <el-table-column label="文件名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.questionAttachmentUrl">
              <a :href="fileUrl(row.questionAttachmentUrl)" target="_blank">
                {{ row.questionFileName || '查看文件' }}
              </a>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="168" sortable>
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="learnStatus"
          label="学习状态"
          width="110"
          align="center"
          sortable
          :sort-method="learnStatusSort"
        >
          <template #default="{ row }">
            <el-tag :type="learnStatusTagType(row.learnStatus)" size="small">
              {{ learnStatusLabel(row.learnStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="168" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="!row.questionAttachmentUrl"
              @click="onView(row)"
            >
              查看
            </el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无延伸训练题目" />
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

    <el-dialog
      v-model="dialogVisible"
      :title="editing ? '编辑延伸题' : '新增延伸题'"
      width="560px"
      destroy-on-close
    >
      <el-form label-width="90px">
        <el-form-item v-if="!editing" label="科目" required>
          <el-select
            v-model="form.subjectId"
            style="width: 100%"
            @change="onFormSubjectChange"
          >
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="科目">
          <el-input :model-value="editing.subjectName || '—'" disabled />
        </el-form-item>
        <el-form-item label="文件类型" required>
          <el-select
            v-model="form.categoryId"
            style="width: 100%"
            :disabled="!editing && !form.subjectId"
            :placeholder="editing ? '请选择文件类型' : '请先选科目'"
          >
            <el-option v-for="c in formCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="学习状态" required>
          <el-select v-model="form.learnStatus" style="width: 100%">
            <el-option
              v-for="o in LEARN_STATUS_OPTIONS"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="可选，补充说明"
          />
        </el-form-item>
        <el-form-item v-if="!editing" label="题目文件">
          <div class="upload-inline">
            <el-upload
              :show-file-list="false"
              accept="image/*,.pdf,.doc,.docx"
              :http-request="uploadFile"
            >
              <el-button :loading="uploading">上传文件</el-button>
            </el-upload>
            <template v-if="pendingFile">
              <el-image
                v-if="isImageUrl(pendingFile.url)"
                class="mini-thumb"
                :src="fileUrl(pendingFile.url)"
                :preview-src-list="[fileUrl(pendingFile.url)]"
                fit="cover"
                preview-teleported
              />
              <a :href="fileUrl(pendingFile.url)" target="_blank" class="file-link">
                {{ pendingFile.name || '已选文件' }}
              </a>
              <el-button link type="danger" @click="pendingFile = null">清除</el-button>
            </template>
          </div>
        </el-form-item>
        <el-form-item v-else label="题目文件">
          <template v-if="pendingFile">
            <a
              v-if="pendingFile.url"
              :href="fileUrl(pendingFile.url)"
              target="_blank"
              class="file-link"
            >
              {{ pendingFile.name || '已选文件' }}
            </a>
            <span v-else>{{ pendingFile.name || '—' }}</span>
          </template>
          <span v-else>—</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { uploadAttachment } from '@/api/attachments'
import { listErrorCategories, ensureSpecialExtensionCategory, type ErrorCategory } from '@/api/categories'
import {
  createExtensionMaterial,
  deleteExtensionMaterial,
  listExtensionMaterials,
  updateExtensionMaterial,
  type ExtensionMaterial,
  type LearnStatus,
} from '@/api/extension-materials'
import { listSubjects, type Subject } from '@/api/subjects'
import errMsg from '@/utils/err-msg'
import { fileUrl } from '@/utils/api-base'
import {
  LEARN_STATUS_OPTIONS,
  learnStatusLabel,
  learnStatusTagType,
} from '@/utils/status-label'
import { learnStatusSort } from '@/utils/table-ui'

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const rows = ref<ExtensionMaterial[]>([])
const total = ref(0)
const subjects = ref<Subject[]>([])
const filterCategories = ref<ErrorCategory[]>([])
const formCategories = ref<ErrorCategory[]>([])
const dialogVisible = ref(false)
const editing = ref<ExtensionMaterial | null>(null)
const pendingFile = ref<{ id: string; url: string; name: string } | null>(null)

const query = reactive({
  subjectId: '',
  categoryId: '',
  learnStatus: '' as LearnStatus | '',
  page: 1,
  pageSize: 20,
})

const form = reactive({
  subjectId: '',
  categoryId: '',
  remark: '',
  learnStatus: 'NOT_STARTED' as LearnStatus,
})

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

function formatTime(raw: string | Date | null | undefined) {
  if (!raw) return '—'
  return String(raw).slice(0, 19).replace('T', ' ')
}

async function loadFilterCategories(subjectId: string) {
  if (!subjectId) {
    filterCategories.value = []
    return
  }
  filterCategories.value = await listErrorCategories({
    subjectId,
    includeGlobal: true,
  }).catch(() => [])
}

async function loadFormCategories(subjectId: string) {
  if (!subjectId) {
    formCategories.value = []
    return
  }
  formCategories.value = await listErrorCategories({
    subjectId,
    includeGlobal: true,
  }).catch(() => [])
}

async function onSubjectFilter() {
  query.categoryId = ''
  query.page = 1
  await loadFilterCategories(query.subjectId)
  await reload()
}

function onLearnStatusFilter() {
  query.page = 1
  reload()
}

async function onFormSubjectChange() {
  form.categoryId = ''
  await loadFormCategories(form.subjectId)
}

async function reload() {
  loading.value = true
  try {
    const data = await listExtensionMaterials({
      subjectId: query.subjectId || undefined,
      categoryId: query.categoryId || undefined,
      learnStatus: query.learnStatus || undefined,
      page: query.page,
      pageSize: query.pageSize,
    })
    rows.value = data.items
    total.value = data.total
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

function openCreate() {
  editing.value = null
  form.subjectId = query.subjectId || ''
  form.categoryId = query.categoryId || ''
  form.remark = ''
  form.learnStatus = 'NOT_STARTED'
  pendingFile.value = null
  loadFormCategories(form.subjectId)
  dialogVisible.value = true
}

function openEdit(row: ExtensionMaterial) {
  editing.value = row
  form.subjectId = row.subjectId
  form.categoryId = row.categoryId
  form.remark = row.contentText || ''
  form.learnStatus = row.learnStatus || 'NOT_STARTED'
  pendingFile.value = row.questionAttachmentId
    ? {
        id: row.questionAttachmentId,
        url: row.questionAttachmentUrl || '',
        name: row.questionFileName || '',
      }
    : null
  loadFormCategories(form.subjectId)
  dialogVisible.value = true
}

function onView(row: ExtensionMaterial) {
  if (!row.questionAttachmentUrl) {
    ElMessage.warning('暂无文件')
    return
  }
  window.open(fileUrl(row.questionAttachmentUrl), '_blank')
}

async function uploadFile(opt: UploadRequestOptions) {
  uploading.value = true
  try {
    const file = opt.file as File
    const att = await uploadAttachment(file)
    pendingFile.value = {
      id: att.id,
      url: att.url,
      name: att.originalName || file.name || '已选文件',
    }
    ElMessage.success('文件已上传')
    opt.onSuccess?.(att as any)
  } catch (e) {
    ElMessage.error(errMsg(e, '上传失败'))
    opt.onError?.(e as any)
  } finally {
    uploading.value = false
  }
}

async function onSave() {
  if (editing.value) {
    if (!form.categoryId) {
      ElMessage.warning('请选择文件类型')
      return
    }
  } else if (!form.subjectId || !form.categoryId) {
    ElMessage.warning('请选择科目和文件类型')
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await updateExtensionMaterial(editing.value.id, {
        categoryId: form.categoryId,
        contentText: form.remark || null,
        learnStatus: form.learnStatus,
      })
      ElMessage.success('已更新')
    } else {
      await createExtensionMaterial({
        subjectId: form.subjectId,
        categoryId: form.categoryId,
        title: null,
        contentText: form.remark || null,
        answerText: null,
        questionAttachmentId: pendingFile.value?.id || null,
        fileName: pendingFile.value?.name || null,
        learnStatus: form.learnStatus,
      })
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: ExtensionMaterial) {
  try {
    await ElMessageBox.confirm('确定删除该延伸题？', '提示', { type: 'warning' })
    await deleteExtensionMaterial(row.id)
    ElMessage.success('已删除')
    await reload()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e, '删除失败'))
  }
}

onMounted(async () => {
  subjects.value = await listSubjects().catch(() => [])
  await ensureSpecialExtensionCategory().catch(() => null)
  await reload()
})

watch(
  () => query.subjectId,
  (sid) => {
    if (!sid) filterCategories.value = []
  },
)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.filters {
  margin-bottom: 8px;
  flex-shrink: 0;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.upload-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--app-border, #ebeef5);
  cursor: pointer;
}
.file-link {
  color: var(--el-color-primary);
}
</style>
