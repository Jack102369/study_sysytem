<template>
  <div class="page-fill ai-ref-page" v-loading="loading">
    <div class="toolbar">
      <h1>AI 参考</h1>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="本模块与错题/延伸训练完全隔离。AI 题目与答案仅供参考，可能有误；须人工核对后标记「已确认」。"
      style="margin-bottom: 12px"
    />

    <div class="layout">
      <section class="panel">
        <h2>生成</h2>
        <el-form label-width="88px">
          <el-form-item label="筛选科目">
            <el-select
              v-model="filterSubjectId"
              clearable
              placeholder="全部科目"
              style="width: 100%"
              @change="onSubjectFilterChange"
            >
              <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="知识点">
            <el-select
              v-model="form.categoryIds"
              multiple
              clearable
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选科目后可选分类（知识点）"
              style="width: 100%"
              :disabled="!filterSubjectId"
            >
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="来源错题">
            <el-select
              v-model="form.sourceErrorQuestionId"
              filterable
              remote
              clearable
              reserve-keyword
              placeholder="可选：从错题本带入；也可不选，直接粘贴题干"
              :remote-method="searchErrors"
              :loading="errorSearching"
              style="width: 100%"
              @change="onSourceChange"
              @visible-change="(v: boolean) => v && searchErrors(errorKeyword)"
            >
              <el-option
                v-for="e in errorOptions"
                :key="e.id"
                :label="errorOptionLabel(e)"
                :value="e.id"
              >
                <div class="err-opt">
                  <el-image
                    v-if="e.stemImageUrl"
                    class="err-opt-thumb"
                    :src="fileUrl(e.stemImageUrl)"
                    fit="cover"
                    :preview-src-list="[fileUrl(e.stemImageUrl)]"
                    preview-teleported
                    @click.stop
                  />
                  <div v-else class="err-opt-thumb placeholder">无图</div>
                  <div class="err-opt-meta">
                    <div class="err-opt-title">{{ errorOptionTitle(e) }}</div>
                    <div class="err-opt-sub">
                      {{ e.subjectName || '—' }}
                      <template v-if="e.categoryName"> · {{ e.categoryName }}</template>
                      · {{ String(e.occurredAt || '').slice(0, 10) }} · #{{ e.id }}
                    </div>
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="selectedStemImageUrl" label="题干图">
            <el-image
              class="selected-stem"
              :src="fileUrl(selectedStemImageUrl)"
              fit="contain"
              :preview-src-list="[fileUrl(selectedStemImageUrl)]"
              preview-teleported
            />
          </el-form-item>
          <el-form-item label="题干文字" required>
            <el-input
              v-model="form.stemText"
              type="textarea"
              :rows="6"
              placeholder="可从别处直接粘贴题干；或选来源错题后 OCR/带入再改"
            />
          </el-form-item>
          <el-form-item label="生成数量">
            <el-input-number v-model="form.count" :min="1" :max="3" />
          </el-form-item>
          <el-form-item label="扩展程度">
            <el-select v-model="form.expandMode" style="width: 220px">
              <el-option label="拓展训练（推荐）" value="EXPAND" />
              <el-option label="同类巩固" value="SIMILAR" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              v-if="canUseOcr"
              :loading="ocrLoading"
              :disabled="!form.sourceErrorQuestionId"
              @click="onOcr"
            >
              识别题干图片
            </el-button>
            <el-button
              type="primary"
              :loading="genLoading"
              :disabled="!form.stemText.trim()"
              @click="onGenerate"
            >
              生成参考题
            </el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="panel list-panel">
        <div class="list-head">
          <h2>参考题列表</h2>
          <div class="filters">
            <el-select
              v-model="query.status"
              clearable
              placeholder="状态"
              style="width: 120px"
              @change="reload"
            >
              <el-option label="AI 初始" value="UNVERIFIED" />
              <el-option label="已确认" value="VERIFIED" />
            </el-select>
            <el-button text type="primary" @click="reload">刷新</el-button>
          </div>
        </div>

        <el-table v-if="rows.length" :data="rows" stripe height="100%" @row-click="openEdit">
          <el-table-column prop="status" label="状态" width="100" sortable>
            <template #default="{ row }">
              <el-tag :type="row.status === 'VERIFIED' ? 'success' : 'warning'" size="small">
                {{ row.status === 'VERIFIED' ? '已确认' : 'AI 初始' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题干" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ row.stemText }}</template>
          </el-table-column>
          <el-table-column label="确认次数" width="88" align="center">
            <template #default="{ row }">{{ row.verifyCount }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="160" sortable>
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="openEdit(row)">编辑</el-button>
              <el-button
                v-if="row.status !== 'VERIFIED'"
                link
                type="success"
                @click.stop="onVerify(row, 'VERIFIED')"
              >
                确认
              </el-button>
              <el-button
                v-else
                link
                type="warning"
                @click.stop="onVerify(row, 'UNVERIFIED')"
              >
                取消确认
              </el-button>
              <el-button link type="danger" @click.stop="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!loading" description="暂无 AI 参考题" />
        <div class="pager" v-if="total > 0">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="onPage"
          />
        </div>
      </section>
    </div>

    <el-dialog v-model="editVisible" title="编辑 AI 参考题" width="720px" destroy-on-close>
      <el-alert
        v-if="editing"
        :type="editing.status === 'VERIFIED' ? 'success' : 'warning'"
        :closable="false"
        style="margin-bottom: 12px"
        :title="
          editing.status === 'VERIFIED'
            ? '当前为已确认。修改正文后会自动回到「AI 初始」，需再次确认。'
            : '当前为 AI 初始状态，核对题干/答案/解析无误后再点确认。'
        "
      />
      <el-form v-if="editing" label-width="72px">
        <el-form-item label="题干" required>
          <el-input v-model="editForm.stemText" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="editForm.answerText" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input v-model="editForm.analysisText" type="textarea" :rows="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">关闭</el-button>
        <el-button type="primary" :loading="saving" @click="onSaveEdit">保存修改</el-button>
        <el-button
          v-if="editing && editing.status !== 'VERIFIED'"
          type="success"
          :loading="saving"
          @click="onVerify(editing, 'VERIFIED')"
        >
          确认正确
        </el-button>
        <el-button
          v-if="editing && editing.status === 'VERIFIED'"
          type="warning"
          :loading="saving"
          @click="onVerify(editing, 'UNVERIFIED')"
        >
          取消确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteAiReference,
  generateAiReference,
  listAiReference,
  ocrAiReference,
  setAiReferenceVerify,
  updateAiReference,
  type AiReferenceItem,
  type AiReferenceStatus,
} from '@/api/ai-reference'
import { fetchMe } from '@/api/auth'
import {
  getErrorQuestion,
  listErrorQuestions,
  type ErrorQuestionListItem,
} from '@/api/errors'
import { listErrorCategories, type ErrorCategory } from '@/api/categories'
import { listSubjects, type Subject } from '@/api/subjects'
import errMsg from '@/utils/err-msg'
import { fileUrl } from '@/utils/api-base'
import { formatDateTime } from '@/utils/datetime'

type ErrorOption = ErrorQuestionListItem & { stemText?: string | null }

const route = useRoute()
const loading = ref(false)
const ocrLoading = ref(false)
const genLoading = ref(false)
const saving = ref(false)
const errorSearching = ref(false)
const canUseOcr = ref(false)
const subjects = ref<Subject[]>([])
const categories = ref<ErrorCategory[]>([])
const filterSubjectId = ref('')
const errorKeyword = ref('')
const errorOptions = ref<ErrorOption[]>([])
const rows = ref<AiReferenceItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const editVisible = ref(false)
const editing = ref<AiReferenceItem | null>(null)

const query = reactive({
  status: '' as AiReferenceStatus | '',
})

const form = reactive({
  sourceErrorQuestionId: '',
  categoryIds: [] as string[],
  stemText: '',
  count: 2,
  expandMode: 'EXPAND' as 'SIMILAR' | 'EXPAND',
})

const editForm = reactive({
  stemText: '',
  answerText: '',
  analysisText: '',
})

const selectedStemImageUrl = computed(() => {
  const hit = errorOptions.value.find((e) => e.id === form.sourceErrorQuestionId)
  return hit?.stemImageUrl || null
})

function formatTime(raw: string | null | undefined) {
  return formatDateTime(raw)
}

function errorOptionTitle(e: ErrorOption) {
  return (
    e.title?.trim() ||
    e.stemPreview?.trim() ||
    e.stemText?.replace(/\s+/g, ' ').trim().slice(0, 80) ||
    (e.hasStemImage || e.stemImageUrl ? '（见左侧题干图）' : `错题 #${e.id}`)
  )
}

function errorOptionLabel(e: ErrorOption) {
  return `${e.subjectName || ''} · ${errorOptionTitle(e)} · #${e.id}`
}

async function searchErrors(kw: string) {
  errorKeyword.value = kw || ''
  errorSearching.value = true
  try {
    const data = await listErrorQuestions({
      subjectId: filterSubjectId.value || undefined,
      keyword: kw || undefined,
      page: 1,
      pageSize: 40,
    })
    errorOptions.value = data.items
  } catch {
    errorOptions.value = []
  } finally {
    errorSearching.value = false
  }
}

async function loadCategories() {
  if (!filterSubjectId.value) {
    categories.value = []
    form.categoryIds = []
    return
  }
  try {
    categories.value = await listErrorCategories({
      subjectId: filterSubjectId.value,
      includeGlobal: true,
    })
  } catch {
    categories.value = []
  }
}

async function onSubjectFilterChange() {
  form.sourceErrorQuestionId = ''
  form.stemText = ''
  form.categoryIds = []
  await Promise.all([searchErrors(errorKeyword.value), loadCategories()])
}

async function onSourceChange(id: string) {
  if (!id) {
    return
  }
  const hit = errorOptions.value.find((e) => e.id === id)
  try {
    const detail = await getErrorQuestion(id)
    form.stemText = detail.stemText || hit?.stemText || ''
    const stemImg =
      detail.attachments?.find((a) => a.role === 'STEM')?.url || hit?.stemImageUrl || null
    const idx = errorOptions.value.findIndex((e) => e.id === id)
    const patched: ErrorOption = {
      ...(hit || ({} as ErrorOption)),
      id: detail.id,
      title: detail.title,
      subjectId: detail.subjectId,
      subjectName: detail.subjectName,
      categoryId: detail.categoryId,
      categoryName: detail.categoryName,
      stemText: detail.stemText,
      stemPreview: detail.stemText?.slice(0, 60) || null,
      stemImageUrl: stemImg,
      hasStemImage: !!stemImg,
      occurredAt: detail.occurredAt,
    }
    if (idx >= 0) errorOptions.value[idx] = { ...errorOptions.value[idx], ...patched }
    else errorOptions.value = [patched, ...errorOptions.value]

    if (detail.subjectId) {
      filterSubjectId.value = String(detail.subjectId)
      await loadCategories()
    }
    if (detail.categoryId) {
      form.categoryIds = [String(detail.categoryId)]
    }
  } catch {
    if (hit?.stemText) form.stemText = hit.stemText
  }
  query.status = ''
  page.value = 1
  await reload()
}

async function reload() {
  loading.value = true
  try {
    const data = await listAiReference({
      sourceErrorQuestionId: form.sourceErrorQuestionId || undefined,
      status: query.status || undefined,
      page: page.value,
      pageSize,
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
  page.value = p
  reload()
}

async function onOcr() {
  if (!form.sourceErrorQuestionId) return
  ocrLoading.value = true
  try {
    const data = await ocrAiReference({
      sourceErrorQuestionId: form.sourceErrorQuestionId,
      saveToStemText: true,
    })
    form.stemText = data.text
    ElMessage.success(
      data.engine
        ? `识别完成（${data.engine}），已写入题干`
        : '识别完成，已写入题干（可再修改）',
    )
  } catch (e) {
    ElMessage.error(errMsg(e, '识别失败（请检查 Qwen Vision 或 OCR_ENGINE）'))
  } finally {
    ocrLoading.value = false
  }
}

async function onGenerate() {
  const stem = form.stemText.trim()
  if (!stem) {
    ElMessage.warning('请先填写或粘贴题干文字')
    return
  }
  genLoading.value = true
  try {
    const data = await generateAiReference({
      sourceErrorQuestionId: form.sourceErrorQuestionId || undefined,
      stemText: stem,
      subjectId: filterSubjectId.value || undefined,
      categoryIds: form.categoryIds.length ? form.categoryIds : undefined,
      count: form.count,
      expandMode: form.expandMode,
    })
    ElMessage.success(`已生成 ${data.items.length} 道参考题（AI 初始）`)
    page.value = 1
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '生成失败'))
  } finally {
    genLoading.value = false
  }
}

function openEdit(row: AiReferenceItem) {
  editing.value = row
  editForm.stemText = row.stemText
  editForm.answerText = row.answerText || ''
  editForm.analysisText = row.analysisText || ''
  editVisible.value = true
}

async function onSaveEdit() {
  if (!editing.value) return
  if (!editForm.stemText.trim()) {
    ElMessage.warning('题干不能为空')
    return
  }
  saving.value = true
  try {
    const updated = await updateAiReference(editing.value.id, {
      stemText: editForm.stemText.trim(),
      answerText: editForm.answerText.trim() || null,
      analysisText: editForm.analysisText.trim() || null,
    })
    editing.value = updated
    ElMessage.success(
      updated.status === 'UNVERIFIED' ? '已保存（若曾确认将降为 AI 初始）' : '已保存',
    )
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function onVerify(row: AiReferenceItem, status: AiReferenceStatus) {
  saving.value = true
  try {
    const updated = await setAiReferenceVerify(row.id, status)
    if (editing.value?.id === row.id) editing.value = updated
    ElMessage.success(status === 'VERIFIED' ? '已标记为人工确认' : '已取消确认')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '更新状态失败'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: AiReferenceItem) {
  try {
    await ElMessageBox.confirm('确定删除该 AI 参考题？', '提示', { type: 'warning' })
    await deleteAiReference(row.id)
    ElMessage.success('已删除')
    if (editing.value?.id === row.id) editVisible.value = false
    await reload()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e, '删除失败'))
  }
}

onMounted(async () => {
  const qid = typeof route.query.errorId === 'string' ? route.query.errorId : ''
  try {
    const [me, subjectList] = await Promise.all([
      fetchMe().catch(() => null),
      listSubjects().catch(() => [] as Subject[]),
    ])
    canUseOcr.value = !!me?.ocrEnabled
    subjects.value = subjectList
  } catch {
    /* ignore */
  }
  if (qid) {
    try {
      const detail = await getErrorQuestion(qid)
      filterSubjectId.value = detail.subjectId || ''
      form.sourceErrorQuestionId = qid
      form.stemText = detail.stemText || ''
      if (detail.categoryId) form.categoryIds = [String(detail.categoryId)]
      const stemImg = detail.attachments?.find((a) => a.role === 'STEM')?.url || null
      errorOptions.value = [
        {
          ...detail,
          stemText: detail.stemText,
          stemPreview: detail.stemText?.replace(/\s+/g, ' ').slice(0, 60) || null,
          stemImageUrl: stemImg,
          hasStemImage: !!stemImg,
        },
      ]
      await loadCategories()
    } catch {
      /* ignore */
    }
  } else {
    await searchErrors('')
  }
  await reload()
})

watch(
  () => form.sourceErrorQuestionId,
  () => {
    page.value = 1
  },
)
</script>

<style scoped>
.toolbar h1 {
  margin: 0 0 8px;
  font-size: 20px;
}
.layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(380px, 1.3fr);
  gap: 16px;
}
.panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}
.panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}
.list-panel {
  overflow: hidden;
}
.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.err-opt {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 4px 0;
  max-width: 100%;
}
.err-opt-thumb {
  width: 72px;
  height: 54px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.err-opt-thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.err-opt-meta {
  min-width: 0;
  flex: 1;
}
.err-opt-title {
  font-size: 13px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}
.err-opt-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.selected-stem {
  width: 100%;
  max-height: 180px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}
:deep(.el-select-dropdown__item) {
  height: auto !important;
  padding-top: 6px;
  padding-bottom: 6px;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
