<template>
  <div class="page-fill coach-page" v-loading="loading">
    <div class="toolbar">
      <h1>结构教练</h1>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      :title="alertTitle"
      style="margin-bottom: 12px"
    />

    <el-tabs v-model="workMode" @tab-change="onWorkModeChange">
      <el-tab-pane label="结构练习" name="structure" />
      <el-tab-pane label="高考评测" name="gaokao" />
    </el-tabs>

    <el-tabs v-model="track" @tab-change="onTrackChange">
      <el-tab-pane label="语文" name="chinese" />
      <el-tab-pane label="英语" name="english" />
    </el-tabs>

    <div class="layout">
      <section class="panel compose">
        <div class="panel-head">
          <h2>练习编辑</h2>
          <el-button text type="primary" @click="resetForm">清空表单</el-button>
        </div>

        <el-form label-width="88px">
          <el-form-item label="题目来源">
            <el-radio-group v-model="form.topicSource">
              <el-radio-button label="manual">自己定</el-radio-button>
              <el-radio-button label="ai">AI 出题</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.topicSource === 'ai'" label="出题方向">
            <div class="row-actions">
              <el-input
                v-model="topicHint"
                clearable
                :placeholder="track === 'chinese' ? '可选，如：家国情怀、科技与生活' : 'Optional hint, e.g. technology, school life'"
              />
              <el-button type="primary" :loading="topicLoading" @click="onGenerateTopic">
                AI 出题
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="题目" required>
            <el-input
              v-model="form.topicText"
              type="textarea"
              :rows="3"
              maxlength="4000"
              show-word-limit
              :placeholder="track === 'chinese' ? '输入或粘贴作文题目，也可拍照识别' : 'Enter or paste the prompt, or OCR a photo'"
            />
            <div v-if="workMode === 'gaokao'" class="ocr-row">
              <el-upload
                :show-file-list="false"
                accept="image/*"
                :disabled="!canUseOcr || ocrLoading !== ''"
                :http-request="ocrTopic"
              >
                <el-button size="small" :loading="ocrLoading === 'topicText'" :disabled="!canUseOcr">
                  识别题目图片
                </el-button>
              </el-upload>
              <span v-if="!canUseOcr" class="ocr-hint">无 OCR 权限</span>
            </div>
          </el-form-item>

          <el-form-item label="写作要求">
            <el-input
              v-model="form.topicRequirements"
              type="textarea"
              :rows="2"
              maxlength="2000"
              show-word-limit
              placeholder="可选：字数、体裁、注意事项；也可拍照识别"
            />
            <div v-if="workMode === 'gaokao'" class="ocr-row">
              <el-upload
                :show-file-list="false"
                accept="image/*"
                :disabled="!canUseOcr || ocrLoading !== ''"
                :http-request="ocrRequirements"
              >
                <el-button size="small" :loading="ocrLoading === 'topicRequirements'" :disabled="!canUseOcr">
                  识别要求图片
                </el-button>
              </el-upload>
            </div>
          </el-form-item>

          <template v-if="workMode === 'structure'">
            <el-form-item label="提纲" required>
              <el-input
                v-model="form.outlineText"
                type="textarea"
                :rows="5"
                maxlength="6000"
                show-word-limit
                :placeholder="
                  track === 'chinese'
                    ? '分点写论点与证据安排（须自己写）'
                    : 'Outline your thesis, topic sentences, evidence (write yourself)'
                "
              />
            </el-form-item>

            <el-form-item label="首段" required>
              <el-input
                v-model="form.openingText"
                type="textarea"
                :rows="4"
                maxlength="4000"
                show-word-limit
                placeholder="自己写开头段，用于结构点评"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="reviewLoading" @click="onReview">
                请 AI 评结构
              </el-button>
              <el-button :loading="saving" @click="onSave">保存为新记录</el-button>
              <div class="save-hint">每次保存 / 评测都会新增一条历史，不会覆盖旧记录</div>
            </el-form-item>
          </template>

          <template v-else>
            <el-form-item label="全文" required>
              <el-input
                v-model="form.finalDraftText"
                type="textarea"
                :rows="12"
                maxlength="20000"
                show-word-limit
                :placeholder="
                  track === 'chinese'
                    ? '粘贴或手写拍照识别全文（须自己写，可多张图多次识别追加）'
                    : 'Paste or OCR your full written expression (you must write it)'
                "
              />
              <div class="ocr-row">
                <el-upload
                  :show-file-list="false"
                  accept="image/*"
                  :disabled="!canUseOcr || ocrLoading !== ''"
                  :http-request="ocrEssay"
                >
                  <el-button size="small" :loading="ocrLoading === 'finalDraftText'" :disabled="!canUseOcr">
                    识别作文图片
                  </el-button>
                </el-upload>
                <span class="ocr-hint">只提取文字，不保存原图；多页可连续识别追加</span>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="reviewLoading" @click="onGaokaoReview">
                请 AI 高考评测
              </el-button>
              <el-button :loading="saving" @click="onSave">保存为新记录</el-button>
              <div class="save-hint">每次保存 / 评测都会新增一条历史，不会覆盖旧记录</div>
            </el-form-item>
          </template>
        </el-form>

        <div v-if="structureReview" class="review-box">
          <div class="review-title">结构点评</div>
          <div class="review-hint">{{ structureReview.overallHint }}</div>
          <div class="review-grid">
            <div v-for="item in reviewCards" :key="item.key" class="review-card">
              <div class="review-card-head">
                <span>{{ item.label }}</span>
                <el-tag :type="levelTag(item.dim.level)" size="small">
                  {{ levelLabel(item.dim.level) }}
                </el-tag>
              </div>
              <p>{{ item.dim.reason }}</p>
              <p class="suggest">建议：{{ item.dim.suggestion }}</p>
            </div>
          </div>
        </div>

        <div v-else-if="gaokaoReview" class="review-box">
          <div class="review-title">
            高考评测
            <el-tag type="warning" size="small" style="margin-left: 8px">
              {{ gaokaoReview.totalScore }} / {{ gaokaoReview.fullScore }} 分（练习参考）
            </el-tag>
          </div>
          <div class="review-hint">{{ gaokaoReview.overall }}</div>
          <div class="review-grid">
            <div v-for="dim in gaokaoReview.dimensions" :key="dim.key" class="review-card">
              <div class="review-card-head">
                <span>{{ dim.label }}</span>
                <el-tag size="small">{{ dim.score }} / {{ dim.fullScore }}</el-tag>
              </div>
              <p>{{ dim.comment }}</p>
            </div>
          </div>
          <div v-if="gaokaoReview.analysis" class="gaokao-block">
            <div class="view-label">解析</div>
            <p>{{ gaokaoReview.analysis }}</p>
          </div>
          <div v-if="gaokaoReview.deductions.length" class="gaokao-block">
            <div class="view-label">扣分点</div>
            <ul>
              <li v-for="(d, i) in gaokaoReview.deductions" :key="'d' + i">{{ d }}</li>
            </ul>
          </div>
          <div v-if="gaokaoReview.suggestions.length" class="gaokao-block">
            <div class="view-label">修改建议</div>
            <ul>
              <li v-for="(s, i) in gaokaoReview.suggestions" :key="'s' + i">{{ s }}</li>
            </ul>
          </div>
          <div v-if="gaokaoReview.modelEssay" class="gaokao-block model-essay">
            <div class="view-label">原文升格稿（构句/语法/常用高级词）</div>
            <div class="view-text model-essay-text">{{ gaokaoReview.modelEssay }}</div>
            <ul v-if="gaokaoReview.modelEssayNotes && gaokaoReview.modelEssayNotes.length">
              <li v-for="(n, i) in gaokaoReview.modelEssayNotes" :key="'n' + i">{{ n }}</li>
            </ul>
          </div>
        </div>

        <el-empty
          v-else-if="!reviewLoading && workMode === 'structure'"
          description="提交提纲与首段后可看三项点评"
          :image-size="72"
        />
        <el-empty
          v-else-if="!reviewLoading && workMode === 'gaokao'"
          description="提交题目与全文后可看高考评分与解析"
          :image-size="72"
        />

        <el-form v-if="workMode === 'structure'" label-width="88px" class="draft-form">
          <el-form-item label="终稿">
            <el-input
              v-model="form.finalDraftText"
              type="textarea"
              :rows="8"
              maxlength="20000"
              show-word-limit
              placeholder="终稿必须自己写；可在此保存，不会调用 AI 生成"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="success" :loading="saving" @click="onSave">
              保存终稿为新记录
            </el-button>
            <div class="save-hint">每次保存 / 评测都会新增一条历史，不会覆盖旧记录</div>
          </el-form-item>
        </el-form>
      </section>

      <section class="panel history">
        <div class="history-head">
          <h2>{{ historyTitle }}</h2>
          <el-button text type="primary" @click="reload">刷新</el-button>
        </div>
        <div class="history-filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索题目/要求/正文"
            style="flex: 1; min-width: 140px"
            @keyup.enter="onFilterSearch"
            @clear="onFilterSearch"
          />
          <el-select
            v-model="filters.topicSource"
            clearable
            placeholder="来源"
            style="width: 110px"
            @change="onFilterSearch"
          >
            <el-option label="自己定" value="manual" />
            <el-option label="AI 出题" value="ai" />
          </el-select>
          <el-select
            v-model="filters.hasReview"
            clearable
            placeholder="点评"
            style="width: 110px"
            @change="onFilterSearch"
          >
            <el-option label="有点评" value="yes" />
            <el-option label="无点评" value="no" />
          </el-select>
          <el-button type="primary" @click="onFilterSearch">筛选</el-button>
        </div>
        <el-table v-if="rows.length" :data="rows" stripe height="100%">
          <el-table-column label="题目" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ preview(row.topicText) }}</template>
          </el-table-column>
          <el-table-column prop="topicSource" label="来源" width="88" align="center" sortable>
            <template #default="{ row }">
              <el-tag :type="row.topicSource === 'ai' ? 'warning' : 'info'" size="small">
                {{ row.topicSource === 'ai' ? 'AI' : '自定' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="点评"
            width="88"
            align="center"
            sortable
            :sort-method="sortReviewFlag"
          >
            <template #default="{ row }">
              <el-tag v-if="row.review" size="small" type="success">有</el-tag>
              <el-tag v-else size="small" type="info">无</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新" width="150" sortable>
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click.stop="onView(row)">查看</el-button>
              <el-button link type="primary" :loading="pdfId === row.id" @click.stop="onDownloadPdf(row)">
                下载
              </el-button>
              <el-button link type="danger" @click.stop="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!loading" description="暂无记录" />
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

    <el-dialog v-model="viewVisible" title="会话详情" width="760px" destroy-on-close>
      <div v-loading="viewLoading">
        <template v-if="viewSession">
          <el-descriptions :column="2" border size="small" class="view-meta">
            <el-descriptions-item label="科目">
              {{ viewSession.subjectTrack === 'chinese' ? '语文' : '英语' }}
            </el-descriptions-item>
            <el-descriptions-item label="模式">
              {{ viewSession.reviewMode === 'gaokao' ? '高考评测' : '结构练习' }}
            </el-descriptions-item>
            <el-descriptions-item label="题目来源">
              {{ viewSession.topicSource === 'ai' ? 'AI 出题' : '自己定' }}
            </el-descriptions-item>
            <el-descriptions-item label="点评时间">
              {{ viewSession.reviewedAt ? formatDateTime(viewSession.reviewedAt) : '—' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="view-block">
            <div class="view-label">题目</div>
            <div class="view-text">{{ viewSession.topicText || '—' }}</div>
          </div>
          <div class="view-block">
            <div class="view-label">写作要求</div>
            <div class="view-text">{{ viewSession.topicRequirements || '—' }}</div>
          </div>
          <template v-if="viewSession.reviewMode !== 'gaokao'">
            <div class="view-block">
              <div class="view-label">提纲</div>
              <div class="view-text">{{ viewSession.outlineText || '—' }}</div>
            </div>
            <div class="view-block">
              <div class="view-label">首段</div>
              <div class="view-text">{{ viewSession.openingText || '—' }}</div>
            </div>
          </template>

          <div v-if="viewStructureReview" class="review-box view-review">
            <div class="review-title">结构点评</div>
            <div class="review-hint">{{ viewStructureReview.overallHint }}</div>
            <div class="review-grid">
              <div v-for="item in viewReviewCards" :key="item.key" class="review-card">
                <div class="review-card-head">
                  <span>{{ item.label }}</span>
                  <el-tag :type="levelTag(item.dim.level)" size="small">
                    {{ levelLabel(item.dim.level) }}
                  </el-tag>
                </div>
                <p>{{ item.dim.reason }}</p>
                <p class="suggest">建议：{{ item.dim.suggestion }}</p>
              </div>
            </div>
          </div>
          <div v-else-if="viewGaokaoReview" class="review-box view-review">
            <div class="review-title">
              高考评测
              <el-tag type="warning" size="small" style="margin-left: 8px">
                {{ viewGaokaoReview.totalScore }} / {{ viewGaokaoReview.fullScore }} 分
              </el-tag>
            </div>
            <div class="review-hint">{{ viewGaokaoReview.overall }}</div>
            <div class="review-grid">
              <div v-for="dim in viewGaokaoReview.dimensions" :key="dim.key" class="review-card">
                <div class="review-card-head">
                  <span>{{ dim.label }}</span>
                  <el-tag size="small">{{ dim.score }} / {{ dim.fullScore }}</el-tag>
                </div>
                <p>{{ dim.comment }}</p>
              </div>
            </div>
            <div v-if="viewGaokaoReview.analysis" class="gaokao-block">
              <div class="view-label">解析</div>
              <p>{{ viewGaokaoReview.analysis }}</p>
            </div>
            <ul v-if="viewGaokaoReview.deductions.length">
              <li v-for="(d, i) in viewGaokaoReview.deductions" :key="'vd' + i">{{ d }}</li>
            </ul>
            <ul v-if="viewGaokaoReview.suggestions.length">
              <li v-for="(s, i) in viewGaokaoReview.suggestions" :key="'vs' + i">{{ s }}</li>
            </ul>
            <div v-if="viewGaokaoReview.modelEssay" class="gaokao-block model-essay">
              <div class="view-label">原文升格稿（构句/语法/常用高级词）</div>
              <div class="view-text model-essay-text">{{ viewGaokaoReview.modelEssay }}</div>
              <ul v-if="viewGaokaoReview.modelEssayNotes && viewGaokaoReview.modelEssayNotes.length">
                <li v-for="(n, i) in viewGaokaoReview.modelEssayNotes" :key="'vn' + i">{{ n }}</li>
              </ul>
            </div>
          </div>
          <el-empty v-else description="尚未评测" :image-size="64" />

          <div class="view-block">
            <div class="view-label">{{ viewSession.reviewMode === 'gaokao' ? '全文' : '终稿' }}</div>
            <div class="view-text">{{ viewSession.finalDraftText || '—' }}</div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button
          :loading="pdfDownloading"
          :disabled="!viewSession"
          @click="onDownloadViewPdf"
        >
          下载 PDF
        </el-button>
        <el-button type="primary" :disabled="!viewSession" @click="onLoadToEditor">
          加载到编辑区
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadRequestOptions } from 'element-plus'
import { fetchMe } from '@/api/auth'
import {
  createWritingCoach,
  deleteWritingCoach,
  generateWritingTopic,
  getWritingCoach,
  isGaokaoReview,
  listWritingCoach,
  ocrWritingCoachImage,
  reviewGaokaoWritingCoach,
  reviewWritingCoach,
  type WritingCoachSession,
  type WritingReviewDimension,
  type WritingReviewLevel,
  type WritingReviewMode,
  type WritingStructureReview,
  type WritingSubjectTrack,
  type WritingTopicSource,
} from '@/api/writing-coach'
import { formatDateTime } from '@/utils/datetime'
import { downloadWritingCoachPdf } from '@/utils/writing-coach-pdf'

const workMode = ref<WritingReviewMode>('structure')
const track = ref<WritingSubjectTrack>('chinese')
const loading = ref(false)
const saving = ref(false)
const topicLoading = ref(false)
const reviewLoading = ref(false)
const ocrLoading = ref('')
const canUseOcr = ref(false)
const topicHint = ref('')
const editingId = ref<string | null>(null)
const review = ref<WritingCoachSession['review']>(null)
const rows = ref<WritingCoachSession[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const viewVisible = ref(false)
const viewLoading = ref(false)
const viewSession = ref<WritingCoachSession | null>(null)
const pdfDownloading = ref(false)
const pdfId = ref<string | null>(null)
const filters = reactive({
  keyword: '',
  topicSource: '' as '' | WritingTopicSource,
  hasReview: '' as '' | 'yes' | 'no',
})

const form = reactive({
  topicSource: 'manual' as WritingTopicSource,
  topicText: '',
  topicRequirements: '',
  outlineText: '',
  openingText: '',
  finalDraftText: '',
})

const alertTitle = computed(() =>
  workMode.value === 'gaokao'
    ? '高考评测：对照题目与要求给分+解析（练习参考，非官方阅卷）。题目/要求/全文可手写拍照识别，只存文字。AI 不代写。'
    : 'AI 只评：论点是否扣题、证据是否够、过渡是否糊。题目可自定或 AI 出题；提纲、首段、终稿必须自己写，AI 不代写。',
)

const historyTitle = computed(
  () =>
    `${track.value === 'chinese' ? '语文' : '英语'} · ${workMode.value === 'gaokao' ? '高考评测' : '结构练习'} · 历史`,
)

const structureReview = computed(() => {
  const r = review.value
  if (!r || isGaokaoReview(r)) return null
  return r as WritingStructureReview
})

const gaokaoReview = computed(() => {
  const r = review.value
  return isGaokaoReview(r) ? r : null
})

const viewStructureReview = computed(() => {
  const r = viewSession.value?.review
  if (!r || isGaokaoReview(r)) return null
  return r as WritingStructureReview
})

const viewGaokaoReview = computed(() => {
  const r = viewSession.value?.review
  return isGaokaoReview(r) ? r : null
})

const reviewCards = computed(() => {
  if (!structureReview.value) return [] as Array<{ key: string; label: string; dim: WritingReviewDimension }>
  return [
    { key: 'onTopic', label: '论点扣题', dim: structureReview.value.onTopic },
    { key: 'evidence', label: '证据是否够', dim: structureReview.value.evidence },
    { key: 'transition', label: '过渡是否糊', dim: structureReview.value.transition },
  ]
})

const viewReviewCards = computed(() => {
  const r = viewStructureReview.value
  if (!r) return [] as Array<{ key: string; label: string; dim: WritingReviewDimension }>
  return [
    { key: 'onTopic', label: '论点扣题', dim: r.onTopic },
    { key: 'evidence', label: '证据是否够', dim: r.evidence },
    { key: 'transition', label: '过渡是否糊', dim: r.transition },
  ]
})

function errMsg(e: unknown, fallback: string) {
  const any = e as { response?: { data?: { message?: string | string[] } }; message?: string }
  const m = any?.response?.data?.message
  if (Array.isArray(m)) return m.join('；') || fallback
  return m || any?.message || fallback
}

function preview(text: string) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  return t.length > 40 ? `${t.slice(0, 40)}…` : t || '—'
}

function sortReviewFlag(
  a: { review: unknown },
  b: { review: unknown },
) {
  return Number(!!b.review) - Number(!!a.review)
}

function levelLabel(level: WritingReviewLevel) {
  if (level === 'pass') return '通过'
  if (level === 'weak') return '偏弱'
  return '不足'
}

function levelTag(level: WritingReviewLevel) {
  if (level === 'pass') return 'success'
  if (level === 'weak') return 'warning'
  return 'danger'
}

function resetForm() {
  editingId.value = null
  review.value = null
  form.topicSource = 'manual'
  form.topicText = ''
  form.topicRequirements = ''
  form.outlineText = ''
  form.openingText = ''
  form.finalDraftText = ''
  topicHint.value = ''
}

function fillFromSession(row: WritingCoachSession) {
  // 加载历史仅填充表单；再次保存/评测会新建，不覆盖原记录
  editingId.value = null
  workMode.value = row.reviewMode === 'gaokao' ? 'gaokao' : 'structure'
  form.topicSource = row.topicSource
  form.topicText = row.topicText || ''
  form.topicRequirements = row.topicRequirements || ''
  form.outlineText = row.outlineText || ''
  form.openingText = row.openingText || ''
  form.finalDraftText = row.finalDraftText || ''
  review.value = row.review
}

async function reload() {
  loading.value = true
  try {
    const data = await listWritingCoach({
      subjectTrack: track.value,
      reviewMode: workMode.value,
      topicSource: filters.topicSource || undefined,
      hasReview: filters.hasReview || undefined,
      keyword: filters.keyword.trim() || undefined,
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

function onWorkModeChange(name: string | number) {
  const next = String(name) as WritingReviewMode
  if (next === 'structure' || next === 'gaokao') workMode.value = next
  page.value = 1
  filters.keyword = ''
  filters.topicSource = ''
  filters.hasReview = ''
  resetForm()
  void reload()
}

function onTrackChange(name: string | number) {
  const next = String(name) as WritingSubjectTrack
  if (next === 'chinese' || next === 'english') track.value = next
  page.value = 1
  filters.keyword = ''
  filters.topicSource = ''
  filters.hasReview = ''
  resetForm()
  void reload()
}

function onFilterSearch() {
  page.value = 1
  void reload()
}

function onPage(p: number) {
  page.value = p
  void reload()
}

async function onView(row: WritingCoachSession) {
  viewVisible.value = true
  viewLoading.value = true
  viewSession.value = null
  try {
    viewSession.value = await getWritingCoach(row.id)
  } catch (e) {
    viewSession.value = row
    ElMessage.warning(errMsg(e, '详情加载失败，已显示列表中的数据'))
  } finally {
    viewLoading.value = false
  }
}

function onLoadToEditor() {
  if (!viewSession.value) return
  fillFromSession(viewSession.value)
  viewVisible.value = false
  ElMessage.success('已加载到左侧；再次保存或评测将新增一条，不会覆盖原记录')
}

async function exportSessionPdf(session: WritingCoachSession) {
  await downloadWritingCoachPdf(session)
  ElMessage.success('PDF 已开始下载')
}

async function onDownloadViewPdf() {
  if (!viewSession.value) return
  pdfDownloading.value = true
  try {
    await exportSessionPdf(viewSession.value)
  } catch (e) {
    ElMessage.error(errMsg(e, 'PDF 下载失败'))
  } finally {
    pdfDownloading.value = false
  }
}

async function onDownloadPdf(row: WritingCoachSession) {
  pdfId.value = row.id
  try {
    let session = row
    try {
      session = await getWritingCoach(row.id)
    } catch {
      // 列表数据兜底
    }
    await exportSessionPdf(session)
  } catch (e) {
    ElMessage.error(errMsg(e, 'PDF 下载失败'))
  } finally {
    pdfId.value = null
  }
}

async function onGenerateTopic() {
  topicLoading.value = true
  try {
    const data = await generateWritingTopic({
      subjectTrack: track.value,
      hint: topicHint.value || null,
    })
    form.topicSource = 'ai'
    form.topicText = data.topicText
    form.topicRequirements = data.topicRequirements || ''
    ElMessage.success('已生成题目，可自行修改')
  } catch (e) {
    ElMessage.error(errMsg(e, '出题失败'))
  } finally {
    topicLoading.value = false
  }
}

/** 始终新建会话，保留每次练习过程，不覆盖历史 */
async function ensureNewSession() {
  const saved = await createWritingCoach({
    subjectTrack: track.value,
    topicSource: form.topicSource,
    reviewMode: workMode.value,
    topicText: form.topicText.trim(),
    topicRequirements: form.topicRequirements.trim() || null,
    outlineText: form.outlineText.trim() || null,
    openingText: form.openingText.trim() || null,
    finalDraftText: form.finalDraftText.trim() || null,
  })
  editingId.value = saved.id
  return saved
}

async function onSave() {
  if (!form.topicText.trim()) {
    ElMessage.warning('请填写题目')
    return
  }
  saving.value = true
  try {
    const saved = await ensureNewSession()
    review.value = saved.review
    ElMessage.success('已保存为新记录')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

async function onReview() {
  if (!form.topicText.trim()) {
    ElMessage.warning('请先填写题目')
    return
  }
  if (!form.outlineText.trim() || !form.openingText.trim()) {
    ElMessage.warning('请先写提纲和首段')
    return
  }
  saving.value = true
  try {
    await ensureNewSession()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败，无法点评'))
    saving.value = false
    return
  } finally {
    saving.value = false
  }

  reviewLoading.value = true
  try {
    const data = await reviewWritingCoach({
      id: editingId.value!,
      subjectTrack: track.value,
      topicText: form.topicText.trim(),
      topicRequirements: form.topicRequirements.trim() || null,
      outlineText: form.outlineText.trim(),
      openingText: form.openingText.trim(),
    })
    review.value = data.review
    if (data.session) fillFromSession(data.session)
    ElMessage.success('点评完成')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '点评失败'))
  } finally {
    reviewLoading.value = false
  }
}

async function onGaokaoReview() {
  if (!form.topicText.trim()) {
    ElMessage.warning('请先填写题目')
    return
  }
  if (!form.finalDraftText.trim()) {
    ElMessage.warning('请先填写全文')
    return
  }
  saving.value = true
  try {
    await ensureNewSession()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败，无法评测'))
    saving.value = false
    return
  } finally {
    saving.value = false
  }

  reviewLoading.value = true
  try {
    const data = await reviewGaokaoWritingCoach({
      id: editingId.value!,
      subjectTrack: track.value,
      topicText: form.topicText.trim(),
      topicRequirements: form.topicRequirements.trim() || null,
      essayText: form.finalDraftText.trim(),
    })
    review.value = data.review
    if (data.session) fillFromSession(data.session)
    ElMessage.success('评测完成，已按原文升格（非整篇另写）')
    await reload()
  } catch (e) {
    ElMessage.error(errMsg(e, '评测失败'))
  } finally {
    reviewLoading.value = false
  }
}

async function ocrTopic(opt: UploadRequestOptions) {
  return onOcr(opt, 'topicText')
}
async function ocrRequirements(opt: UploadRequestOptions) {
  return onOcr(opt, 'topicRequirements')
}
async function ocrEssay(opt: UploadRequestOptions) {
  return onOcr(opt, 'finalDraftText')
}

async function onOcr(opt: UploadRequestOptions, field: 'topicText' | 'topicRequirements' | 'finalDraftText') {
  const file = opt.file as File
  if (!file) return
  ocrLoading.value = field
  try {
    const data = await ocrWritingCoachImage(file)
    const incoming = (data.text || '').trim()
    if (!incoming) {
      ElMessage.warning('未识别到文字')
      return
    }
    const prev = form[field].trim()
    form[field] = prev ? `${prev}\n\n${incoming}` : incoming
    ElMessage.success('已识别并填入文字，请核对后保存')
  } catch (e) {
    ElMessage.error(errMsg(e, '识别失败，请确认 OCR 服务已启动（9100）'))
  } finally {
    ocrLoading.value = ''
  }
}

async function onDelete(row: WritingCoachSession) {
  try {
    await ElMessageBox.confirm('确定删除该练习会话？', '提示', { type: 'warning' })
    await deleteWritingCoach(row.id)
    if (editingId.value === row.id) resetForm()
    ElMessage.success('已删除')
    await reload()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e, '删除失败'))
  }
}

onMounted(async () => {
  try {
    const me = await fetchMe()
    canUseOcr.value = !!me.ocrEnabled
  } catch {
    canUseOcr.value = false
  }
  void reload()
})
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
.layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1.1fr) minmax(320px, 0.9fr);
  gap: 16px;
}
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  min-height: 0;
  overflow: auto;
}
.compose {
  display: flex;
  flex-direction: column;
}
.panel-head,
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.history-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
  align-items: center;
}
.panel-head h2,
.history-head h2 {
  margin: 0;
  font-size: 16px;
}
.history {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.row-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}
.ocr-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.ocr-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.review-box {
  margin: 8px 0 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}
.review-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.review-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.review-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
  background: var(--el-bg-color);
}
.review-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-weight: 600;
}
.review-card p {
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.5;
}
.suggest {
  color: var(--el-text-color-secondary);
}
.gaokao-block {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.6;
}
.gaokao-block p,
.gaokao-block ul {
  margin: 4px 0 0;
  padding-left: 18px;
}
.save-hint {
  width: 100%;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
.draft-form {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.view-meta {
  margin-bottom: 12px;
}
.view-block {
  margin-bottom: 12px;
}
.view-label {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 13px;
}
.view-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  max-height: 220px;
  overflow: auto;
}
.model-essay-text {
  max-height: 360px;
  white-space: pre-wrap;
}
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .review-grid {
    grid-template-columns: 1fr;
  }
}
</style>
