<template>
  <div class="page-fill admin-kb" v-loading="loading">
    <div class="toolbar">
      <h1>化学知识库管理</h1>
      <div class="actions">
        <el-button @click="$router.push('/settings/chemistry-train-items')">
          训练题库
        </el-button>
        <el-button @click="$router.push('/settings/chemistry-generator')">
          本地出题器
        </el-button>
        <el-button v-if="tab !== 'import'" type="primary" @click="openCreate">新增</el-button>
      </div>
    </div>

    <el-tabs v-model="tab" class="kb-tabs" @tab-change="onTab">
      <el-tab-pane
        v-for="t in types"
        :key="t"
        :label="CHEM_KB_TYPE_LABELS[t]"
        :name="t"
      />
      <el-tab-pane label="JSON 导入" name="import" />
    </el-tabs>

    <template v-if="tab !== 'import'">
      <div class="list-panel">
        <div class="filters">
          <el-input
            v-model="q"
            clearable
            placeholder="搜索"
            style="width: 220px"
            @keyup.enter="reload"
            @clear="reload"
          />
          <el-select
            v-model="statusFilter"
            clearable
            placeholder="状态"
            style="width: 140px"
            @change="reload"
          >
            <el-option
              v-for="s in CHEM_KB_STATUSES"
              :key="s"
              :label="CHEM_KB_STATUS_LABELS[s]"
              :value="s"
            />
          </el-select>
          <el-button @click="reload">查询</el-button>
        </div>

        <div class="table-wrap">
          <el-table v-if="rows.length" :data="rows" stripe class="table">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="标题" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ rowTitle(row) }}</template>
            </el-table-column>
            <el-table-column label="状态" min-width="200">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTagType(row.status)">
                  {{ statusDisplay(row) }}
                </el-tag>
                <el-tag
                  v-if="isAiTrial(row)"
                  size="small"
                  type="warning"
                  effect="plain"
                  style="margin-left: 6px"
                >
                  AI初审通过 · 待人工复核 · 试运行
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                <el-button link type="primary" @click="openLinks(row)">关联</el-button>
                <el-dropdown trigger="click" @command="(c: string) => onStatus(row, c)">
                  <el-button link type="warning">审核</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="pending_review">提交审核</el-dropdown-item>
                      <el-dropdown-item command="published">发布</el-dropdown-item>
                      <el-dropdown-item command="rejected">驳回</el-dropdown-item>
                      <el-dropdown-item command="archived">归档</el-dropdown-item>
                      <el-dropdown-item command="draft">回草稿</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else-if="!loading" description="暂无数据" />
        </div>

        <div v-if="total > 0" class="pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            :page-sizes="[10, 20, 50]"
            v-model:page-size="pageSize"
            v-model:current-page="page"
            @current-change="reload"
            @size-change="onPageSizeChange"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="粘贴 JSON：{ items: [{ type, data }, ...] }。逐条校验，失败不阻断其他条目。导入默认草稿。"
        style="margin-bottom: 12px"
      />
      <el-input
        v-model="importText"
        type="textarea"
        :rows="14"
        placeholder='{"items":[{"type":"element","data":{"symbol":"K","nameZh":"钾","atomicNumber":19}}]}'
      />
      <div class="import-actions">
        <el-button type="primary" :loading="importing" @click="doImport">开始导入</el-button>
      </div>
      <el-table
        v-if="importResult"
        :data="importResult.results"
        size="small"
        style="margin-top: 12px"
      >
        <el-table-column prop="index" label="#" width="60" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.ok ? 'success' : 'danger'" size="small">
              {{ row.ok ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="错误" min-width="220">
          <template #default="{ row }">{{ (row.errors || []).join('；') }}</template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editVisible"
      :title="editId ? '编辑' : '新增'"
      width="640px"
      destroy-on-close
    >
      <el-form label-width="110px">
        <template v-if="activeType === 'element'">
          <el-form-item label="符号" required>
            <el-input v-model="form.symbol" />
          </el-form-item>
          <el-form-item label="中文名" required>
            <el-input v-model="form.nameZh" />
          </el-form-item>
          <el-form-item label="英文名">
            <el-input v-model="form.nameEn" />
          </el-form-item>
          <el-form-item label="原子序数" required>
            <el-input-number v-model="form.atomicNumber" :min="1" :max="118" />
          </el-form-item>
          <el-form-item label="相对原子质量">
            <el-input v-model="form.atomicMass" />
          </el-form-item>
          <el-form-item label="周期">
            <el-input-number v-model="form.periodNo" :min="1" :max="7" />
          </el-form-item>
          <el-form-item label="族">
            <el-input v-model="form.groupLabel" />
          </el-form-item>
          <el-form-item label="类别">
            <el-input v-model="form.category" />
          </el-form-item>
          <el-form-item label="常见化合价">
            <el-input v-model="form.commonValences" />
          </el-form-item>
          <el-form-item label="电子排布">
            <el-input v-model="form.electronConfig" />
          </el-form-item>
          <el-form-item label="重要性质">
            <el-input v-model="form.keyProperties" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'substance'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="化学式" required>
            <el-input v-model="form.canonicalFormula" />
          </el-form-item>
          <el-form-item label="俗称">
            <el-input v-model="form.commonNames" placeholder="逗号分隔" />
          </el-form-item>
          <el-form-item label="颜色/状态">
            <el-input v-model="form.color" style="width: 45%; margin-right: 8px" />
            <el-input v-model="form.stateLabel" style="width: 45%" />
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="form.tags" multiple style="width: 100%">
              <el-option
                v-for="t in substanceTags"
                :key="t"
                :label="t"
                :value="t"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="化学性质">
            <el-input v-model="form.chemicalProps" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="安全注意">
            <el-input v-model="form.safetyNotes" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'reaction'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="规范式" required>
            <el-input v-model="form.canonicalEquation" placeholder="2Na+2H2O=2NaOH+H2" />
          </el-form-item>
          <el-form-item label="展示方程式" required>
            <el-input v-model="form.equation" />
          </el-form-item>
          <el-form-item label="离子方程式">
            <el-input v-model="form.ionicEquation" />
          </el-form-item>
          <el-form-item label="条件">
            <el-input v-model="form.conditions" />
          </el-form-item>
          <el-form-item label="现象/原理">
            <el-input v-model="form.phenomenon" type="textarea" :rows="2" />
            <el-input
              v-model="form.principle"
              type="textarea"
              :rows="2"
              style="margin-top: 8px"
            />
          </el-form-item>
          <el-form-item label="氧化还原">
            <el-input v-model="form.oxidant" placeholder="氧化剂" style="width: 48%; margin-right: 4%" />
            <el-input v-model="form.reductant" placeholder="还原剂" style="width: 48%" />
          </el-form-item>
          <el-form-item label="已核实">
            <el-switch v-model="form.isVerified" />
            <span class="hint">未核实不可发布</span>
          </el-form-item>
          <el-form-item label="物种 JSON">
            <el-input
              v-model="speciesJson"
              type="textarea"
              :rows="5"
              placeholder='[{"role":"reactant","formula":"Na","coefficient":2,"stateSymbol":"s"}]'
            />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'experiment'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="分类">
            <el-input v-model="form.category" placeholder="property / gas_prep ..." />
          </el-form-item>
          <el-form-item label="危险实验">
            <el-switch v-model="form.isHazardous" />
          </el-form-item>
          <el-form-item label="目的">
            <el-input v-model="form.purpose" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="步骤">
            <el-input v-model="form.steps" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="现象/结论">
            <el-input v-model="form.phenomenon" type="textarea" :rows="2" />
            <el-input
              v-model="form.conclusion"
              type="textarea"
              :rows="2"
              style="margin-top: 8px"
            />
          </el-form-item>
          <el-form-item label="安全说明">
            <el-input v-model="form.safetyNotes" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'formula'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="表达式" required>
            <el-input v-model="form.expression" />
          </el-form-item>
          <el-form-item label="变量说明">
            <el-input v-model="form.variables" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="form.units" />
          </el-form-item>
          <el-form-item label="示例">
            <el-input v-model="form.examples" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'concept'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="定义">
            <el-input v-model="form.definition" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="原理">
            <el-input v-model="form.principle" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="判断方法">
            <el-input v-model="form.judgeMethods" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="例子">
            <el-input v-model="form.examples" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'knowledge'">
          <el-form-item label="名称" required>
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="说明">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="难度/重要度">
            <el-input-number v-model="form.difficulty" :min="1" :max="5" />
            <el-input-number
              v-model="form.importance"
              :min="1"
              :max="5"
              style="margin-left: 12px"
            />
          </el-form-item>
        </template>

        <template v-else-if="activeType === 'question'">
          <el-form-item label="题型" required>
            <el-select v-model="form.qtype" style="width: 100%">
              <el-option
                v-for="qt in questionTypes"
                :key="qt"
                :label="qt"
                :value="qt"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="题干" required>
            <el-input v-model="form.stem" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="答案" required>
            <el-input v-model="form.answer" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="解析">
            <el-input v-model="form.analysis" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="评分标准">
            <el-input v-model="form.scoring" type="textarea" :rows="2" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 关联弹窗 -->
    <el-dialog v-model="linksVisible" title="关联专项 / 知识跳转" width="560px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="关联专项">
          <el-select v-model="linkSpecialtyIds" multiple filterable style="width: 100%">
            <el-option
              v-for="s in specialties"
              :key="s.id"
              :label="s.name"
              :value="String(s.id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转链接 JSON">
          <el-input
            v-model="kbLinksJson"
            type="textarea"
            :rows="6"
            placeholder='[{"toType":"reaction","toId":"1","note":"典型反应"}]'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linksVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingLinks" @click="saveLinks">保存关联</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CHEM_KB_STATUS_LABELS,
  CHEM_KB_STATUSES,
  CHEM_KB_TYPE_LABELS,
  CHEM_KB_TYPES,
  adminCreateChemKb,
  adminGetChemKb,
  adminImportChemKb,
  adminListChemKb,
  adminSetChemKbLinks,
  adminSetChemKbStatus,
  adminUpdateChemKb,
  type ChemKbImportResult,
  type ChemKbStatus,
  type ChemKbType,
} from '@/api/chemistry-kb'
import { listChemSpecialties, type ChemSpecialtySummary } from '@/api/chemistry'
import errMsg from '@/utils/err-msg'

const types = [...CHEM_KB_TYPES]
const substanceTags = [
  'elemental',
  'oxide',
  'acid',
  'base',
  'salt',
  'organic',
  'other',
]
const questionTypes = [
  'single',
  'multi',
  'judge',
  'blank',
  'equation',
  'ionic',
  'calc',
  'experiment',
  'short',
  'inference',
  'image',
]

const tab = ref<string>('element')
const activeType = computed(() =>
  tab.value === 'import' ? 'element' : (tab.value as ChemKbType),
)
const loading = ref(false)
const rows = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const q = ref('')
const statusFilter = ref<string | undefined>()

function onPageSizeChange() {
  page.value = 1
  void reload()
}

const editVisible = ref(false)
const editId = ref<string | null>(null)
const saving = ref(false)
const form = reactive<Record<string, any>>({})
const speciesJson = ref('[]')

const linksVisible = ref(false)
const linkTargetId = ref('')
const linkSpecialtyIds = ref<string[]>([])
const kbLinksJson = ref('[]')
const savingLinks = ref(false)
const specialties = ref<ChemSpecialtySummary[]>([])

const importText = ref('')
const importing = ref(false)
const importResult = ref<ChemKbImportResult | null>(null)

function rowTitle(row: Record<string, any>) {
  if (activeType.value === 'element') return `${row.nameZh} (${row.symbol})`
  if (activeType.value === 'question') return String(row.stem || '').slice(0, 40)
  return row.name || row.expression || row.id
}

function isAiTrial(row: Record<string, any>) {
  const note = String(row.reviewNote || row.review_note || '')
  return note.includes('[ai_trial]') || note.includes('[trial_run]')
}

function statusDisplay(row: Record<string, any>) {
  if (isAiTrial(row) && row.status === 'published') {
    return '试用发布（非人审通过）'
  }
  return CHEM_KB_STATUS_LABELS[row.status as ChemKbStatus] || row.status
}

function statusTagType(st: string) {
  if (st === 'published') return 'success'
  if (st === 'rejected') return 'danger'
  if (st === 'pending_review') return 'warning'
  if (st === 'archived') return 'info'
  return ''
}

function resetForm() {
  Object.keys(form).forEach((k) => delete form[k])
  speciesJson.value = '[]'
  if (activeType.value === 'element') {
    Object.assign(form, {
      symbol: '',
      nameZh: '',
      nameEn: '',
      atomicNumber: 1,
      atomicMass: '',
      periodNo: null,
      groupLabel: '',
      category: '',
      commonValences: '',
      electronConfig: '',
      keyProperties: '',
    })
  } else if (activeType.value === 'substance') {
    Object.assign(form, {
      name: '',
      canonicalFormula: '',
      commonNames: '',
      color: '',
      stateLabel: '',
      tags: [],
      chemicalProps: '',
      safetyNotes: '',
    })
  } else if (activeType.value === 'reaction') {
    Object.assign(form, {
      name: '',
      canonicalEquation: '',
      equation: '',
      ionicEquation: '',
      conditions: '',
      phenomenon: '',
      principle: '',
      oxidant: '',
      reductant: '',
      isVerified: false,
    })
  } else if (activeType.value === 'experiment') {
    Object.assign(form, {
      name: '',
      category: 'other',
      isHazardous: false,
      purpose: '',
      steps: '',
      phenomenon: '',
      conclusion: '',
      safetyNotes: '',
    })
  } else if (activeType.value === 'formula') {
    Object.assign(form, {
      name: '',
      expression: '',
      variables: '',
      units: '',
      examples: '',
    })
  } else if (activeType.value === 'concept') {
    Object.assign(form, {
      name: '',
      definition: '',
      principle: '',
      judgeMethods: '',
      examples: '',
    })
  } else if (activeType.value === 'knowledge') {
    Object.assign(form, {
      name: '',
      description: '',
      difficulty: 2,
      importance: 3,
    })
  } else if (activeType.value === 'question') {
    Object.assign(form, {
      qtype: 'single',
      stem: '',
      answer: '',
      analysis: '',
      scoring: '',
    })
  }
}

function openCreate() {
  editId.value = null
  resetForm()
  editVisible.value = true
}

async function openEdit(row: Record<string, any>) {
  editId.value = String(row.id)
  resetForm()
  editVisible.value = true
  try {
    const d = await adminGetChemKb(activeType.value, String(row.id))
    Object.assign(form, d)
    if (activeType.value === 'substance') {
      form.tags = Array.isArray(d.tags)
        ? (d.tags as any[]).map((t) => (typeof t === 'string' ? t : t.tag))
        : []
    }
    if (activeType.value === 'reaction') {
      speciesJson.value = JSON.stringify(d.species || [], null, 2)
    }
  } catch (e) {
    Object.assign(form, row)
    ElMessage.error(errMsg(e, '加载详情失败，已使用列表数据'))
  }
}

async function saveForm() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { ...form }
    if (activeType.value === 'reaction') {
      try {
        body.species = JSON.parse(speciesJson.value || '[]')
      } catch {
        ElMessage.error('物种 JSON 格式错误')
        return
      }
    }
    if (editId.value) {
      await adminUpdateChemKb(activeType.value, editId.value, body)
      ElMessage.success('已更新')
    } else {
      await adminCreateChemKb(activeType.value, body)
      ElMessage.success('已创建')
    }
    editVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function onStatus(row: Record<string, any>, status: string) {
  try {
    let reviewNote: string | undefined
    if (status === 'rejected') {
      const { value } = await ElMessageBox.prompt('驳回原因', '驳回', {
        inputPlaceholder: '可选',
      })
      reviewNote = value
    }
    await adminSetChemKbStatus(activeType.value, String(row.id), {
      status: status as ChemKbStatus,
      reviewNote,
    })
    ElMessage.success('状态已更新')
    await reload()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error(errMsg(e, '更新状态失败'))
  }
}

function openLinks(row: Record<string, any>) {
  linkTargetId.value = String(row.id)
  linkSpecialtyIds.value = (row.specialtyIds || []).map(String)
  kbLinksJson.value = JSON.stringify(row.kbLinks || [], null, 2)
  linksVisible.value = true
  void (async () => {
    try {
      const d = await adminGetChemKb(activeType.value, String(row.id))
      linkSpecialtyIds.value = ((d.specialtyIds as string[]) || []).map(String)
      kbLinksJson.value = JSON.stringify(d.kbLinks || [], null, 2)
    } catch {
      /* keep list data */
    }
  })()
}

async function saveLinks() {
  savingLinks.value = true
  try {
    let kbLinks: unknown[] = []
    try {
      kbLinks = JSON.parse(kbLinksJson.value || '[]')
    } catch {
      ElMessage.error('跳转链接 JSON 格式错误')
      return
    }
    await adminSetChemKbLinks(activeType.value, linkTargetId.value, {
      specialtyIds: linkSpecialtyIds.value,
      kbLinks,
    })
    ElMessage.success('关联已保存')
    linksVisible.value = false
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存关联失败'))
  } finally {
    savingLinks.value = false
  }
}

async function doImport() {
  importing.value = true
  importResult.value = null
  try {
    const parsed = JSON.parse(importText.value)
    const items = Array.isArray(parsed?.items) ? parsed.items : null
    if (!items) {
      ElMessage.error('JSON 需包含 items 数组')
      return
    }
    importResult.value = await adminImportChemKb(items)
    ElMessage.success(
      `导入完成：成功 ${importResult.value.successCount}，失败 ${importResult.value.failCount}`,
    )
  } catch (e) {
    ElMessage.error(errMsg(e, '导入失败（请检查 JSON）'))
  } finally {
    importing.value = false
  }
}

async function reload() {
  if (tab.value === 'import') return
  loading.value = true
  try {
    const res = await adminListChemKb(activeType.value, {
      page: page.value,
      pageSize: pageSize.value,
      q: q.value.trim() || undefined,
      status: statusFilter.value || undefined,
    })
    rows.value = res.items
    total.value = res.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

function onTab() {
  page.value = 1
  void reload()
}

onMounted(async () => {
  try {
    specialties.value = await listChemSpecialties()
  } catch {
    specialties.value = []
  }
  void reload()
})
</script>

<style scoped>
.admin-kb {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
.kb-tabs {
  flex-shrink: 0;
}
.list-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
/* 区域固定高度 + 内部滚动，避免再被内容撑高后裁切无滚动条 */
.table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(100vh - 280px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--app-border, #30363d);
  border-radius: 6px;
}
.table {
  width: 100%;
}
.pager {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  padding: 12px 0 4px;
}
.import-actions {
  margin-top: 10px;
}
.hint {
  margin-left: 8px;
  font-size: 12px;
  opacity: 0.65;
}
</style>
