<template>
  <div class="page-fill train-result" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goHome">← 返回数学首页</el-button>
        <h1>训练结果</h1>
        <p class="sub" v-if="session">
          {{ session.specialtyName }} · {{ session.categoryName }} ·
          {{ difficultyLabel(session.difficulty) }}
        </p>
      </div>
      <div class="acts">
        <el-button @click="goHistory">训练历史</el-button>
        <el-button type="primary" @click="goRetry">再练一次</el-button>
      </div>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      style="margin-bottom: 12px"
    />

    <template v-if="session">
      <el-alert
        v-if="session.status !== 'completed'"
        type="warning"
        :closable="false"
        show-icon
        :title="
          session.status === 'in_progress'
            ? '该训练尚未提交，以下可能不含判题结果'
            : '该训练已取消'
        "
        style="margin-bottom: 12px"
      />

      <el-row :gutter="12" class="stats">
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="题量" :value="session.actualCount" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="正确" :value="session.correctCount ?? 0" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="错误" :value="session.wrongCount ?? 0" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <el-statistic title="待复核" :value="session.pendingCount ?? 0" />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="stat-plain">
              <div class="lab">正确率</div>
              <div class="val">
                {{ formatAccuracyPercent(session.accuracyPercent) }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="8" :md="4">
          <el-card shadow="never">
            <div class="stat-plain">
              <div class="lab">用时</div>
              <div class="val">{{ formatDurationMs(session.durationMs) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <p class="hint">
        正确率 = 正确 / (正确 + 错误)；待复核与待 AI 批改不计入分母。正确率不是知识点掌握度。
      </p>
      <el-alert
        v-if="hasOpenApplicationGrading"
        type="warning"
        :closable="false"
        show-icon
        title="本场已提交，但含尚未完成批改的应用题：已提交 ≠ 全部题目已批改完成。"
        style="margin-bottom: 12px"
      />

      <div class="items-list">
        <el-card
          v-for="item in session.items"
          :key="item.id"
          shadow="never"
          class="item-card"
        >
          <div class="item-head">
            <span>第 {{ item.sortOrder }} 题 · {{ qtypeLabel(item.qtype) }}</span>
            <MathGradeTag
              v-if="item.gradeResult"
              :result="item.gradeResult"
              :grade-reason="item.gradeReason"
              effect="dark"
            />
            <el-tag v-else size="small" type="info">未判</el-tag>
          </div>
          <MathStem class="stem" :text="item.stem" />
          <HsMathStemDiagrams
            v-if="session && (item.diagrams || []).length"
            :items="
              (item.diagrams || []).map((d) => ({
                key: d.objectId,
                contentPath: hsMathSessionItemDiagramContentUrl(
                  session!.id,
                  item.id,
                  d.objectId,
                ),
                alt: d.altText,
              }))
            "
          />
          <div class="pair">
            <div>
              <div class="lab">你的答案</div>
              <MathStem
                :text="
                  formatAnswerDisplay(
                    item.qtype,
                    item.userAnswerPayloadJson,
                    item.optionsJson?.options,
                  )
                "
              />
              <MathApplicationAnswerImages
                v-if="item.qtype === 'application' && session"
                :session-id="session.id"
                :session-item-id="item.id"
                :images="item.images"
                :image-ids="applicationImageIds(item)"
              />
            </div>
            <div v-if="session.status === 'completed'">
              <div class="lab">标准答案</div>
              <MathStem
                :text="
                  formatAnswerDisplay(
                    item.qtype,
                    item.answerPayloadJson,
                    item.optionsJson?.options,
                  )
                "
              />
            </div>
          </div>
          <div
            v-if="item.qtype === 'application'"
            class="ai-grade-block"
          >
            <p
              v-if="applicationAiStatusMessage(item)"
              class="ai-status"
              :class="applicationAiStatusClass(item)"
            >
              {{ applicationAiStatusMessage(item) }}
            </p>
            <div
              v-if="canShowRegradeButton(item)"
              class="ai-regrade-row"
            >
              <el-button
                type="primary"
                plain
                size="small"
                :loading="regradingItemId === item.id"
                :disabled="!!regradingItemId"
                @click="onRequestRegrade(item)"
              >
                重新申请 AI 批改
              </el-button>
            </div>
            <template
              v-if="
                canShowApplicationAiScore(item.gradeResult) && item.aiGrade
              "
            >
              <div class="ai-score-head">
                <span class="ai-score-label">总分</span>
                <span class="ai-score-num">{{ item.aiGrade.totalScore }}</span>
                <span class="ai-score-sep">/</span>
                <span class="ai-score-max">{{ item.aiGrade.maxScore }}</span>
              </div>
              <ul class="ai-meta">
                <li>
                  <span class="lab">AI 批改方式</span>
                  {{
                    formatGradingMethodLabel({
                      gradingProvider: item.aiGrade.gradingProvider,
                      pipeline: item.aiGrade.pipeline,
                      userAnswerPayload: item.userAnswerPayloadJson,
                    })
                  }}
                </li>
                <li v-if="formatScoringModelLabel(item.aiGrade)">
                  <span class="lab">评分模型</span>
                  {{ formatScoringModelLabel(item.aiGrade) }}
                </li>
                <li v-if="formatVisionModelLabel(item.aiGrade)">
                  <span class="lab">识别模型</span>
                  {{ formatVisionModelLabel(item.aiGrade) }}
                </li>
                <li
                  v-if="
                    formatGradedAtLabel(
                      item.aiGradedAt || item.aiGrade.gradedAt,
                    )
                  "
                >
                  <span class="lab">批改时间</span>
                  {{
                    formatGradedAtLabel(
                      item.aiGradedAt || item.aiGrade.gradedAt,
                    )
                  }}
                </li>
              </ul>
              <ul
                v-if="item.aiGrade.rubricScores?.length"
                class="rubric-list"
              >
                <li
                  v-for="rs in item.aiGrade.rubricScores"
                  :key="rs.rubricKey"
                  class="rubric-row"
                >
                  <strong>{{ formatRubricKeyTitle(rs.rubricKey) }}</strong>
                  {{ rs.score }}/{{ rs.maxScore }} —
                  <MathStem
                    class="rubric-feedback"
                    inline
                    :text="rs.feedback"
                  />
                </li>
              </ul>
              <div
                v-if="item.aiGrade.errors && item.aiGrade.errors.length"
                class="ai-errors"
              >
                <div class="lab">错误定位</div>
                <ul>
                  <li
                    v-for="(err, idx) in item.aiGrade.errors"
                    :key="idx"
                  >
                    <MathStem :text="String(err)" />
                  </li>
                </ul>
              </div>
              <div
                v-if="
                  summarizeRecognitionWarnings(
                    item.aiGrade.recognitionWarnings,
                  ).text
                "
                class="ai-warn-summary"
              >
                <div class="lab">识别提示</div>
                <p>
                  {{
                    summarizeRecognitionWarnings(
                      item.aiGrade.recognitionWarnings,
                    ).text
                  }}
                </p>
              </div>
              <div class="ai-explain">
                <div class="lab">
                  {{ recognizedWorkCaption(item.aiGrade) }}
                </div>
                <MathStem
                  v-if="item.aiGrade.recognizedWork"
                  :text="item.aiGrade.recognizedWork"
                />
                <p
                  v-else-if="
                    shouldShowRecognizedWorkEmpty({
                      hasImages: applicationImageIds(item).length > 0,
                      recognizedWork: item.aiGrade.recognizedWork,
                    })
                  "
                  class="ai-empty"
                >
                  暂无识别文本
                </p>
              </div>
              <div
                v-if="item.aiGrade.personalizedExplanation"
                class="ai-explain"
              >
                <div class="lab">个性化解析</div>
                <MathStem :text="item.aiGrade.personalizedExplanation" />
              </div>
            </template>
            <template
              v-else-if="
                item.gradeResult === 'review_required' && item.aiGrade
              "
            >
              <div
                v-if="
                  summarizeRecognitionWarnings(
                    item.aiGrade.recognitionWarnings,
                  ).text
                "
                class="ai-warn-summary"
              >
                <div class="lab">识别提示</div>
                <p>
                  {{
                    summarizeRecognitionWarnings(
                      item.aiGrade.recognitionWarnings,
                    ).text
                  }}
                </p>
              </div>
              <div
                v-if="item.aiGrade.recognizedWork"
                class="ai-explain"
              >
                <div class="lab">识别过程（供核对）</div>
                <MathStem :text="item.aiGrade.recognizedWork" />
              </div>
            </template>
          </div>
          <div
            v-if="item.knowledgePoints && item.knowledgePoints.length"
            class="kps"
          >
            <div class="lab">关联知识点（会话快照）</div>
            <div class="kp-tags">
              <el-tag
                v-for="kp in item.knowledgePoints"
                :key="kp.code"
                size="small"
                :type="kp.isPrimary ? 'primary' : 'info'"
                effect="plain"
              >
                {{ kp.name }}
                <span v-if="kp.isPrimary"> · 主</span>
              </el-tag>
            </div>
          </div>
          <div
            v-if="item.methods && item.methods.length"
            class="methods"
          >
            <div class="lab">
              关联解题方法
              <span class="lab-hint">（按题目当前关联展示）</span>
            </div>
            <div class="method-tags">
              <el-popover
                v-for="m in item.methods"
                :key="m.code"
                placement="top"
                :width="280"
                trigger="click"
              >
                <template #reference>
                  <el-tag
                    class="method-tag"
                    size="small"
                    :type="m.isPrimary ? 'success' : 'info'"
                    :effect="m.isPrimary ? 'dark' : 'plain'"
                    role="button"
                    tabindex="0"
                  >
                    {{ m.name }}
                    <span v-if="m.isPrimary"> · 主</span>
                  </el-tag>
                </template>
                <div class="method-pop">
                  <div class="method-pop-title">{{ m.name }}</div>
                  <p class="method-pop-body">
                    {{ m.summary?.trim() ? m.summary : '暂无方法简介' }}
                  </p>
                </div>
              </el-popover>
            </div>
          </div>
          <div v-if="item.analysis" class="analysis">
            <div class="lab">解析</div>
            <MathStem :text="item.analysis" />
          </div>
          <p
            v-if="
              item.gradeReason &&
              item.qtype !== 'application' &&
              !/key|token|secret|storage/i.test(item.gradeReason)
            "
            class="reason"
          >
            说明：{{ item.gradeReason }}
          </p>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MathStem from '@/components/hs-math/MathStem.vue'
import HsMathStemDiagrams from '@/components/hs-math/HsMathStemDiagrams.vue'
import MathGradeTag from '@/components/hs-math/MathGradeTag.vue'
import MathApplicationAnswerImages from '@/components/hs-math/MathApplicationAnswerImages.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getHsMathTrainSession,
  hsMathSessionItemDiagramContentUrl,
  regradeHsMathApplicationItem,
  type HsMathSessionDetail,
  type HsMathSessionItem,
} from '@/api/hs-math-train'
import {
  difficultyLabel,
  formatAccuracyPercent,
  formatAnswerDisplay,
  formatDurationMs,
  qtypeLabel,
} from '@/utils/hs-math-format'
import {
  applicationAiStatusMessage as aiStatusMsg,
  applicationAiStatusTone,
  canRequestApplicationRegrade,
  nextAiGradePollIntervalMs,
  sessionNeedsAiGradePoll,
  shouldStopAiGradePoll,
} from '@/utils/hs-math-ai-grade-poll'
import {
  canShowApplicationAiScore,
  formatGradedAtLabel,
  formatGradingMethodLabel,
  formatRubricKeyTitle,
  formatScoringModelLabel,
  formatVisionModelLabel,
  recognizedWorkCaption,
  shouldShowRecognizedWorkEmpty,
  summarizeRecognitionWarnings,
} from '@/utils/hs-math-grading-provider'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const session = ref<HsMathSessionDetail | null>(null)
const regradingItemId = ref<string | null>(null)

const hasOpenApplicationGrading = computed(
  () =>
    !!session.value?.items?.some((i) =>
      (
        [
          'pending_ai',
          'grading',
          'review_required',
          'grading_failed',
        ] as string[]
      ).includes(i.gradeResult || ''),
    ),
)

function applicationAiStatusMessage(item: HsMathSessionItem): string | null {
  return aiStatusMsg({
    gradeResult: item.gradeResult,
    gradeReason: item.gradeReason,
  })
}

function applicationAiStatusClass(item: HsMathSessionItem): Record<string, boolean> {
  const tone = applicationAiStatusTone({
    gradeResult: item.gradeResult,
    gradeReason: item.gradeReason,
  })
  return {
    fail: tone === 'fail',
    warn: tone === 'warn',
    info: tone === 'info',
  }
}

function canShowRegradeButton(item: HsMathSessionItem): boolean {
  return canRequestApplicationRegrade({
    qtype: item.qtype,
    sessionStatus: session.value?.status,
    gradeResult: item.gradeResult,
    gradeReason: item.gradeReason,
  })
}

async function onRequestRegrade(item: HsMathSessionItem) {
  if (!session.value || regradingItemId.value) return
  try {
    await ElMessageBox.confirm(
      '将使用已保存的答案图片/文字重新申请 AI 批改，不会修改你的作答内容。是否继续？',
      '重新申请 AI 批改',
      {
        type: 'info',
        confirmButtonText: '申请批改',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  regradingItemId.value = item.id
  try {
    const detail = await regradeHsMathApplicationItem(session.value.id, item.id)
    session.value = detail
    ElMessage.success('已提交重新批改申请')
    scheduleAiGradePoll()
  } catch (e) {
    const msg = errMsg(e, '重新申请失败')
    if (/暂未开放|未开放|AI_GRADING_DISABLED/i.test(String(msg))) {
      ElMessage.warning('当前 AI 批改暂未开放，请稍后再试。')
    } else {
      ElMessage.error(msg)
    }
  } finally {
    regradingItemId.value = null
  }
}

/** APPLICATION-3D-8：仅 pending_ai / grading 轮询 */
let pollTimer: ReturnType<typeof setTimeout> | null = null
let pollTick = 0
let pollErrors = 0
let pollSessionId = ''

function clearAiGradePoll() {
  if (pollTimer != null) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function scheduleAiGradePoll() {
  clearAiGradePoll()
  const needs = sessionNeedsAiGradePoll(session.value?.items)
  if (
    shouldStopAiGradePoll({
      needsPoll: needs,
      tickCount: pollTick,
      errorCount: pollErrors,
    })
  ) {
    return
  }
  const delay = nextAiGradePollIntervalMs(
    typeof document !== 'undefined' && document.hidden,
  )
  pollTimer = setTimeout(() => {
    void runAiGradePollTick()
  }, delay)
}

async function runAiGradePollTick() {
  const id = String(route.params.id || '')
  if (!id || id !== pollSessionId) return
  pollTick += 1
  try {
    const next = await getHsMathTrainSession(id)
    if (String(route.params.id || '') !== id) return
    session.value = next
    pollErrors = 0
  } catch {
    pollErrors += 1
  }
  scheduleAiGradePoll()
}

function resetAndStartAiGradePoll() {
  clearAiGradePoll()
  pollTick = 0
  pollErrors = 0
  pollSessionId = String(route.params.id || '')
  scheduleAiGradePoll()
}

function onVisibilityChange() {
  if (!sessionNeedsAiGradePoll(session.value?.items)) return
  scheduleAiGradePoll()
}

function applicationImageIds(item: HsMathSessionItem): string[] {
  const a = item.userAnswerPayloadJson
  if (!a || a.kind !== 'application' || !Array.isArray(a.imageIds)) return []
  return a.imageIds.map(String)
}

function goHome() {
  void router.push('/hs-math')
}
function goHistory() {
  void router.push('/hs-math/train/history')
}
function goRetry() {
  if (!session.value?.specialtyCode) {
    void router.push('/hs-math/specialties')
    return
  }
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(session.value.specialtyCode)}/train`,
    query: {
      specialtyId: session.value.specialtyId,
      categoryId: session.value.categoryId,
      specialtyName: session.value.specialtyName || '',
      categoryName: session.value.categoryName || '',
    },
  })
}

async function load() {
  const id = String(route.params.id || '')
  if (!id) return
  clearAiGradePoll()
  loading.value = true
  loadError.value = ''
  try {
    session.value = await getHsMathTrainSession(id)
    resetAndStartAiGradePoll()
  } catch (e) {
    session.value = null
    loadError.value = errMsg(e, '加载结果失败')
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, () => void load())
onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  void load()
})
onBeforeUnmount(() => {
  clearAiGradePoll()
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
})
</script>

<style scoped>
/* page-fill 禁外滚：顶部固定，.items-list 内滚，避免每题被 flex 压扁 */
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.toolbar h1 {
  margin: 4px 0;
  font-size: 22px;
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
.stats {
  flex-shrink: 0;
}
.stats .el-card {
  margin-bottom: 12px;
}
.stat-plain .lab {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.stat-plain .val {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 600;
}
.hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 12px;
  flex-shrink: 0;
}
.items-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-bottom: 24px;
}
.item-card {
  margin-bottom: 14px;
  flex-shrink: 0;
}
.item-card :deep(.el-card__body) {
  padding: 16px 18px;
  overflow: visible;
  height: auto;
}
.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}
.ai-grade-block {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.ai-status {
  margin: 0;
  font-size: 13px;
  color: var(--el-color-warning);
}
.ai-status.info {
  color: var(--el-text-color-regular);
}
.ai-status.warn {
  color: var(--el-color-warning);
}
.ai-status.fail {
  color: var(--el-color-danger);
}
.ai-regrade-row {
  margin: 8px 0 4px;
}
.ai-provider {
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ai-meta {
  margin: 6px 0 10px;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
.ai-meta .lab {
  display: inline-block;
  min-width: 5.5em;
  margin-right: 6px;
  color: var(--el-text-color-secondary);
}
.ai-warn-summary {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.ai-warn-summary p {
  margin: 4px 0 0;
}
.ai-empty {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ai-score-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 2px;
}
.ai-score-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}
.ai-score-num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-color-primary);
  letter-spacing: -0.02em;
}
.ai-score-sep {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.ai-score-max {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.rubric-list {
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.6;
}
.rubric-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}
.rubric-feedback {
  display: inline;
  flex: 1 1 12rem;
  min-width: 0;
}
.ai-errors ul {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--el-color-danger);
}
.ai-explain {
  margin-top: 8px;
}
.stem {
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.7;
}
.kps {
  margin: 10px 0 12px;
}
.kp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.methods {
  margin: 10px 0 12px;
}
.lab-hint {
  font-weight: 400;
  opacity: 0.85;
}
.method-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.method-tag {
  cursor: pointer;
  user-select: none;
}
.method-pop-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.method-pop-body {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
}
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 4px;
}
@media (max-width: 640px) {
  .pair {
    grid-template-columns: 1fr;
  }
}
.lab {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.analysis {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  line-height: 1.7;
}
.reason {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
