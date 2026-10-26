<template>
  <div class="review-page" v-loading="loadingQueue">
    <header class="head">
      <div>
        <h1>高一数学 · 题目人工审核</h1>
        <p class="sub">
          人工审核与正式发布分离。passed 只写审核记录，不会进入学生训练池。仅 ADMIN。
        </p>
      </div>
      <div class="acts">
        <el-button @click="$router.push({ name: 'settings-hs-math-train-items' })">
          题库管理
        </el-button>
        <el-button @click="reloadQueue">刷新队列</el-button>
      </div>
    </header>

    <div class="layout">
      <aside class="queue">
        <el-form :inline="false" class="filters" label-width="64px" size="small">
          <el-form-item label="章节">
            <el-select
              v-model="filters.specialtyId"
              clearable
              filterable
              @change="onSpecialtyChange"
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
            <el-select v-model="filters.categoryId" clearable filterable @change="onFilter">
              <el-option
                v-for="c in filterCategories"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="题型">
            <el-select v-model="filters.qtype" clearable @change="onFilter">
              <el-option label="单选" value="single" />
              <el-option label="多选" value="multi" />
              <el-option label="判断" value="judge" />
              <el-option label="填空" value="numeric" />
              <el-option label="应用题" value="application" />
            </el-select>
          </el-form-item>
          <el-form-item label="难度">
            <el-select v-model="filters.difficulty" clearable @change="onFilter">
              <el-option label="基础" :value="1" />
              <el-option label="提高" :value="2" />
              <el-option label="压轴" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="题状态">
            <el-select v-model="filters.status" @change="onFilter">
              <el-option label="draft" value="draft" />
              <el-option label="approved" value="approved" />
              <el-option label="disabled" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="审核态">
            <el-select v-model="filters.reviewStatus" clearable @change="onFilter">
              <el-option label="未审" value="none" />
              <el-option label="passed" value="passed" />
              <el-option label="rejected" value="rejected" />
              <el-option label="deferred" value="deferred" />
              <el-option label="STALE" value="stale" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              clearable
              maxlength="64"
              placeholder="code/题干"
              @keyup.enter="onFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onFilter">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table
          :data="queue"
          stripe
          size="small"
          highlight-current-row
          empty-text="无待审题目"
          class="q-table"
          @row-click="onSelectRow"
        >
          <el-table-column prop="code" label="code" width="150" show-overflow-tooltip />
          <el-table-column label="摘要" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ row.stemSummary }}</template>
          </el-table-column>
          <el-table-column label="审核" width="88">
            <template #default="{ row }">
              <el-tag size="small" :type="reviewTag(row.currentReviewStatus)">
                {{ row.currentReviewStatus }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            small
            layout="prev, pager, next, total"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            @current-change="onPage"
          />
        </div>
      </aside>

      <section class="panel" v-loading="loadingPanel">
        <el-empty v-if="!panel" description="请从左侧选择题目" />
        <template v-else>
          <div class="meta">
            <div class="title-row">
              <h2>{{ panel.code }}</h2>
              <el-tag size="small">{{ panel.status }}</el-tag>
              <el-tag size="small" type="info">v{{ panel.contentVersion }}</el-tag>
              <el-tag size="small" :type="reviewTag(panel.currentReviewStatus)">
                {{ panel.currentReviewStatus }}
              </el-tag>
            </div>
            <p class="meta-line">
              {{ panel.specialty?.name || '—' }} /
              {{ panel.category?.name || '—' }} ·
              {{ qtypeLabel(panel.qtype) }} · {{ difficultyLabel(panel.difficulty) }}
            </p>
            <p class="meta-line muted">
              当前登录：{{ meLabel }} · 指纹
              {{ panel.contentFingerprint.slice(0, 12) }}…
            </p>
            <el-alert
              v-if="hasDevMathReviewNote(panel.code)"
              type="warning"
              :closable="false"
              show-icon
              :title="DEV_MATH_REVIEW_NOTE_LABEL"
              class="dev-note"
            />
            <el-alert
              v-if="panel.reviewIsStale"
              type="error"
              :closable="false"
              show-icon
              title="当前版本审核已失效（STALE），须重新人工审核后才能发布"
              class="dev-note"
            />
          </div>

          <div class="block">
            <div class="lab">题干</div>
            <MathStem :text="panel.stem" />
          </div>
          <div v-if="diagramPreviewItems.length" class="block">
            <div class="lab">题干插图</div>
            <HsMathStemDiagrams :items="diagramPreviewItems" />
            <p class="meta-line muted">只读预览；上传/替换请前往题库管理。</p>
          </div>
          <div
            v-if="panel.optionsJson?.options?.length"
            class="block"
          >
            <div class="lab">选项</div>
            <MathOptionList
              :mode="panel.qtype === 'multi' ? 'multi' : 'single'"
              :options="panel.optionsJson.options"
              :model-value="null"
              disabled
            />
          </div>
          <div class="block">
            <div class="lab">标准答案</div>
            <MathStem
              :text="
                formatAnswerDisplay(
                  panel.qtype,
                  panel.answerPayloadJson,
                  panel.optionsJson?.options,
                )
              "
            />
          </div>
          <div v-if="panel.analysis" class="block">
            <div class="lab">解析</div>
            <MathStem :text="panel.analysis" />
          </div>
          <div v-if="panel.knowledgePoints?.length" class="block">
            <div class="lab">知识点</div>
            <div class="kp-tags">
              <el-tag
                v-for="kp in panel.knowledgePoints"
                :key="kp.id"
                size="small"
                :type="kp.isPrimary ? 'primary' : 'info'"
                effect="plain"
              >
                {{ kp.code }} {{ kp.name }}
                <span v-if="kp.isPrimary"> · 主</span>
              </el-tag>
            </div>
          </div>

          <el-alert
            v-if="metaMerge && !metaMerge.ok"
            type="error"
            :closable="false"
            show-icon
            :title="metaMerge.message"
            class="dev-note"
          />
          <div v-if="metaMerge && !metaMerge.ok" class="btn-row">
            <el-button type="primary" @click="reloadSelected">刷新一致数据</el-button>
          </div>

          <div class="block">
            <div class="lab">来源类型 / 许可 / 核实</div>
            <template v-if="mergedDetail">
              <p class="meta-line">
                {{ sourceTypeLabel(mergedDetail.sourceType) }}
                · {{ sourceVerificationLabel(mergedDetail.sourceVerificationStatus) }}
                · {{ sourceLicenseLabel(mergedDetail.sourceLicenseStatus) }}
              </p>
              <el-alert
                v-if="isDefaultSourceCompat(mergedDetail)"
                type="warning"
                :closable="false"
                show-icon
                title="默认兼容来源（原创 + 未核实 + 许可未知）≠ 已核实原创"
                class="dev-note"
              />
              <el-alert
                v-else-if="sourceRiskHint"
                type="warning"
                :closable="false"
                show-icon
                :title="sourceRiskHint"
                class="dev-note"
              />
              <p class="meta-line muted">
                年份 {{ mergedDetail.sourceYear ?? '—' }} ·
                试卷 {{ mergedDetail.sourceExamName || '—' }} ·
                题号 {{ mergedDetail.sourceQuestionNo || '—' }}
              </p>
              <p v-if="mergedDetail.sourceReference" class="meta-line muted">
                出处：{{ mergedDetail.sourceReference }}
              </p>
              <p v-if="mergedDetail.sourceAdaptationNote" class="meta-line muted">
                改编说明：{{ mergedDetail.sourceAdaptationNote }}
              </p>
            </template>
            <p v-else class="meta-line muted">
              {{
                metaMerge && !metaMerge.ok
                  ? '版本未对齐，已隐藏来源（避免混合版本）'
                  : '来源信息加载中或不可用'
              }}
            </p>
          </div>

          <div class="block">
            <div class="lab">主要解题方法</div>
            <template v-if="mergedDetail">
              <div v-if="methodSplit.primary" class="kp-tags">
                <el-tag size="small" type="primary" effect="plain">
                  {{ methodSplit.primary.code }} {{ methodSplit.primary.name }} · 主
                </el-tag>
              </div>
              <p v-else class="meta-line muted">无主方法</p>
              <div class="lab" style="margin-top: 8px">辅助解题方法</div>
              <div v-if="methodSplit.aux.length" class="kp-tags">
                <el-tag
                  v-for="m in methodSplit.aux"
                  :key="m.id"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ m.code }} {{ m.name }}
                </el-tag>
              </div>
              <p v-else class="meta-line muted">无辅助方法</p>
            </template>
            <p v-else class="meta-line muted">
              {{
                metaMerge && !metaMerge.ok
                  ? '版本未对齐，已隐藏方法关联'
                  : '未关联方法（允许为空）'
              }}
            </p>
          </div>

          <el-card class="ops" shadow="never">
            <template #header>
              <span>人工审核（不改题目 status）</span>
            </template>
            <el-alert
              type="info"
              :closable="false"
              show-icon
              title="人工审核通过不会立即进入学生训练池，仍需执行正式批准发布。"
              class="mb"
            />
            <el-input
              v-model="comment"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
              placeholder="必填审核意见"
              :disabled="!panel.canSubmitReview || submitting || reviewActionsBlocked"
            />
            <div class="btn-row">
              <el-button
                type="success"
                :disabled="!panel.canSubmitReview || reviewActionsBlocked"
                :loading="submitting"
                @click="submitDecision('passed')"
              >
                审核通过
              </el-button>
              <el-button
                type="danger"
                :disabled="!panel.canSubmitReview || reviewActionsBlocked"
                :loading="submitting"
                @click="submitDecision('rejected')"
              >
                退回修改
              </el-button>
              <el-button
                :disabled="!panel.canSubmitReview || reviewActionsBlocked"
                :loading="submitting"
                @click="submitDecision('deferred')"
              >
                暂缓审核
              </el-button>
            </div>
            <p v-if="reviewActionsBlocked" class="warn">
              panel 与详情版本不一致，已禁止提交审核；请先刷新。
            </p>
            <p v-if="panel.submitBlockReasons?.length" class="warn">
              {{ panel.submitBlockReasons.join('；') }}
            </p>
          </el-card>

          <el-card class="ops publish" shadow="never">
            <template #header>
              <span>正式批准发布（独立操作）</span>
            </template>
            <p class="muted">
              仅当当前版本人工审核 passed 且质量门禁通过时可用。前端 canPublish 仅为提示，后端将重新校验。
            </p>
            <ul v-if="panel.publishBlockReasons?.length" class="reasons">
              <li v-for="(r, i) in panel.publishBlockReasons" :key="i">{{ r }}</li>
            </ul>
            <el-button
              type="warning"
              :disabled="!panel.canPublish || publishing || reviewActionsBlocked"
              :loading="publishing"
              @click="doPublish"
            >
              正式批准发布
            </el-button>
          </el-card>

          <div class="block">
            <div class="lab">审核历史</div>
            <el-timeline v-if="panel.reviewHistory.length">
              <el-timeline-item
                v-for="h in panel.reviewHistory"
                :key="h.id"
                :timestamp="h.reviewedAt"
                placement="top"
              >
                <div>
                  <el-tag size="small" :type="reviewTag(String(h.reviewStatus))">
                    {{ h.reviewStatus }}
                  </el-tag>
                  <el-tag v-if="h.isStale" size="small" type="danger" class="ml">
                    已失效
                  </el-tag>
                  <span class="ml">
                    {{ h.reviewerDisplayName }} · v{{ h.contentVersion }}
                  </span>
                </div>
                <p class="hist-c">{{ h.reviewComment }}</p>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="尚无审核记录" :image-size="64" />
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MathOptionList from '@/components/hs-math/MathOptionList.vue'
import MathStem from '@/components/hs-math/MathStem.vue'
import HsMathStemDiagrams from '@/components/hs-math/HsMathStemDiagrams.vue'
import {
  adminHsMathItemDiagramContentUrl,
  fetchReviewPanel,
  fetchReviewQueue,
  getAdminHsMathTrainItem,
  listAdminHsMathCategories,
  listAdminHsMathItemDiagrams,
  listAdminHsMathSpecialties,
  publishReviewedTrainItem,
  submitTrainItemReview,
  type HsMathAdminCategory,
  type HsMathAdminDiagramLink,
  type HsMathAdminSpecialty,
  type HsMathAdminTrainItem,
  type HsMathQueueReviewStatus,
  type HsMathReviewDecision,
  type HsMathReviewPanel,
  type HsMathReviewQueueItem,
  type HsMathItemStatus,
} from '@/api/hs-math-admin'
import type { HsMathQtype } from '@/api/hs-math-train'
import { fetchMe } from '@/api/auth'
import {
  difficultyLabel,
  formatAnswerDisplay,
  isDefaultSourceCompat,
  qtypeLabel,
  sourceLicenseLabel,
  sourceLicenseRiskHint,
  sourceTypeLabel,
  sourceVerificationLabel,
} from '@/utils/hs-math-format'
import {
  DEV_MATH_REVIEW_NOTE_LABEL,
  hasDevMathReviewNote,
} from '@/utils/hs-math-review-issue-flags'
import {
  canActOnReviewMerge,
  mergeReviewPanelWithDetail,
  splitPrimaryAuxMethods,
  type ReviewMetaMerge,
} from '@/utils/hs-math-admin-meta'
import errMsg from '@/utils/err-msg'

const specialties = ref<HsMathAdminSpecialty[]>([])
const categories = ref<HsMathAdminCategory[]>([])
const filters = ref<{
  specialtyId?: string
  categoryId?: string
  qtype?: HsMathQtype
  difficulty?: number
  status: HsMathItemStatus
  reviewStatus?: HsMathQueueReviewStatus
  keyword: string
}>({
  status: 'draft',
  keyword: '',
})

const queue = ref<HsMathReviewQueueItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loadingQueue = ref(false)
const loadingPanel = ref(false)
const panel = ref<HsMathReviewPanel | null>(null)
/** 审核面板不含来源/方法；并行拉 getById 只读展示 */
const itemDetail = ref<HsMathAdminTrainItem | null>(null)
/** 题干插图只读；与题库共用 list + content URL，审核页不做上传 */
const diagramLinks = ref<HsMathAdminDiagramLink[]>([])
const selectedId = ref<string | null>(null)
const comment = ref('')
const submitting = ref(false)
const publishing = ref(false)
const meLabel = ref('—')

const diagramPreviewItems = computed(() => {
  const id = selectedId.value
  if (!id) return []
  return diagramLinks.value.map((d) => ({
    key: d.linkId,
    contentPath: adminHsMathItemDiagramContentUrl(id, d.linkId),
    alt: d.altText,
  }))
})

const filterCategories = computed(() => {
  const sid = filters.value.specialtyId
  if (!sid) return categories.value
  return categories.value.filter((c) => c.specialtyId === sid)
})

const metaMerge = computed<ReviewMetaMerge | null>(() => {
  if (!panel.value) return null
  return mergeReviewPanelWithDetail(panel.value, itemDetail.value)
})

const mergedDetail = computed(() =>
  metaMerge.value && metaMerge.value.ok ? metaMerge.value.detail : null,
)

const methodSplit = computed(() =>
  splitPrimaryAuxMethods(mergedDetail.value?.methods),
)

const sourceRiskHint = computed(() =>
  mergedDetail.value ? sourceLicenseRiskHint(mergedDetail.value) : null,
)

const reviewActionsBlocked = computed(
  () => !!(metaMerge.value && !canActOnReviewMerge(metaMerge.value)),
)

function reviewTag(s: string) {
  if (s === 'passed') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'deferred') return 'warning'
  if (s === 'stale') return 'danger'
  return 'info'
}

function isConflictError(e: unknown): boolean {
  const any = e as { response?: { status?: number }; status?: number }
  return any?.response?.status === 409 || any?.status === 409
}

async function reloadQueue() {
  loadingQueue.value = true
  try {
    const res = await fetchReviewQueue({
      page: page.value,
      pageSize,
      specialtyId: filters.value.specialtyId,
      categoryId: filters.value.categoryId,
      qtype: filters.value.qtype,
      difficulty: filters.value.difficulty,
      status: filters.value.status,
      reviewStatus: filters.value.reviewStatus,
      keyword: filters.value.keyword || undefined,
    })
    queue.value = res.items
    total.value = res.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载审核队列失败'))
  } finally {
    loadingQueue.value = false
  }
}

async function loadPanel(id: string) {
  selectedId.value = id
  loadingPanel.value = true
  itemDetail.value = null
  diagramLinks.value = []
  try {
    const [p, detail, diagramsRes] = await Promise.all([
      fetchReviewPanel(id),
      getAdminHsMathTrainItem(id).catch(() => null),
      listAdminHsMathItemDiagrams(id).catch(() => null),
    ])
    panel.value = p
    itemDetail.value = detail
    diagramLinks.value = diagramsRes?.diagrams?.length
      ? [...diagramsRes.diagrams].sort((a, b) => a.sortOrder - b.sortOrder)
      : []
    comment.value = ''
    const merge = mergeReviewPanelWithDetail(p, detail)
    if (!merge.ok) {
      ElMessage.warning(merge.message)
    }
  } catch (e) {
    panel.value = null
    itemDetail.value = null
    diagramLinks.value = []
    ElMessage.error(errMsg(e, '加载审核详情失败'))
  } finally {
    loadingPanel.value = false
  }
}

function reloadSelected() {
  if (selectedId.value) void loadPanel(selectedId.value)
}

function onSelectRow(row: HsMathReviewQueueItem) {
  void loadPanel(row.itemId)
}

function onFilter() {
  page.value = 1
  void reloadQueue()
}

function onPage(p: number) {
  page.value = p
  void reloadQueue()
}

function onSpecialtyChange() {
  filters.value.categoryId = undefined
  onFilter()
}

async function submitDecision(decision: HsMathReviewDecision) {
  if (!panel.value || submitting.value) return
  if (reviewActionsBlocked.value) {
    ElMessage.warning('题目版本不一致，请刷新后再提交审核')
    return
  }
  const text = comment.value.trim()
  if (!text) {
    ElMessage.warning('请填写审核意见')
    return
  }
  const labels: Record<HsMathReviewDecision, string> = {
    passed: '审核通过（不等于正式发布）',
    rejected: '退回修改',
    deferred: '暂缓审核',
  }
  try {
    await ElMessageBox.confirm(
      `确认提交「${labels[decision]}」？\n题目 ${panel.value.code} · v${panel.value.contentVersion}`,
      '确认人工审核',
      { type: 'warning', confirmButtonText: '提交', cancelButtonText: '取消' },
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const res = await submitTrainItemReview(panel.value.itemId, {
      decision,
      comment: text,
      expectedContentVersion: panel.value.contentVersion,
      expectedContentFingerprint: panel.value.contentFingerprint,
    })
    if (decision === 'passed') {
      ElMessage.success('人工审核已通过（题目仍为 draft，未发布）')
    } else {
      ElMessage.success('审核已提交')
    }
    if (res.itemStatusUnchanged === 'approved') {
      ElMessage.warning('异常：题目状态不应变为 approved')
    }
    await reloadQueue()
    await loadPanel(panel.value.itemId)
  } catch (e) {
    if (isConflictError(e)) {
      ElMessage.error('题目内容已变化（409），请重新加载后再审')
      if (selectedId.value) await loadPanel(selectedId.value)
    } else {
      ElMessage.error(errMsg(e, '提交审核失败'))
    }
  } finally {
    submitting.value = false
  }
}

async function doPublish() {
  if (!panel.value || publishing.value) return
  if (reviewActionsBlocked.value) {
    ElMessage.warning('题目版本不一致，请刷新后再批准')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认正式批准并发布「${panel.value.code}」到学生训练池？\ncontent_version=${panel.value.contentVersion}\n此操作将把 status 设为 approved。`,
      '正式批准确认',
      { type: 'warning', confirmButtonText: '确认批准', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  publishing.value = true
  try {
    await publishReviewedTrainItem(panel.value.itemId)
    ElMessage.success('已正式批准发布')
    await reloadQueue()
    await loadPanel(panel.value.itemId)
  } catch (e) {
    ElMessage.error(errMsg(e, '正式批准失败'))
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  try {
    const me = await fetchMe()
    meLabel.value = me.nickname || me.email || `用户#${me.id}`
  } catch {
    meLabel.value = '（未获取）'
  }
  try {
    specialties.value = await listAdminHsMathSpecialties()
    categories.value = await listAdminHsMathCategories()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载专项分类失败'))
  }
  await reloadQueue()
})
</script>

<style scoped>
.review-page {
  padding: 4px 0 24px;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
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
  flex-wrap: wrap;
}
.layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.queue {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  background: var(--el-bg-color);
}
.filters :deep(.el-select),
.filters :deep(.el-input) {
  width: 100%;
}
.q-table {
  margin-top: 8px;
  cursor: pointer;
}
.pager {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  min-height: 320px;
}
.title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.title-row h2 {
  margin: 0;
  font-size: 18px;
}
.meta-line {
  margin: 6px 0 0;
  font-size: 13px;
}
.muted {
  color: var(--el-text-color-secondary);
}
.dev-note {
  margin-top: 10px;
}
.block {
  margin-top: 16px;
}
.lab {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.kp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ops {
  margin-top: 16px;
}
.ops.publish {
  border-color: var(--el-color-warning-light-5);
}
.mb {
  margin-bottom: 10px;
}
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.warn {
  color: var(--el-color-danger);
  font-size: 13px;
  margin: 8px 0 0;
}
.reasons {
  margin: 0 0 10px;
  padding-left: 18px;
  color: var(--el-color-danger);
  font-size: 13px;
}
.ml {
  margin-left: 8px;
}
.hist-c {
  margin: 4px 0 0;
  white-space: pre-wrap;
  font-size: 13px;
}
</style>
