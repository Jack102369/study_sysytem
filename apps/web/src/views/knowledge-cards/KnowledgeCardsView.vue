<template>
  <div v-loading="loading" class="page-fill kc-page">
    <div class="toolbar">
      <h1>公式定理</h1>
      <div class="toolbar-actions">
        <el-button type="primary" @click="openAiFetch()">AI 获取公式</el-button>
        <el-button @click="openCreate">手动新建</el-button>
      </div>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="这里存公式、公理、定理和解题思路，可关联到错题。AI 用来查公式定理，入库前请人工核对。"
      style="margin-bottom: 12px"
    />

    <div class="filters">
      <el-select
        v-model="filterSubjectId"
        clearable
        placeholder="全部科目"
        style="width: 160px"
        @change="reload"
      >
        <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-select
        v-model="filterKind"
        clearable
        placeholder="全部类型"
        style="width: 140px"
        @change="reload"
      >
        <el-option v-for="k in kindOptions" :key="k.value" :label="k.label" :value="k.value" />
      </el-select>
    </div>

    <div v-if="rows.length" class="card-grid">
      <el-card v-for="row in rows" :key="row.id" shadow="never" class="kc-item">
        <div class="kc-item-head">
          <el-tag size="small" :type="kindTag(row.kind)">{{ kindText(row.kind) }}</el-tag>
          <span class="subj">{{ row.subjectName || '—' }}</span>
          <div class="ops">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(row)">删除</el-button>
          </div>
        </div>
        <h3 class="kc-title">{{ row.title }}</h3>
        <div class="kc-content" v-html="mathHtml(row.content)" />
        <p v-if="row.tip" class="kc-tip">易错：{{ row.tip }}</p>
        <p v-if="row.linkedErrorQuestionIds?.length" class="kc-links">
          已关联错题
          <el-button
            v-for="eid in row.linkedErrorQuestionIds.slice(0, 3)"
            :key="eid"
            link
            type="primary"
            @click="$router.push(`/errors/${eid}`)"
          >
            #{{ eid }}
          </el-button>
        </p>
      </el-card>
    </div>
    <el-empty v-else description="暂无公式定理，可用 AI 获取或手动新建" />

    <div v-if="total > pageSize" class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="page"
        @current-change="reload"
      />
    </div>

    <el-dialog v-model="editVisible" :title="editId ? '编辑知识点' : '新建知识点'" width="640px">
      <el-form label-width="80px">
        <el-form-item label="科目" required>
          <el-select v-model="form.subjectId" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.kind" style="width: 100%">
            <el-option v-for="k in kindOptions" :key="k.value" :label="k.label" :value="k.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.title" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="公式可用 LaTeX，如 $F=ma$ 或 $$E_k=\frac12 mv^2$$"
          />
        </el-form-item>
        <el-form-item label="易错">
          <el-input v-model="form.tip" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="aiVisible" title="AI 获取公式/公理/定理" width="560px">
      <el-form label-width="88px">
        <el-form-item label="科目" required>
          <el-select v-model="aiForm.subjectId" style="width: 100%">
            <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="主题">
          <el-input
            v-model="aiForm.topic"
            placeholder="如：动能定理、牛顿第二定律、导数定义"
          />
        </el-form-item>
        <el-form-item label="关联错题">
          <el-input v-model="aiForm.errorQuestionId" placeholder="可选：错题 ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="aiVisible = false">取消</el-button>
        <el-button type="primary" :loading="aiLoading" @click="runAiFetch">开始获取</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="draftVisible"
      title="确认 AI 整理的知识点"
      width="720px"
      :close-on-click-modal="false"
    >
      <p class="draft-hint">请核对公式与表述后再入库；可改文字或移除不需要的条目。</p>
      <div v-for="(d, idx) in drafts" :key="idx" class="draft-card">
        <div class="draft-head">
          <el-select v-model="d.kind" size="small" style="width: 120px">
            <el-option v-for="k in kindOptions" :key="k.value" :label="k.label" :value="k.value" />
          </el-select>
          <el-button link type="danger" @click="drafts.splice(idx, 1)">移除</el-button>
        </div>
        <el-input v-model="d.title" placeholder="名称" style="margin-bottom: 8px" />
        <el-input v-model="d.content" type="textarea" :rows="3" placeholder="内容" style="margin-bottom: 8px" />
        <el-input v-model="d.tip" placeholder="易错提醒（可选）" />
        <div class="draft-preview" v-html="mathHtml(d.content)" />
      </div>
      <el-empty v-if="!drafts.length" description="没有可保存的草稿" :image-size="48" />
      <template #footer>
        <el-button @click="draftVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="savingDrafts"
          :disabled="!drafts.length"
          @click="saveDrafts"
        >
          确认入库
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listSubjects, type Subject } from '@/api/subjects'
import {
  aiFetchKnowledge,
  batchCreateKnowledgeCards,
  createKnowledgeCard,
  deleteKnowledgeCard,
  listKnowledgeCards,
  updateKnowledgeCard,
  type KnowledgeCard,
  type KnowledgeDraft,
  type KnowledgeKind,
} from '@/api/knowledge-cards'
import { renderMathHtml } from '@/utils/render-math'
import errMsg from '@/utils/err-msg'

const kindOptions = [
  { value: 'formula', label: '公式' },
  { value: 'axiom', label: '公理' },
  { value: 'theorem', label: '定理' },
  { value: 'method', label: '解题思路' },
] as const

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const savingDrafts = ref(false)
const aiLoading = ref(false)
const rows = ref<KnowledgeCard[]>([])
const subjects = ref<Subject[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterSubjectId = ref<string | undefined>()
const filterKind = ref<string | undefined>()

const editVisible = ref(false)
const editId = ref<string | null>(null)
const form = reactive({
  subjectId: '',
  kind: 'formula' as KnowledgeKind,
  title: '',
  content: '',
  tip: '',
})

const aiVisible = ref(false)
const aiForm = reactive({
  subjectId: '',
  topic: '',
  errorQuestionId: '',
})

const draftVisible = ref(false)
const drafts = ref<KnowledgeDraft[]>([])

function kindText(k: string) {
  return kindOptions.find((x) => x.value === k)?.label || k
}

function kindTag(k: string) {
  if (k === 'formula') return 'primary'
  if (k === 'axiom') return 'warning'
  if (k === 'theorem') return 'success'
  return 'info'
}

function mathHtml(s: string) {
  return renderMathHtml(s)
}

async function reload() {
  loading.value = true
  try {
    const list = await listKnowledgeCards({
      page: page.value,
      pageSize,
      subjectId: filterSubjectId.value || undefined,
      kind: filterKind.value || undefined,
    })
    rows.value = list.items
    total.value = list.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editId.value = null
  form.subjectId = subjects.value[0]?.id || ''
  form.kind = 'formula'
  form.title = ''
  form.content = ''
  form.tip = ''
  editVisible.value = true
}

function openEdit(row: KnowledgeCard) {
  editId.value = row.id
  form.subjectId = row.subjectId
  form.kind = row.kind
  form.title = row.title
  form.content = row.content
  form.tip = row.tip || ''
  editVisible.value = true
}

async function saveForm() {
  if (!form.subjectId || !form.title.trim() || !form.content.trim()) {
    ElMessage.warning('请填写科目、名称和内容')
    return
  }
  saving.value = true
  try {
    if (editId.value) {
      await updateKnowledgeCard(editId.value, {
        subjectId: form.subjectId,
        kind: form.kind,
        title: form.title.trim(),
        content: form.content.trim(),
        tip: form.tip.trim() || null,
      })
    } else {
      await createKnowledgeCard({
        subjectId: form.subjectId,
        kind: form.kind,
        title: form.title.trim(),
        content: form.content.trim(),
        tip: form.tip.trim() || null,
      })
    }
    ElMessage.success('已保存')
    if (!editId.value) {
      const { usePetStore } = await import('@/stores/pet')
      usePetStore().emitPetEvent('knowledge_saved')
    }
    editVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function onDelete(row: KnowledgeCard) {
  try {
    await ElMessageBox.confirm('确定删除该知识点？', '提示', { type: 'warning' })
    await deleteKnowledgeCard(row.id)
    ElMessage.success('已删除')
    await reload()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e, '删除失败'))
  }
}

function openAiFetch(preset?: { subjectId?: string; errorId?: string; topic?: string }) {
  aiForm.subjectId = preset?.subjectId || filterSubjectId.value || subjects.value[0]?.id || ''
  aiForm.topic = preset?.topic || ''
  aiForm.errorQuestionId = preset?.errorId || ''
  aiVisible.value = true
}

async function runAiFetch() {
  if (!aiForm.subjectId) {
    ElMessage.warning('请选择科目')
    return
  }
  if (!aiForm.topic.trim() && !aiForm.errorQuestionId.trim()) {
    ElMessage.warning('请填写主题，或填写错题 ID')
    return
  }
  aiLoading.value = true
  try {
    const res = await aiFetchKnowledge({
      subjectId: aiForm.subjectId,
      topic: aiForm.topic.trim() || undefined,
      errorQuestionId: aiForm.errorQuestionId.trim() || undefined,
      count: 5,
    })
    drafts.value = res.items.map((it) => ({
      kind: it.kind,
      title: it.title,
      content: it.content,
      tip: it.tip || '',
      subjectId: it.subjectId || res.subjectId,
      linkErrorQuestionId: it.linkErrorQuestionId || res.linkErrorQuestionId,
    }))
    aiVisible.value = false
    draftVisible.value = true
    ElMessage.success(`已整理 ${drafts.value.length} 条，请确认后入库`)
  } catch (e) {
    ElMessage.error(errMsg(e, 'AI 获取失败'))
  } finally {
    aiLoading.value = false
  }
}

async function saveDrafts() {
  const items = drafts.value
    .filter((d) => d.title.trim() && d.content.trim())
    .map((d) => ({
      subjectId: d.subjectId,
      kind: d.kind,
      title: d.title.trim(),
      content: d.content.trim(),
      tip: d.tip.trim() || null,
      linkErrorQuestionId: d.linkErrorQuestionId || null,
    }))
  if (!items.length) {
    ElMessage.warning('没有可保存的条目')
    return
  }
  savingDrafts.value = true
  try {
    await batchCreateKnowledgeCards(items)
    ElMessage.success(`已入库 ${items.length} 条`)
    const { usePetStore } = await import('@/stores/pet')
    usePetStore().emitPetEvent('knowledge_saved')
    draftVisible.value = false
    drafts.value = []
    await router.replace({ path: '/knowledge-cards' })
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '入库失败'))
  } finally {
    savingDrafts.value = false
  }
}

onMounted(async () => {
  try {
    subjects.value = await listSubjects()
  } catch {
    subjects.value = []
  }
  await reload()
  const fromError = String(route.query.fromError || '')
  if (fromError) {
    const subjectId = String(route.query.subjectId || '') || subjects.value[0]?.id || ''
    aiForm.subjectId = subjectId
    aiForm.errorQuestionId = fromError
    aiForm.topic = String(route.query.topic || '')
    // 从错题进入：直接拉取（后端会按错题科目纠正）
    await runAiFetch()
    await router.replace({ path: '/knowledge-cards' })
  }
})
</script>

<style scoped>
.kc-page {
  min-height: 0;
  overflow: auto;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}
.kc-item :deep(.el-card__body) {
  padding: 12px;
}
.kc-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.subj {
  font-size: 12px;
  color: var(--app-text-secondary);
}
.ops {
  margin-left: auto;
}
.kc-title {
  margin: 0 0 8px;
  font-size: 16px;
}
.kc-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--app-text);
  word-break: break-word;
}
.kc-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: #e6a23c;
}
.kc-links {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--app-text-secondary);
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.draft-hint {
  margin: 0 0 12px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
.draft-card {
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}
.draft-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.draft-preview {
  margin-top: 8px;
  padding: 8px;
  background: var(--app-bg, rgba(0, 0, 0, 0.03));
  border-radius: 6px;
  font-size: 13px;
}
</style>
