<template>
  <div class="page-fill" v-loading="loading">
    <div class="toolbar">
      <h1>成绩记录</h1>
      <el-button type="primary" @click="openCreate">新增测评</el-button>
    </div>

    <div class="table-wrap">
      <el-table v-if="rows.length" :data="rows" stripe height="100%">
        <el-table-column prop="title" label="标题" min-width="120" />
        <el-table-column prop="heldAt" label="日期" width="120" sortable />
        <el-table-column prop="totalScore" label="总分" width="90" />
        <el-table-column label="满分" width="90">
          <template #default="{ row }">{{ row.totalFull ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="班排" width="90">
          <template #default="{ row }">
            <span class="rank">{{ row.classRank ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="校排" width="90">
          <template #default="{ row }">
            <span class="rank">{{ row.schoolRank ?? '-' }}</span>
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
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openView(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="askDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无成绩" />
    </div>

    <!-- 编辑/新增 -->
    <el-dialog
      v-model="editVisible"
      :title="editingId ? '编辑测评' : '新增测评'"
      width="920px"
      destroy-on-close
    >
      <el-form label-width="90px">
        <el-form-item label="类型" required>
          <el-select v-model="form.typeId" style="width: 100%">
            <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="form.heldAt" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tagIds" multiple style="width: 100%">
            <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>

        <el-divider>总成绩</el-divider>
        <el-form-item label="总分">
          <el-input-number v-model="form.totalScore" :min="0" :precision="2" />
          <el-button link type="primary" style="margin-left: 8px" @click="fillTotalFromSubjects">
            用各科合计填充（{{ subjectsSum }}）
          </el-button>
        </el-form-item>
        <el-form-item label="班排">
          <el-input-number v-model="form.classRank" :min="1" placeholder="总班排" />
        </el-form-item>
        <el-form-item label="校排">
          <el-input-number v-model="form.schoolRank" :min="1" placeholder="总校排" />
        </el-form-item>

        <el-divider>各科成绩</el-divider>
        <div class="score-head">
          <span class="c-sub">科目</span>
          <span class="c-num">得分</span>
          <span class="c-num">满分</span>
          <span class="c-num">班排</span>
          <span class="c-num">校排</span>
          <span class="c-act" />
        </div>
        <div v-for="(s, idx) in form.scores" :key="idx" class="score-row">
          <el-select v-model="s.subjectId" placeholder="科目" class="c-sub">
            <el-option v-for="sub in subjects" :key="sub.id" :label="sub.name" :value="sub.id" />
          </el-select>
          <el-input-number v-model="s.score" :min="0" class="c-num" controls-position="right" />
          <el-input-number v-model="s.fullScore" :min="0" class="c-num" controls-position="right" />
          <el-input-number v-model="s.classRank" :min="1" class="c-num" controls-position="right" />
          <el-input-number v-model="s.schoolRank" :min="1" class="c-num" controls-position="right" />
          <el-button class="c-act" link type="danger" @click="form.scores.splice(idx, 1)">删</el-button>
        </div>
        <el-button @click="addScoreRow">加一科</el-button>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 只读查看 -->
    <el-dialog v-model="viewVisible" title="查看成绩" width="720px" destroy-on-close>
      <template v-if="viewRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">{{ viewRow.title }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ viewRow.heldAt }}</el-descriptions-item>
          <el-descriptions-item label="总分">{{ viewRow.totalScore }}</el-descriptions-item>
          <el-descriptions-item label="满分">{{ viewRow.totalFull ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="班排">
            <span class="rank">{{ viewRow.classRank ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="校排">
            <span class="rank">{{ viewRow.schoolRank ?? '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <NamedColorTag
              v-for="t in viewRow.tags"
              :key="t.id"
              class="tag"
              :label="t.name"
              :color="t.color"
            />
            <span v-if="!viewRow.tags?.length">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ viewRow.note || '-' }}</el-descriptions-item>
        </el-descriptions>
        <h3 style="margin: 16px 0 8px">各科成绩</h3>
        <el-table :data="viewRow.scores" border size="small">
          <el-table-column label="科目" sortable :sort-method="sortViewSubject">
            <template #default="{ row }">{{ subjectName(row.subjectId) }}</template>
          </el-table-column>
          <el-table-column prop="score" label="得分" width="90" />
          <el-table-column label="满分" width="90">
            <template #default="{ row }">{{ row.fullScore ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="班排" width="90">
            <template #default="{ row }">
              <span class="rank">{{ row.classRank ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="校排" width="90">
            <template #default="{ row }">
              <span class="rank">{{ row.schoolRank ?? '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button type="primary" @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认（自建对话框，避免 MessageBox 样式丢失） -->
    <el-dialog v-model="deleteVisible" title="提示" width="400px" append-to-body>
      <p>确定删除「{{ deleteTarget?.title }}」吗？删除后不可恢复。</p>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleting" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAssessment,
  deleteAssessment,
  listAssessments,
  updateAssessment,
  type Assessment,
} from '@/api/assessments'
import { listAssessmentTypes, type AssessmentType } from '@/api/assessmentTypes'
import { listSubjects, type Subject } from '@/api/subjects'
import { listTags, type Tag } from '@/api/tags'
import errMsg from '@/utils/err-msg'
import { tagNamesSort, zhTextSort } from '@/utils/table-ui'

type ScoreForm = {
  subjectId: string
  score: number
  fullScore: number
  classRank?: number
  schoolRank?: number
}

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editVisible = ref(false)
const viewVisible = ref(false)
const deleteVisible = ref(false)
const editingId = ref<string | null>(null)
const viewRow = ref<Assessment | null>(null)
const deleteTarget = ref<Assessment | null>(null)
const rows = ref<Assessment[]>([])
const types = ref<AssessmentType[]>([])
const subjects = ref<Subject[]>([])
const tags = ref<Tag[]>([])

const form = reactive({
  typeId: '',
  title: '',
  heldAt: new Date().toISOString().slice(0, 10),
  note: '',
  tagIds: [] as string[],
  totalScore: undefined as number | undefined,
  classRank: undefined as number | undefined,
  schoolRank: undefined as number | undefined,
  scores: [] as ScoreForm[],
})

const subjectsSum = computed(() =>
  form.scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0),
)

function subjectName(id: string) {
  return subjects.value.find((s) => s.id === id)?.name || id
}

function sortViewSubject(a: Assessment['scores'][number], b: Assessment['scores'][number]) {
  return zhTextSort(subjectName(a.subjectId), subjectName(b.subjectId))
}

function emptyScore(): ScoreForm {
  return {
    subjectId: subjects.value[0]?.id || '',
    score: 0,
    fullScore: 100,
    classRank: undefined,
    schoolRank: undefined,
  }
}

function addScoreRow() {
  form.scores.push(emptyScore())
}

function fillTotalFromSubjects() {
  form.totalScore = subjectsSum.value
}

async function load() {
  loading.value = true
  try {
    const data = await listAssessments()
    rows.value = data.items || []
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.typeId = types.value[0]?.id || ''
  form.title = ''
  form.heldAt = new Date().toISOString().slice(0, 10)
  form.note = ''
  form.tagIds = []
  form.totalScore = undefined
  form.classRank = undefined
  form.schoolRank = undefined
  form.scores = [emptyScore()]
  editVisible.value = true
}

function openEdit(row: Assessment) {
  editingId.value = row.id
  form.typeId = row.typeId
  form.title = row.title
  form.heldAt = String(row.heldAt).slice(0, 10)
  form.note = row.note || ''
  form.tagIds = row.tags.map((t) => t.id)
  form.totalScore = row.totalScore
  form.classRank = row.classRank ?? undefined
  form.schoolRank = row.schoolRank ?? undefined
  form.scores = row.scores.map((s) => ({
    subjectId: s.subjectId,
    score: s.score,
    fullScore: s.fullScore ?? 100,
    classRank: s.classRank ?? undefined,
    schoolRank: s.schoolRank ?? undefined,
  }))
  editVisible.value = true
}

function openView(row: Assessment) {
  viewRow.value = row
  viewVisible.value = true
}

function askDelete(row: Assessment) {
  deleteTarget.value = row
  deleteVisible.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteAssessment(deleteTarget.value.id)
    ElMessage.success('已删除')
    deleteVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '删除失败'))
  } finally {
    deleting.value = false
  }
}

async function save() {
  if (!form.typeId || !form.title.trim()) {
    ElMessage.warning('请填写类型和标题')
    return
  }
  if (!form.scores.length || form.scores.some((s) => !s.subjectId)) {
    ElMessage.warning('请为每科选择科目')
    return
  }
  saving.value = true
  try {
    const payload = {
      typeId: form.typeId,
      title: form.title.trim(),
      heldAt: form.heldAt,
      note: form.note || null,
      totalScore: form.totalScore ?? subjectsSum.value,
      classRank: form.classRank ?? null,
      schoolRank: form.schoolRank ?? null,
      tagIds: form.tagIds,
      scores: form.scores.map((s) => ({
        subjectId: s.subjectId,
        score: s.score,
        fullScore: s.fullScore,
        classRank: s.classRank ?? null,
        schoolRank: s.schoolRank ?? null,
      })),
    }
    if (editingId.value) await updateAssessment(editingId.value, payload)
    else await createAssessment(payload)
    ElMessage.success('保存成功')
    editVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  types.value = await listAssessmentTypes().catch(() => [])
  subjects.value = await listSubjects().catch(() => [])
  tags.value = await listTags().catch(() => [])
  await load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.tag {
  margin-right: 4px;
}
.score-head,
.score-row {
  display: grid;
  grid-template-columns: 140px repeat(4, 1fr) 48px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.score-head {
  color: var(--app-text-secondary);
  font-size: 13px;
  margin-bottom: 4px;
}
.score-row :deep(.el-input-number) {
  width: 100%;
}
</style>
