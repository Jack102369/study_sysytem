<template>
  <div class="page admin-items" v-loading="loading">
    <header class="head">
      <div>
        <h1>高一数学 · 训练题库</h1>
        <p class="sub">新建为 draft；批准须走审核接口。仅 ADMIN。</p>
      </div>
      <div class="acts">
        <el-button @click="$router.push({ name: 'settings-hs-math-train-review' })">
          人工审核
        </el-button>
        <el-button @click="$router.push({ name: 'settings-hs-math-train-import' })">
          批量导入
        </el-button>
        <el-button @click="$router.push({ name: 'settings-hs-math-methods' })">
          解题方法
        </el-button>
        <el-button type="primary" @click="openCreate">新增题目</el-button>
        <el-button @click="reload">刷新</el-button>
      </div>
    </header>

    <el-form :inline="true" class="filters">
      <el-form-item label="专项">
        <el-select
          v-model="filters.specialtyId"
          clearable
          filterable
          style="width: 180px"
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
      <el-form-item label="分类">
        <el-select
          v-model="filters.categoryId"
          clearable
          filterable
          style="width: 160px"
          @change="onFilter"
        >
          <el-option
            v-for="c in filterCategories"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable style="width: 120px" @change="onFilter">
          <el-option label="draft" value="draft" />
          <el-option label="approved" value="approved" />
          <el-option label="disabled" value="disabled" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input v-model="filters.q" clearable placeholder="code/题干" style="width: 160px" @keyup.enter="onFilter" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onFilter">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" stripe empty-text="无题目">
      <el-table-column prop="code" label="code" width="140" show-overflow-tooltip />
      <el-table-column label="题型" width="80">
        <template #default="{ row }">{{ qtypeLabel(row.qtype) }}</template>
      </el-table-column>
      <el-table-column label="难度" width="72">
        <template #default="{ row }">{{ difficultyLabel(row.difficulty) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTag(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stem" label="题干" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button
            v-if="row.status === 'draft' || row.status === 'disabled'"
            link
            type="success"
            @click="setStatus(row, 'approved')"
          >
            批准
          </el-button>
          <el-button
            v-if="row.status === 'approved'"
            link
            type="warning"
            @click="setStatus(row, 'disabled')"
          >
            禁用
          </el-button>
          <el-button
            v-if="row.status === 'disabled'"
            link
            @click="setStatus(row, 'draft')"
          >
            重提审核
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="onPage"
      />
    </div>

    <el-dialog
      v-model="dialog"
      :title="form.id ? '编辑题目' : '新增题目'"
      width="780px"
      destroy-on-close
      top="4vh"
      :before-close="onEditDialogClose"
    >
      <el-form label-position="top">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="code" required>
              <el-input v-model="form.code" @input="touchContent" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题型" required>
              <el-select
                v-model="form.qtype"
                style="width: 100%"
                @change="
                  () => {
                    touchContent()
                    onQtypeChange()
                  }
                "
              >
                <el-option label="单选" value="single" />
                <el-option label="多选" value="multi" />
                <el-option label="判断" value="judge" />
                <el-option label="数值填空" value="numeric" />
                <el-option label="应用题" value="application" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专项" required>
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" required>
              <el-select v-model="form.categoryId" filterable style="width: 100%">
                <el-option
                  v-for="c in formCategories"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度">
              <el-radio-group v-model="form.difficulty" @change="touchContent">
                <el-radio-button :value="1">基础</el-radio-button>
                <el-radio-button :value="2">提高</el-radio-button>
                <el-radio-button :value="3">压轴</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题池">
              <el-radio-group v-model="form.pool">
                <el-radio-button value="formal">formal</el-radio-button>
                <el-radio-button value="test">test</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题干（支持 $公式$）" required>
          <el-input
            v-model="form.stem"
            type="textarea"
            :rows="3"
            @input="touchContent"
          />
          <div class="preview">
            <span class="lab">预览</span>
            <MathStem :text="form.stem" />
          </div>
        </el-form-item>

        <el-form-item v-if="form.id" label="题干插图">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="上传/删除/替换/调序会导致 content_version 升高；若已批准将退回 draft，须重新审核后再批准。"
            class="diag-alert"
          />
          <el-alert
            v-if="diagramMigrationPending"
            type="info"
            :closable="false"
            title="插图表尚未迁移（MIGRATION_PENDING），管理功能暂不可写。"
            class="diag-alert"
          />
          <div class="diag-toolbar">
            <el-upload
              :show-file-list="false"
              :disabled="diagramBusy || diagramMigrationPending"
              accept="image/png,image/webp,image/svg+xml"
              :http-request="onDiagramUpload"
            >
              <el-button size="small" type="primary" :loading="diagramBusy">
                上传插图
              </el-button>
            </el-upload>
            <el-button
              size="small"
              :disabled="diagramBusy || diagramLinks.length < 2"
              @click="onDiagramReorder"
            >
              按当前顺序保存
            </el-button>
          </div>
          <HsMathStemDiagrams
            v-if="diagramPreviewItems.length"
            :items="diagramPreviewItems"
          />
          <div v-for="(d, i) in diagramLinks" :key="d.linkId" class="diag-row">
            <span>#{{ d.sortOrder }} · {{ d.mimeType }} · {{ d.contentSha256.slice(0, 8) }}…</span>
            <el-button
              link
              size="small"
              :disabled="i === 0"
              @click="moveDiagram(i, -1)"
            >
              上移
            </el-button>
            <el-button
              link
              size="small"
              :disabled="i >= diagramLinks.length - 1"
              @click="moveDiagram(i, 1)"
            >
              下移
            </el-button>
            <el-upload
              :show-file-list="false"
              accept="image/png,image/webp,image/svg+xml"
              :disabled="diagramBusy"
              :http-request="makeDiagramReplaceRequest(d.linkId)"
            >
              <el-button link size="small" type="warning">替换</el-button>
            </el-upload>
            <el-button
              link
              size="small"
              type="danger"
              :disabled="diagramBusy"
              @click="onDiagramDelete(d.linkId)"
            >
              删除
            </el-button>
          </div>
        </el-form-item>

        <template v-if="form.qtype === 'single' || form.qtype === 'multi'">
          <el-form-item label="选项">
            <div v-for="(opt, i) in form.options" :key="i" class="opt-row">
              <el-input v-model="opt.id" placeholder="选项 ID" style="width: 100px" />
              <el-input v-model="opt.text" placeholder="选项文本" style="flex: 1" />
              <el-button link type="danger" @click="form.options.splice(i, 1)">删</el-button>
            </div>
            <el-button size="small" @click="addOption">加选项</el-button>
          </el-form-item>
          <el-form-item v-if="form.qtype === 'single'" label="正确答案 optionId" required>
            <el-select v-model="form.singleAnswer" style="width: 100%">
              <el-option
                v-for="o in form.options"
                :key="o.id"
                :label="o.id"
                :value="o.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="正确答案 optionIds" required>
            <el-select v-model="form.multiAnswer" multiple style="width: 100%">
              <el-option
                v-for="o in form.options"
                :key="o.id"
                :label="o.id"
                :value="o.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item v-if="form.qtype === 'judge'" label="判断答案" required>
          <el-radio-group v-model="form.judgeAnswer">
            <el-radio :value="true">正确 (true)</el-radio>
            <el-radio :value="false">错误 (false)</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.qtype === 'numeric'">
          <el-form-item label="标准值 value" required>
            <el-input v-model="form.numericValue" placeholder="如 2 或 1/2" />
          </el-form-item>
          <el-form-item label="绝对容差 toleranceAbs">
            <el-input-number v-model="form.toleranceAbs" :min="0" :step="0.01" />
          </el-form-item>
          <el-form-item label="相对容差 toleranceRel">
            <el-input-number v-model="form.toleranceRel" :min="0" :step="0.01" />
          </el-form-item>
        </template>

        <template v-if="form.qtype === 'application'">
          <el-form-item label="标准答案" required>
            <el-input
              v-model="form.appStandardAnswer"
              type="textarea"
              :rows="4"
              placeholder="完整参考解答"
              @input="touchContent"
            />
          </el-form-item>
          <el-form-item label="满分" required>
            <el-input-number
              v-model="form.appMaxScore"
              :min="1"
              :step="1"
              :precision="0"
              @change="touchContent"
            />
            <span class="rubric-sum" :class="{ ok: rubricSumOk, bad: !rubricSumOk }">
              评分项合计 {{ rubricSum }} / {{ form.appMaxScore }}
            </span>
          </el-form-item>
          <el-form-item label="评分标准 rubric" required>
            <div
              v-for="(r, i) in form.appRubric"
              :key="i"
              class="rubric-row"
            >
              <el-input
                v-model="r.key"
                placeholder="key"
                style="width: 110px"
                @input="touchContent"
              />
              <el-input
                v-model="r.title"
                placeholder="标题"
                style="width: 140px"
                @input="touchContent"
              />
              <el-input-number
                v-model="r.maxScore"
                :min="1"
                :step="1"
                :precision="0"
                @change="touchContent"
              />
              <el-input
                v-model="r.criteria"
                placeholder="评分要点"
                style="flex: 1"
                @input="touchContent"
              />
              <el-button
                link
                type="danger"
                :disabled="form.appRubric.length <= 1"
                @click="removeRubric(i)"
              >
                删
              </el-button>
            </div>
            <el-button size="small" @click="addRubric">加评分项</el-button>
            <p v-if="!rubricSumOk" class="rubric-warn">
              评分项分值合计必须等于满分，否则无法保存。
            </p>
          </el-form-item>
        </template>

        <el-form-item :label="form.qtype === 'application' ? '标准解析（必填）' : '解析'">
          <el-input
            v-model="form.analysis"
            type="textarea"
            :rows="2"
            @input="touchContent"
          />
          <div v-if="form.analysis" class="preview">
            <span class="lab">解析预览</span>
            <MathStem :text="form.analysis" />
          </div>
        </el-form-item>

        <el-form-item v-if="form.id" label="知识点关联（同章节）">
          <el-select
            v-model="form.kpIds"
            multiple
            filterable
            clearable
            style="width: 100%"
            placeholder="选择知识点"
            @change="onKpIdsChange"
          >
            <el-option
              v-for="k in specialtyKps"
              :key="k.id"
              :label="`${k.code} ${k.name}`"
              :value="k.id"
            />
          </el-select>
          <el-select
            v-model="form.primaryKpId"
            clearable
            filterable
            style="width: 100%; margin-top: 8px"
            placeholder="主知识点（有关联时必选）"
            :disabled="!form.kpIds.length"
          >
            <el-option
              v-for="k in selectedKpOptions"
              :key="k.id"
              :label="`${k.code} ${k.name}`"
              :value="k.id"
            />
          </el-select>
          <p class="kp-hint">
            保存题目后将同步关联。修改已批准题目的关联会回退为 draft。
          </p>
        </el-form-item>
        <el-alert
          v-else
          type="info"
          :closable="false"
          title="请先创建题目，再编辑以关联知识点。"
          style="margin-bottom: 12px"
        />

        <el-alert
          v-if="form.id && form.status"
          type="info"
          :closable="false"
          :title="`当前状态：${form.status} · content_version=${form.contentVersion}（不可在编辑里改 status；内容/关联变更可能回 draft 并使审核 STALE）`"
          style="margin-bottom: 12px"
        />

        <template v-if="form.id">
          <HsMathSourceMethodFields
            :model="metaForm"
            :method-options="allMethods"
            @change="metaDirty = true"
          />
          <el-alert
            v-if="metaDirty"
            type="warning"
            :closable="false"
            title="来源/方法有未保存修改。请点「保存来源与方法」；与题干保存相互独立，避免互相覆盖。"
            style="margin-bottom: 8px"
          />
        </template>
        <el-alert
          v-else
          type="info"
          :closable="false"
          title="新建题目后可再编辑来源与解题方法（走 content-meta 原子保存）。"
        />
      </el-form>
      <template #footer>
        <el-button @click="tryCloseEdit">取消</el-button>
        <el-button
          v-if="form.id"
          type="warning"
          plain
          :loading="savingMeta"
          @click="saveMeta"
        >
          保存来源与方法
        </el-button>
        <el-button type="primary" :loading="saving" @click="save">
          保存题干与答案
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MathStem from '@/components/hs-math/MathStem.vue'
import HsMathStemDiagrams from '@/components/hs-math/HsMathStemDiagrams.vue'
import HsMathSourceMethodFields, {
  type SourceMethodModel,
} from '@/components/hs-math/HsMathSourceMethodFields.vue'
import {
  adminHsMathItemDiagramContentUrl,
  createAdminHsMathTrainItem,
  deleteAdminHsMathItemDiagram,
  getAdminHsMathTrainItem,
  listAdminHsMathCategories,
  listAdminHsMathItemDiagrams,
  listAdminHsMathKnowledgePoints,
  listAdminHsMathMethods,
  listAdminHsMathSpecialties,
  listAdminHsMathTrainItems,
  patchAdminHsMathTrainItemStatus,
  putAdminHsMathTrainItemContentMeta,
  reorderAdminHsMathItemDiagrams,
  replaceAdminHsMathItemDiagram,
  replaceAdminHsMathTrainItemKnowledgePoints,
  updateAdminHsMathTrainItem,
  uploadAdminHsMathItemDiagram,
  type HsMathAdminCategory,
  type HsMathAdminDiagramLink,
  type HsMathAdminKnowledgePoint,
  type HsMathAdminMethod,
  type HsMathAdminSpecialty,
  type HsMathAdminTrainItem,
  type HsMathItemStatus,
} from '@/api/hs-math-admin'
import type {
  HsMathAnswerPayload,
  HsMathApplicationRubricItem,
  HsMathOptionItem,
  HsMathQtype,
} from '@/api/hs-math-train'
import { difficultyLabel, qtypeLabel } from '@/utils/hs-math-format'
import {
  adminWriteErrorHint,
  buildContentMetaBody,
  contentMetaChangeSummary,
  draftFromTrainItem,
  isConflictHttpError,
  normalizeSourceMethodDraft,
  validateSourceMethodDraft,
  type SourceMethodDraft,
} from '@/utils/hs-math-admin-meta'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const saving = ref(false)
const savingMeta = ref(false)
const dialog = ref(false)
const diagramBusy = ref(false)
const diagramMigrationPending = ref(false)
const diagramLinks = ref<HsMathAdminDiagramLink[]>([])
const diagramPreviewItems = computed(() =>
  diagramLinks.value.map((d) => ({
    key: d.linkId,
    contentPath: adminHsMathItemDiagramContentUrl(form.id, d.linkId),
    alt: d.altText,
  })),
)
const contentDirty = ref(false)
const metaDirty = ref(false)
/** 打开编辑时的来源/方法基线（用于无变化跳过与摘要） */
const metaBaseline = ref<SourceMethodDraft | null>(null)
const allMethods = ref<HsMathAdminMethod[]>([])
const rows = ref<HsMathAdminTrainItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const specialties = ref<HsMathAdminSpecialty[]>([])
const allCategories = ref<HsMathAdminCategory[]>([])
const filterCategories = ref<HsMathAdminCategory[]>([])
const formCategories = ref<HsMathAdminCategory[]>([])

const filters = reactive({
  specialtyId: undefined as string | undefined,
  categoryId: undefined as string | undefined,
  status: undefined as HsMathItemStatus | undefined,
  q: '',
})

const specialtyKps = ref<HsMathAdminKnowledgePoint[]>([])

const form = reactive({
  id: '',
  status: '' as string,
  contentVersion: 1,
  code: '',
  qtype: 'single' as HsMathQtype,
  specialtyId: '',
  categoryId: '',
  difficulty: 1 as 1 | 2 | 3,
  pool: 'formal' as 'formal' | 'test',
  stem: '',
  analysis: '',
  options: [] as HsMathOptionItem[],
  singleAnswer: '',
  multiAnswer: [] as string[],
  judgeAnswer: true as boolean,
  numericValue: '',
  toleranceAbs: 0,
  toleranceRel: 0,
  appStandardAnswer: '',
  appMaxScore: 10,
  appRubric: [
    {
      key: 'model',
      title: '建立数学模型',
      maxScore: 3,
      criteria: '正确建立函数关系',
    },
    {
      key: 'reasoning',
      title: '推导过程',
      maxScore: 3,
      criteria: '推导逻辑正确',
    },
    {
      key: 'calculation',
      title: '计算求解',
      maxScore: 2,
      criteria: '计算结果正确',
    },
    {
      key: 'conclusion',
      title: '最终结论',
      maxScore: 2,
      criteria: '结论完整且符合实际意义',
    },
  ] as HsMathApplicationRubricItem[],
  kpIds: [] as string[],
  primaryKpId: '' as string,
})

const rubricSum = computed(() =>
  form.appRubric.reduce((s, r) => s + (Number(r.maxScore) || 0), 0),
)
const rubricSumOk = computed(
  () => rubricSum.value === Number(form.appMaxScore),
)

function defaultAppRubric(): HsMathApplicationRubricItem[] {
  return [
    {
      key: 'model',
      title: '建立数学模型',
      maxScore: 3,
      criteria: '正确建立函数关系',
    },
    {
      key: 'reasoning',
      title: '推导过程',
      maxScore: 3,
      criteria: '推导逻辑正确',
    },
    {
      key: 'calculation',
      title: '计算求解',
      maxScore: 2,
      criteria: '计算结果正确',
    },
    {
      key: 'conclusion',
      title: '最终结论',
      maxScore: 2,
      criteria: '结论完整且符合实际意义',
    },
  ]
}

function addRubric() {
  form.appRubric.push({
    key: `step${form.appRubric.length + 1}`,
    title: '',
    maxScore: 1,
    criteria: '',
  })
  touchContent()
}

function removeRubric(i: number) {
  if (form.appRubric.length <= 1) return
  form.appRubric.splice(i, 1)
  touchContent()
}

const metaForm = reactive<SourceMethodModel>({
  sourceType: 'original',
  sourceYear: null,
  sourceExamName: '',
  sourceQuestionNo: '',
  sourceReference: '',
  sourceAdaptationNote: '',
  sourceVerificationStatus: 'unverified',
  sourceLicenseStatus: 'unknown',
  methodIds: [],
  primaryMethodId: '',
})

function resetMetaForm() {
  Object.assign(metaForm, {
    sourceType: 'original',
    sourceYear: null,
    sourceExamName: '',
    sourceQuestionNo: '',
    sourceReference: '',
    sourceAdaptationNote: '',
    sourceVerificationStatus: 'unverified',
    sourceLicenseStatus: 'unknown',
    methodIds: [],
    primaryMethodId: '',
  })
  metaBaseline.value = null
}

function touchContent() {
  contentDirty.value = true
}

function applyMetaFromDetail(detail: HsMathAdminTrainItem) {
  const draft = draftFromTrainItem(detail)
  Object.assign(metaForm, draft)
  metaBaseline.value = { ...draft, methodIds: [...draft.methodIds] }
  // 已关联但词典列表缺省的方法（如禁用）并入选项，便于展示
  const known = new Map(allMethods.value.map((m) => [m.id, m]))
  for (const m of detail.methods || []) {
    if (!known.has(m.id)) {
      allMethods.value = [
        ...allMethods.value,
        {
          id: m.id,
          code: m.code,
          name: m.name,
          summary: null,
          sortOrder: m.sortOrder,
          isActive: false,
          createdAt: '',
          updatedAt: '',
        },
      ]
    }
  }
}

const selectedKpOptions = computed(() =>
  specialtyKps.value.filter((k) => form.kpIds.includes(k.id)),
)

function onKpIdsChange() {
  touchContent()
  if (form.primaryKpId && !form.kpIds.includes(form.primaryKpId)) {
    form.primaryKpId = form.kpIds[0] || ''
  }
  if (!form.primaryKpId && form.kpIds.length === 1) {
    form.primaryKpId = form.kpIds[0]
  }
}

async function loadSpecialtyKps(specialtyId: string) {
  if (!specialtyId) {
    specialtyKps.value = []
    return
  }
  try {
    const res = await listAdminHsMathKnowledgePoints({
      specialtyId,
      isActive: true,
      page: 1,
      pageSize: 100,
      sortBy: 'sortOrder',
      sortDir: 'ASC',
    })
    specialtyKps.value = res.items
  } catch {
    specialtyKps.value = []
  }
}

function statusTag(s: string) {
  if (s === 'approved') return 'success'
  if (s === 'disabled') return 'info'
  return 'warning'
}

function addOption() {
  const n = form.options.length + 1
  form.options.push({ id: String.fromCharCode(64 + n), text: '' })
}

function onQtypeChange() {
  if (form.qtype === 'single' || form.qtype === 'multi') {
    if (!form.options.length) {
      form.options = [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
      ]
    }
  }
  if (form.qtype === 'application' && !form.appRubric.length) {
    form.appRubric = defaultAppRubric()
    form.appMaxScore = 10
  }
}

function onFilter() {
  page.value = 1
  void reload()
}

async function onSpecialtyFilter() {
  filters.categoryId = undefined
  filterCategories.value = filters.specialtyId
    ? allCategories.value.filter((c) => c.specialtyId === filters.specialtyId)
    : allCategories.value
  onFilter()
}

function onFormSpecialty() {
  form.categoryId = ''
  formCategories.value = allCategories.value.filter(
    (c) => c.specialtyId === form.specialtyId,
  )
  form.kpIds = []
  form.primaryKpId = ''
  void loadSpecialtyKps(form.specialtyId)
}

function onPage(p: number) {
  page.value = p
  void reload()
}

function openCreate() {
  Object.assign(form, {
    id: '',
    status: '',
    contentVersion: 1,
    code: '',
    qtype: 'single',
    specialtyId: specialties.value[0]?.id || '',
    categoryId: '',
    difficulty: 1,
    pool: 'formal',
    stem: '',
    analysis: '',
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
    ],
    singleAnswer: 'A',
    multiAnswer: [],
    judgeAnswer: true,
    numericValue: '',
    toleranceAbs: 0,
    toleranceRel: 0,
    appStandardAnswer: '',
    appMaxScore: 10,
    appRubric: defaultAppRubric(),
    kpIds: [],
    primaryKpId: '',
  })
  resetMetaForm()
  contentDirty.value = false
  metaDirty.value = false
  onFormSpecialty()
  dialog.value = true
}

async function loadDiagramsForItem(itemId: string) {
  diagramLinks.value = []
  diagramMigrationPending.value = false
  try {
    const r = await listAdminHsMathItemDiagrams(itemId)
    diagramLinks.value = r.diagrams || []
    diagramMigrationPending.value = !!r.migrationPending
    form.contentVersion = r.contentVersion || form.contentVersion
    form.status = r.status || form.status
  } catch (e) {
    ElMessage.warning(errMsg(e, '加载插图失败（表可能未迁移）'))
    diagramMigrationPending.value = true
  }
}

async function onDiagramUpload(opt: { file: File }) {
  if (!form.id) return
  diagramBusy.value = true
  try {
    const r = await uploadAdminHsMathItemDiagram(form.id, opt.file)
    diagramLinks.value = r.diagrams
    form.contentVersion = r.contentVersion
    form.status = r.status
    ElMessage.success(r.notice || '已上传')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '上传插图失败'))
  } finally {
    diagramBusy.value = false
  }
}

function makeDiagramReplaceRequest(linkId: string) {
  return (opt: { file: File }) => onDiagramReplace(linkId, opt)
}

async function onDiagramReplace(
  linkId: string,
  opt: { file: File },
) {
  if (!form.id) return
  diagramBusy.value = true
  try {
    const r = await replaceAdminHsMathItemDiagram(form.id, linkId, opt.file)
    diagramLinks.value = r.diagrams
    form.contentVersion = r.contentVersion
    form.status = r.status
    ElMessage.success(r.notice || '已替换')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '替换插图失败'))
  } finally {
    diagramBusy.value = false
  }
}

async function onDiagramDelete(linkId: string) {
  if (!form.id) return
  await ElMessageBox.confirm(
    '删除后将升版并可能退出正式池，确认？',
    '删除插图',
    { type: 'warning' },
  )
  diagramBusy.value = true
  try {
    const r = await deleteAdminHsMathItemDiagram(form.id, linkId)
    diagramLinks.value = r.diagrams
    form.contentVersion = r.contentVersion
    form.status = r.status
    ElMessage.success(r.notice || '已删除')
    await reload()
  } catch (e) {
    if (String((e as { message?: string })?.message || '').includes('cancel')) return
    ElMessage.error(errMsg(e, '删除插图失败'))
  } finally {
    diagramBusy.value = false
  }
}

function moveDiagram(index: number, delta: number) {
  const next = index + delta
  if (next < 0 || next >= diagramLinks.value.length) return
  const arr = [...diagramLinks.value]
  const t = arr[index]
  arr[index] = arr[next]
  arr[next] = t
  diagramLinks.value = arr.map((d, i) => ({ ...d, sortOrder: i + 1 }))
}

async function onDiagramReorder() {
  if (!form.id || diagramLinks.value.length < 2) return
  diagramBusy.value = true
  try {
    const r = await reorderAdminHsMathItemDiagrams(
      form.id,
      diagramLinks.value.map((d) => d.linkId),
    )
    diagramLinks.value = r.diagrams
    form.contentVersion = r.contentVersion
    form.status = r.status
    ElMessage.success(r.notice || '顺序已保存')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存插图顺序失败'))
  } finally {
    diagramBusy.value = false
  }
}

async function openEdit(row: HsMathAdminTrainItem) {
  form.id = row.id
  form.status = row.status
  form.contentVersion = row.contentVersion || 1
  form.code = row.code
  form.qtype = row.qtype
  form.specialtyId = row.specialtyId
  form.categoryId = row.categoryId
  form.difficulty = (row.difficulty as 1 | 2 | 3) || 1
  form.pool = row.pool
  form.stem = row.stem
  form.analysis = row.analysis || ''
  form.options = row.optionsJson?.options
    ? row.optionsJson.options.map((o) => ({ ...o }))
    : []
  const ans = row.answerPayloadJson
  form.singleAnswer = ans.kind === 'single' ? ans.optionId : ''
  form.multiAnswer = ans.kind === 'multi' ? [...ans.optionIds] : []
  form.judgeAnswer = ans.kind === 'judge' ? ans.value : true
  form.numericValue = ans.kind === 'numeric' ? ans.value : ''
  form.toleranceAbs =
    ans.kind === 'numeric' && ans.toleranceAbs != null ? ans.toleranceAbs : 0
  form.toleranceRel =
    ans.kind === 'numeric' && ans.toleranceRel != null ? ans.toleranceRel : 0
  if (ans.kind === 'application') {
    form.appStandardAnswer = ans.standardAnswer || ''
    form.appMaxScore = ans.maxScore || 10
    form.appRubric = (ans.rubric || []).map((r) => ({ ...r }))
    if (!form.appRubric.length) form.appRubric = defaultAppRubric()
  } else {
    form.appStandardAnswer = ''
    form.appMaxScore = 10
    form.appRubric = defaultAppRubric()
  }
  formCategories.value = allCategories.value.filter(
    (c) => c.specialtyId === form.specialtyId,
  )
  await loadDiagramsForItem(row.id)
  form.categoryId = row.categoryId
  form.kpIds = []
  form.primaryKpId = ''
  resetMetaForm()
  contentDirty.value = false
  metaDirty.value = false
  dialog.value = true
  await loadSpecialtyKps(row.specialtyId)
  try {
    const detail = await getAdminHsMathTrainItem(row.id)
    const kps = detail.knowledgePoints || []
    form.kpIds = kps.map((k) => k.id)
    form.primaryKpId = kps.find((k) => k.isPrimary)?.id || ''
    form.status = detail.status
    form.contentVersion = detail.contentVersion || 1
    applyMetaFromDetail(detail)
    metaDirty.value = false
  } catch (e) {
    ElMessage.error(errMsg(e, '加载题目详情失败'))
  }
}

async function tryCloseEdit() {
  if (contentDirty.value || metaDirty.value) {
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

function onEditDialogClose(done: () => void) {
  if (!contentDirty.value && !metaDirty.value) {
    done()
    return
  }
  ElMessageBox.confirm('有未保存修改，确认关闭？', '提示', { type: 'warning' })
    .then(() => done())
    .catch(() => undefined)
}

async function saveMeta() {
  if (!form.id) return
  if (contentDirty.value) {
    ElMessage.warning(
      '题干/答案有未保存修改。请先「保存题干与答案」或放弃后再保存来源与方法，以免版本交错。',
    )
    return
  }
  const invalid = validateSourceMethodDraft(metaForm)
  if (invalid) {
    ElMessage.warning(invalid)
    return
  }
  const baseline =
    metaBaseline.value ||
    normalizeSourceMethodDraft({
      sourceType: 'original',
      sourceYear: null,
      sourceExamName: '',
      sourceQuestionNo: '',
      sourceReference: '',
      sourceAdaptationNote: '',
      sourceVerificationStatus: 'unverified',
      sourceLicenseStatus: 'unknown',
      methodIds: [],
      primaryMethodId: '',
    })
  const body = buildContentMetaBody(
    baseline,
    metaForm,
    form.contentVersion,
  )
  if (!body) {
    ElMessage.info('来源与方法无变化，未发送请求')
    metaDirty.value = false
    return
  }
  const summary = contentMetaChangeSummary(baseline, metaForm)
  try {
    await ElMessageBox.confirm(
      `即将原子保存 content-meta（expectedVersion=${form.contentVersion}）：\n· ${summary.join('\n· ')}\n确认提交？`,
      '保存来源与方法',
      { type: 'info', confirmButtonText: '确认保存', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  savingMeta.value = true
  try {
    const updated = await putAdminHsMathTrainItemContentMeta(form.id, body)
    form.contentVersion = updated.contentVersion || form.contentVersion
    form.status = updated.status
    applyMetaFromDetail(updated)
    metaDirty.value = false
    ElMessage.success(
      `来源与方法已保存（content_version=${form.contentVersion}；审核可能变为 STALE）`,
    )
  } catch (e) {
    if (isConflictHttpError(e)) {
      ElMessage.error(adminWriteErrorHint(e, '版本冲突'))
      try {
        await ElMessageBox.confirm(
          '服务器题目内容版本已变更。是否重新加载详情？\n（当前未保存的来源/方法草稿将丢失）',
          '版本冲突',
          { type: 'warning', confirmButtonText: '重新加载', cancelButtonText: '保留草稿' },
        )
        const detail = await getAdminHsMathTrainItem(form.id)
        form.contentVersion = detail.contentVersion || 1
        form.status = detail.status
        applyMetaFromDetail(detail)
        metaDirty.value = false
      } catch {
        /* 保留草稿 */
      }
    } else {
      ElMessage.error(adminWriteErrorHint(e, errMsg(e, '保存来源与方法失败')))
    }
  } finally {
    savingMeta.value = false
  }
}

function buildAnswerPayload(): HsMathAnswerPayload | null {
  if (form.qtype === 'single') {
    if (!form.singleAnswer) return null
    return { kind: 'single', optionId: form.singleAnswer }
  }
  if (form.qtype === 'multi') {
    if (!form.multiAnswer.length) return null
    return { kind: 'multi', optionIds: [...new Set(form.multiAnswer)] }
  }
  if (form.qtype === 'judge') {
    return { kind: 'judge', value: form.judgeAnswer }
  }
  if (form.qtype === 'numeric') {
    if (!form.numericValue.trim()) return null
    const payload: HsMathAnswerPayload = {
      kind: 'numeric',
      value: form.numericValue.trim(),
    }
    if (form.toleranceAbs > 0) payload.toleranceAbs = form.toleranceAbs
    if (form.toleranceRel > 0) payload.toleranceRel = form.toleranceRel
    return payload
  }
  if (form.qtype === 'application') {
    if (!form.appStandardAnswer.trim()) return null
    if (!form.appRubric.length) return null
    return {
      kind: 'application',
      standardAnswer: form.appStandardAnswer.trim(),
      maxScore: Number(form.appMaxScore),
      rubric: form.appRubric.map((r) => ({
        key: String(r.key || '').trim(),
        title: String(r.title || '').trim(),
        maxScore: Number(r.maxScore),
        criteria: String(r.criteria || '').trim(),
      })),
    }
  }
  return null
}

async function save() {
  if (!form.code.trim() || !form.stem.trim() || !form.specialtyId || !form.categoryId) {
    ElMessage.warning('请填写 code、题干、专项与分类')
    return
  }
  const answerPayloadJson = buildAnswerPayload()
  if (!answerPayloadJson) {
    ElMessage.warning('请完善标准答案')
    return
  }
  if (form.qtype === 'single' || form.qtype === 'multi') {
    if (form.options.length < 2) {
      ElMessage.warning('选择题至少 2 个选项')
      return
    }
  }
  if (form.qtype === 'application') {
    if (!form.analysis.trim()) {
      ElMessage.warning('应用题标准解析不能为空')
      return
    }
    if (!rubricSumOk.value) {
      ElMessage.warning('评分项分值合计必须等于满分')
      return
    }
  }

  const body = {
    code: form.code.trim(),
    pool: form.pool,
    qtype: form.qtype,
    stem: form.stem,
    optionsJson:
      form.qtype === 'single' || form.qtype === 'multi'
        ? { options: form.options }
        : null,
    answerPayloadJson,
    analysis: form.analysis || null,
    difficulty: form.difficulty,
    specialtyId: form.specialtyId,
    categoryId: form.categoryId,
    ...(form.id ? { expectedContentVersion: form.contentVersion } : {}),
  }

  if (form.id && form.kpIds.length && !form.primaryKpId) {
    ElMessage.warning('有知识点关联时请指定主知识点')
    return
  }
  if (metaDirty.value) {
    ElMessage.warning('来源/方法有未保存修改，请先「保存来源与方法」或放弃修改后再保存题干')
    return
  }

  saving.value = true
  try {
    if (form.id) {
      let updated = await updateAdminHsMathTrainItem(form.id, body)
      form.contentVersion = updated.contentVersion || form.contentVersion
      updated = await replaceAdminHsMathTrainItemKnowledgePoints(form.id, {
        knowledgePointIds: [...form.kpIds],
        primaryKnowledgePointId: form.kpIds.length
          ? form.primaryKpId || null
          : null,
        expectedContentVersion: form.contentVersion,
      })
      form.contentVersion = updated.contentVersion || form.contentVersion
      const prevStatus = form.status
      form.status = updated.status
      contentDirty.value = false
      if (updated.status !== prevStatus) {
        ElMessage.warning(`已保存；状态变为 ${updated.status}`)
      } else {
        ElMessage.success(
          `题干/答案/知识点已保存（v${form.contentVersion}；不含来源方法）`,
        )
      }
    } else {
      await createAdminHsMathTrainItem(body)
      ElMessage.success('已创建（draft）；可再编辑来源、方法与知识点')
      dialog.value = false
      await reload()
    }
  } catch (e) {
    if (isConflictHttpError(e)) {
      ElMessage.error(adminWriteErrorHint(e, '版本冲突'))
    } else {
      ElMessage.error(adminWriteErrorHint(e, errMsg(e, '保存失败')))
    }
  } finally {
    saving.value = false
  }
}

async function setStatus(row: HsMathAdminTrainItem, status: HsMathItemStatus) {
  try {
    if (status === 'approved') {
      await ElMessageBox.confirm(
        `确认正式批准并发布「${row.code}」到学生训练池？\n须已完成当前版本人工审核通过；此操作不等于仅写审核记录。`,
        '正式批准确认',
        { type: 'warning', confirmButtonText: '确认批准', cancelButtonText: '取消' },
      )
      await patchAdminHsMathTrainItemStatus(row.id, status, {
        confirmPublish: true,
      })
    } else {
      await patchAdminHsMathTrainItemStatus(row.id, status)
    }
    ElMessage.success(`状态已更新为 ${status}`)
    await reload()
  } catch (e: unknown) {
    if (e === 'cancel') return
    ElMessage.error(errMsg(e, '更新状态失败'))
  }
}

async function reload() {
  loading.value = true
  try {
    const res = await listAdminHsMathTrainItems({
      page: page.value,
      pageSize,
      specialtyId: filters.specialtyId,
      categoryId: filters.categoryId,
      status: filters.status,
      q: filters.q || undefined,
    })
    rows.value = res.items
    total.value = res.total
  } catch (e) {
    rows.value = []
    total.value = 0
    ElMessage.error(errMsg(e, '加载题目失败'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    specialties.value = await listAdminHsMathSpecialties()
    allCategories.value = await listAdminHsMathCategories()
    filterCategories.value = allCategories.value
  } catch (e) {
    ElMessage.error(errMsg(e, '加载专项分类失败'))
  }
  try {
    const res = await listAdminHsMathMethods()
    allMethods.value = res.items || []
  } catch {
    allMethods.value = []
  }
  void reload()
})
</script>

<style scoped>
.diag-alert {
  margin-bottom: 8px;
}
.diag-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.diag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  margin-top: 6px;
}
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
.acts {
  display: flex;
  gap: 8px;
}
.filters {
  margin-bottom: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.opt-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.preview {
  margin-top: 8px;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.preview .lab {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.kp-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rubric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.rubric-sum {
  margin-left: 12px;
  font-size: 13px;
}
.rubric-sum.ok {
  color: var(--el-color-success);
}
.rubric-sum.bad {
  color: var(--el-color-danger);
}
.rubric-warn {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
