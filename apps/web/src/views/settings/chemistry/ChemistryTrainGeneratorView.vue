<template>
  <div class="page-fill gen-page" v-loading="loading">
    <div class="toolbar">
      <div>
        <h1>本地规则出题（阶段A）</h1>
        <p class="sub">
          仅写入 AI 试运行题池；须预览后确认；不会为凑数重复造题；不改知识审核状态。
        </p>
      </div>
      <el-button @click="reloadMeta">刷新状态</el-button>
    </div>

    <el-alert
      v-if="meta"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      :title="`当前题库 ${meta.counts.trainItemsTotal} 道 · 测试池可用 ${meta.counts.testActive} · 填充题仍激活 ${meta.counts.fillerActive}（确认时可停用）`"
    />

    <el-card shadow="never" class="mb">
      <template #header>生成条件</template>
      <el-form :inline="true" label-width="88px" class="filters">
        <el-form-item label="一级专项">
          <el-select
            v-model="form.specialtyCode"
            clearable
            placeholder="全部"
            style="width: 180px"
            @change="onSpecialtyChange"
          >
            <el-option
              v-for="s in meta?.specialties || []"
              :key="s.code"
              :label="s.name"
              :value="s.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="二级分类">
          <el-select
            v-model="form.categoryCode"
            clearable
            placeholder="全部"
            style="width: 200px"
          >
            <el-option
              v-for="c in filteredCategories"
              :key="c.code"
              :label="c.name"
              :value="c.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="知识类型">
          <el-select
            v-model="form.kbTypes"
            multiple
            collapse-tags
            clearable
            placeholder="默认全部"
            style="width: 260px"
          >
            <el-option
              v-for="t in meta?.kbTypes || []"
              :key="t"
              :label="kbTypeLabel(t)"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select
            v-model="form.qtypes"
            multiple
            collapse-tags
            clearable
            style="width: 200px"
          >
            <el-option label="判断" value="judge" />
            <el-option label="单选" value="single" />
            <el-option label="填空" value="blank" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select
            v-model="form.difficulties"
            multiple
            collapse-tags
            clearable
            style="width: 160px"
          >
            <el-option label="基础" :value="1" />
            <el-option label="提高" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标题量">
          <el-input-number
            v-model="form.targetCount"
            :min="1"
            :max="meta?.maxPerConfirm || 500"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="previewing" @click="onPreview">
            生成预览
          </el-button>
        </el-form-item>
      </el-form>
      <p class="hint">
        {{ meta?.note }}；上限 {{ meta?.maxPerConfirm || 500 }}。达不到目标时按实际候选写入。
      </p>
    </el-card>

    <el-row :gutter="16" v-if="utilization">
      <el-col :span="24">
        <el-card shadow="never" class="mb">
          <template #header>
            {{ utilization.whitelistTotal }} 白名单利用率（关联题）
          </template>
          <div class="util-grid">
            <div v-for="(v, k) in utilization.byType" :key="k" class="util-item">
              <strong>{{ kbTypeLabel(String(k)) }}</strong>
              <span>{{ v.used }} / {{ v.total }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <template v-if="preview">
      <el-card shadow="never" class="mb">
        <template #header>
          <div class="card-head">
            <span>
              预览候选 {{ preview.stats.candidateCount }} 道 · 跳过记录
              {{ preview.stats.skipCount }} · 过期
              {{ formatTime(preview.expiresAt) }}
            </span>
            <div class="actions">
              <el-checkbox v-model="deactivateFiller">
                确认时停用填充题（cov.*）
              </el-checkbox>
              <el-input-number
                v-model="confirmCount"
                :min="1"
                :max="preview.stats.candidateCount || 1"
                style="width: 140px; margin: 0 8px"
              />
              <el-button
                type="danger"
                :disabled="!preview.stats.candidateCount"
                :loading="confirming"
                @click="onConfirm"
              >
                确认写入试运行题池
              </el-button>
            </div>
          </div>
        </template>

        <el-descriptions :column="4" size="small" border class="mb">
          <el-descriptions-item
            v-for="(n, k) in preview.stats.byKbType"
            :key="'t' + k"
            :label="String(k)"
          >
            {{ n }}
          </el-descriptions-item>
          <el-descriptions-item
            v-for="(n, k) in preview.stats.byDifficulty"
            :key="'d' + k"
            :label="'难度' + k"
          >
            {{ n }}
          </el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="tab">
          <el-tab-pane
            :label="`候选题 (${preview.candidates.length})`"
            name="cand"
          >
            <el-table
              :data="preview.candidates"
              stripe
              height="420"
              empty-text="无候选（字段不足或均已去重）"
            >
              <el-table-column prop="sourceCode" label="来源" width="140" />
              <el-table-column prop="templateId" label="模板" width="150" />
              <el-table-column prop="qtype" label="题型" width="70" />
              <el-table-column prop="answerType" label="判题" width="110" />
              <el-table-column prop="difficulty" label="难度" width="60" />
              <el-table-column label="专项/分类" width="160">
                <template #default="{ row }">
                  {{ row.specialtyCode }}.{{ row.categoryCode }}
                </template>
              </el-table-column>
              <el-table-column prop="stem" label="题干" min-width="260" show-overflow-tooltip />
              <el-table-column prop="answer" label="答案" width="120" show-overflow-tooltip />
              <el-table-column label="选项" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.options?.length">{{ formatOptions(row.options) }}</span>
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane
            :label="`跳过原因 (${preview.skipped.length})`"
            name="skip"
          >
            <el-table :data="preview.skipped.slice(0, 500)" stripe height="420">
              <el-table-column prop="sourceCode" label="知识" width="160" />
              <el-table-column prop="templateId" label="模板" width="160" />
              <el-table-column prop="reason" label="原因" min-width="280" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-result
      v-if="lastResult"
      icon="success"
      title="写入完成"
      :sub-title="`新增 ${lastResult.inserted} · 已存在跳过 ${lastResult.skippedExisting} · 分类解析失败 ${lastResult.skippedResolve} · 停用填充题 ${lastResult.fillerDeactivated}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  confirmTrainGenerator,
  getTrainGeneratorMeta,
  getTrainGeneratorUtilization,
  previewTrainGenerator,
  type GenMeta,
  type GenPreviewResult,
} from '@/api/chemistry-train-generator'
import {
  CHEM_KB_TYPE_LABELS,
  type ChemKbType,
} from '@/api/chemistry-kb'
import errMsg from '@/utils/err-msg'

function kbTypeLabel(code: string) {
  return CHEM_KB_TYPE_LABELS[code as ChemKbType] || code
}

function formatOptions(options: Array<{ key?: string; text?: string }> | undefined) {
  if (!options?.length) return ''
  return options.map((o) => `${o.key ?? ''}.${o.text ?? ''}`).join('；')
}

const loading = ref(false)
const previewing = ref(false)
const confirming = ref(false)
const meta = ref<GenMeta | null>(null)
const utilization = ref<{
  whitelistTotal: number
  byType: Record<string, { total: number; used: number }>
} | null>(null)
const preview = ref<GenPreviewResult | null>(null)
const tab = ref('cand')
const deactivateFiller = ref(true)
const confirmCount = ref(100)
const lastResult = ref<{
  inserted: number
  skippedExisting: number
  skippedResolve: number
  fillerDeactivated: number
} | null>(null)

const form = reactive({
  specialtyCode: '' as string,
  categoryCode: '' as string,
  kbTypes: [] as string[],
  qtypes: [] as string[],
  difficulties: [1, 2] as number[],
  targetCount: 200,
})

const filteredCategories = computed(() => {
  if (!meta.value) return []
  if (!form.specialtyCode) return meta.value.categories
  const sp = meta.value.specialties.find((s) => s.code === form.specialtyCode)
  if (!sp) return []
  return meta.value.categories.filter((c) => String(c.specialtyId) === String(sp.id))
})

function onSpecialtyChange() {
  form.categoryCode = ''
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

async function reloadMeta() {
  loading.value = true
  try {
    meta.value = await getTrainGeneratorMeta()
    utilization.value = await getTrainGeneratorUtilization()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function onPreview() {
  previewing.value = true
  lastResult.value = null
  try {
    preview.value = await previewTrainGenerator({
      specialtyCode: form.specialtyCode || undefined,
      categoryCode: form.categoryCode || undefined,
      kbTypes: form.kbTypes.length ? (form.kbTypes as any) : undefined,
      qtypes: form.qtypes.length ? (form.qtypes as any) : undefined,
      difficulties: form.difficulties.length ? form.difficulties : undefined,
      targetCount: form.targetCount,
    })
    confirmCount.value = Math.min(
      form.targetCount,
      preview.value.stats.candidateCount || 1,
    )
    tab.value = 'cand'
    ElMessage.success(`预览完成：${preview.value.stats.candidateCount} 道候选`)
    utilization.value = await getTrainGeneratorUtilization()
  } catch (e) {
    ElMessage.error(errMsg(e, '预览失败'))
  } finally {
    previewing.value = false
  }
}

async function onConfirm() {
  if (!preview.value?.previewId) return
  try {
    await ElMessageBox.confirm(
      `确认将 ${confirmCount.value} 道候选写入 AI 试运行题池？此操作不会改知识正文/审核状态。`,
      '确认写入',
      { type: 'warning', confirmButtonText: '确认写入', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  confirming.value = true
  try {
    const res = await confirmTrainGenerator({
      previewId: preview.value.previewId,
      confirmCount: confirmCount.value,
      deactivateFiller: deactivateFiller.value,
    })
    lastResult.value = res
    preview.value = null
    ElMessage.success(`已写入 ${res.inserted} 道`)
    await reloadMeta()
  } catch (e) {
    ElMessage.error(errMsg(e, '写入失败'))
  } finally {
    confirming.value = false
  }
}

onMounted(reloadMeta)
</script>

<style scoped>
.gen-page {
  padding: 16px 20px 32px;
  overflow: auto;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
h1 {
  margin: 0;
  font-size: 20px;
}
.sub {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.mb {
  margin-bottom: 12px;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.util-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}
.util-item {
  display: flex;
  gap: 8px;
  min-width: 140px;
}
</style>
