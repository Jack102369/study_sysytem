<template>
  <div class="page-fill wrong-detail" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goBack">← 返回错题列表</el-button>
    </div>

    <el-empty v-if="!loading && !detail" description="错题不存在" />

    <template v-else-if="detail">
      <el-card shadow="never" class="card">
        <div class="head">
          <div>
            <el-tag :type="statusTag(detail.status)">{{ detail.statusLabel }}</el-tag>
            <el-tag
              v-if="detail.dueToday"
              type="danger"
              effect="plain"
              style="margin-left: 6px"
            >
              今天建议复习
            </el-tag>
            <h1>{{ detail.code || '错题详情' }}</h1>
            <p class="meta">
              {{ detail.specialtyName || '—' }} / {{ detail.categoryName || '—' }}
              · {{ detail.difficultyLabel || '—' }}
            </p>
          </div>
          <div class="acts">
            <el-button
              type="primary"
              plain
              :disabled="!detail.practiceEligible"
              :loading="practicing"
              @click="startOriginal"
            >
              开始原题复练
            </el-button>
            <el-dropdown
              trigger="click"
              :disabled="!canStartVariation"
              @command="startVariation"
            >
              <el-button
                type="primary"
                :disabled="!canStartVariation"
                :loading="variationLoading"
              >
                开始变式训练 ▾
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="5">5 题</el-dropdown-item>
                  <el-dropdown-item :command="10">10 题</el-dropdown-item>
                  <el-dropdown-item :command="20">20 题</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <el-alert
          v-if="!detail.practiceEligible"
          type="warning"
          :closable="false"
          show-icon
          :title="detail.practiceBlockReason || '当前不可复练'"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="detail.variationPreview?.emptyHint"
          type="info"
          :closable="false"
          show-icon
          :title="detail.variationPreview.emptyHint"
          style="margin-bottom: 12px"
        />
        <p v-else-if="detail.variationPreview" class="var-hint">
          当前合格变式约 {{ detail.variationPreview.candidateCount }} 道
          <span v-if="!detail.variationPreview.catalogLoaded">（题型模型目录未加载，已退化为知识链接匹配）</span>
        </p>

        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="错误次数">{{ detail.wrongCount }}</el-descriptions-item>
          <el-descriptions-item label="错后正确">
            {{ detail.correctAfterWrongCount }}
          </el-descriptions-item>
          <el-descriptions-item label="首次做错">
            {{ formatTime(detail.firstWrongAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最近做错">
            {{ formatTime(detail.lastWrongAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="最近正确">
            {{ detail.lastCorrectAt ? formatTime(detail.lastCorrectAt) : '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="最近结果">
            {{ detail.lastGradeResult || '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <p class="note">{{ detail.masteryRules.note }}</p>
      </el-card>

      <el-card
        v-if="detail.methodSummary?.available"
        shadow="never"
        class="card"
      >
        <h2>解题方法</h2>
        <p class="disclaimer">{{ detail.methodSummary.disclaimer }}</p>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item
            v-if="detail.methodSummary.knowledgePoints"
            label="相关知识点"
          >
            {{ detail.methodSummary.knowledgePoints }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detail.methodSummary.breakthrough"
            label="解题突破口"
          >
            {{ detail.methodSummary.breakthrough }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detail.methodSummary.keyConditions"
            label="关键条件"
          >
            {{ detail.methodSummary.keyConditions }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detail.methodSummary.coreMethod"
            label="核心方法"
          >
            {{ detail.methodSummary.coreMethod }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detail.methodSummary.commonMistakes"
            label="易错点"
          >
            {{ detail.methodSummary.commonMistakes }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detail.methodSummary.similarRecognition"
            label="同类题识别"
          >
            {{ detail.methodSummary.similarRecognition }}
          </el-descriptions-item>
        </el-descriptions>
        <p v-if="detail.methodSummary.source" class="hint">
          来源：{{ detail.methodSummary.source }}
        </p>
      </el-card>

      <el-card
        v-if="detail.variationPreview?.items?.length"
        shadow="never"
        class="card"
      >
        <h2>变式预览</h2>
        <p class="hint">{{ detail.variationPreview.rulesNote }}</p>
        <el-table :data="detail.variationPreview.items" size="small" stripe>
          <el-table-column prop="tierLabel" label="匹配档" width="130" />
          <el-table-column prop="stemPreview" label="题干预览" min-width="200" />
          <el-table-column prop="modelId" label="模型" width="160" />
        </el-table>
      </el-card>

      <el-card shadow="never" class="card">
        <h2>当前题库题干</h2>
        <p class="stem">{{ detail.currentStem || '（题目不可用，请看历史快照）' }}</p>
        <h3>当前解析</h3>
        <p class="analysis">{{ detail.currentAnalysis || '—' }}</p>
        <p class="hint">{{ detail.currentAnalysisNote }}</p>
      </el-card>

      <el-card shadow="never" class="card">
        <h2>历次做错快照</h2>
        <el-empty
          v-if="!detail.history.length"
          description="无历史做错快照"
        />
        <div v-for="(h, idx) in detail.history" :key="h.sessionItemId" class="hist">
          <div class="hist-head">
            <strong>#{{ idx + 1 }}</strong>
            <span>{{ formatTime(h.occurredAt) }}</span>
            <el-tag size="small">{{ kindText(h.sessionKind) }}</el-tag>
          </div>
          <p class="stem">{{ h.stemSnapshot || '—' }}</p>
          <p><span class="lab">你的答案：</span>{{ h.userAnswer || '—' }}</p>
          <p>
            <span class="lab">当时标准答案：</span>{{ h.standardAnswerSnapshot || '—' }}
          </p>
          <p class="analysis">
            <span class="lab">当时解析：</span>{{ h.analysisSnapshot || '—' }}
          </p>
          <el-button link type="primary" @click="goResult(h.sessionId)">
            查看该次训练结果
          </el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createChemWrongPractice,
  createChemWrongVariationPractice,
  getChemWrongDetail,
  type ChemWrongDetail,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const practicing = ref(false)
const variationLoading = ref(false)
const detail = ref<ChemWrongDetail | null>(null)

const canStartVariation = computed(
  () => (detail.value?.variationPreview?.candidateCount || 0) > 0,
)

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString()
  } catch {
    return v
  }
}

function statusTag(s: string) {
  if (s === 'open') return 'danger'
  if (s === 'consolidating') return 'warning'
  if (s === 'mastered') return 'success'
  return 'info'
}

function kindText(k: string) {
  if (k === 'daily') return '每日10分钟'
  if (k === 'advanced') return '提高与挑战'
  if (k === 'wrong_review') return '错题复练'
  if (k === 'wrong_variation') return '变式训练'
  return '专项训练'
}

function goBack() {
  void router.push('/chemistry/wrong-questions')
}

function goResult(sessionId: string) {
  void router.push(`/chemistry/train/result/${encodeURIComponent(sessionId)}`)
}

async function load() {
  const id = String(route.params.id || '')
  if (!id) return
  loading.value = true
  try {
    detail.value = await getChemWrongDetail(id)
  } catch (e) {
    detail.value = null
    ElMessage.error(errMsg(e, '加载详情失败'))
  } finally {
    loading.value = false
  }
}

async function startOriginal() {
  practicing.value = true
  try {
    const session = await createChemWrongPractice(5)
    if (session.pickMeta?.shortfall) {
      ElMessage.warning(session.pickMeta.shortfall)
    }
    void router.push(`/chemistry/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '无法开始原题复练'))
  } finally {
    practicing.value = false
  }
}

async function startVariation(count: number) {
  if (!detail.value) return
  variationLoading.value = true
  try {
    const session = await createChemWrongVariationPractice(
      detail.value.id,
      count as 5 | 10 | 20,
    )
    if (session.pickMeta?.shortfall) {
      ElMessage.warning(session.pickMeta.shortfall)
    }
    void router.push(`/chemistry/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '无法开始变式训练'))
  } finally {
    variationLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>

<style scoped>
.wrong-detail {
  padding: 16px 20px 40px;
}
.toolbar {
  margin-bottom: 8px;
}
.card {
  margin-bottom: 14px;
  border-radius: 12px;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.head h1 {
  margin: 8px 0 4px;
  font-size: 1.15rem;
}
.meta {
  margin: 0;
  color: #909399;
  font-size: 13px;
}
.acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.note,
.hint,
.disclaimer,
.var-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}
.disclaimer {
  margin-bottom: 10px;
}
.card h2 {
  margin: 0 0 8px;
  font-size: 16px;
}
.card h3 {
  margin: 14px 0 6px;
  font-size: 14px;
}
.stem,
.analysis {
  white-space: pre-wrap;
  line-height: 1.55;
  margin: 0 0 8px;
}
.hist {
  padding: 12px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}
.hist-head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.lab {
  color: #909399;
  margin-right: 4px;
}
@media (max-width: 640px) {
  .wrong-detail {
    padding: 12px;
  }
}
</style>
