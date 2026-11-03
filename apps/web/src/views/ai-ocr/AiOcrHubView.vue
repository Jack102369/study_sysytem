<template>
  <div class="page-scroll ai-ocr-page" v-loading="pageLoading">
    <div class="toolbar">
      <h1>AI 识题</h1>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="独立模块：与错题本、高一数学数据隔离。题目/作答图片将发送至识别服务；文字将发送至所选模型。分数与解析仅供参考，请人工核对。"
      style="margin-bottom: 12px"
    />

    <el-alert
      v-if="!canUse"
      type="error"
      :closable="false"
      show-icon
      title="当前账号未同时开启 OCR 与 AI 权限，请联系管理员开通后再使用。"
      style="margin-bottom: 12px"
    />

    <div class="layout">
      <section class="panel">
        <h2>上传识别</h2>
        <el-form label-width="88px" @submit.prevent>
          <el-form-item label="科目" required>
            <el-radio-group v-model="subject" :disabled="!canUse || recognizing">
              <el-radio-button value="math">数学</el-radio-button>
              <el-radio-button value="physics">物理</el-radio-button>
              <el-radio-button value="chemistry">化学</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="题目图片" required>
            <el-upload
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
              :disabled="!canUse || recognizing"
              :on-change="onQuestionFileChange"
            >
              <div class="upload-inner">
                <p>拖拽或点击选择题目图片</p>
                <p class="hint">支持 png / jpg / webp 等；不支持 SVG</p>
              </div>
            </el-upload>
            <div v-if="questionPreviewUrl" class="preview">
              <el-image
                :src="questionPreviewUrl"
                fit="contain"
                :preview-src-list="[questionPreviewUrl]"
                preview-teleported
              />
              <div class="preview-name">{{ questionFileName }}</div>
            </div>
          </el-form-item>
          <el-form-item label="隐私确认" required>
            <el-checkbox v-model="consentOcr" :disabled="!canUse || recognizing">
              我已了解：题目图片将发送给外部识别服务（Qwen）
            </el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="recognizing"
              :disabled="!canUse || !questionFile || !consentOcr"
              @click="onRecognize"
            >
              开始识别
            </el-button>
          </el-form-item>
        </el-form>
      </section>

      <section class="panel">
        <h2>题目原文</h2>
        <template v-if="current">
          <div class="meta-row">
            <el-tag size="small">{{ subjectText(current.subject) }}</el-tag>
            <el-tag
              size="small"
              :type="
                current.status === 'succeeded'
                  ? 'success'
                  : current.status === 'failed'
                    ? 'danger'
                    : 'info'
              "
            >
              {{ statusText(current.status) }}
            </el-tag>
            <span class="meta-id">#{{ current.id }}</span>
            <span v-if="current.engine" class="meta-engine">{{ current.engine }}</span>
          </div>
          <div v-if="currentStemUrl" class="stem-image">
            <p class="label">原始图片</p>
            <el-image
              :src="currentStemUrl"
              fit="contain"
              :preview-src-list="[currentStemUrl]"
              preview-teleported
            />
          </div>
          <el-alert
            v-if="current.status === 'failed'"
            type="error"
            :closable="false"
            :title="current.errorMessage || '识别失败'"
            style="margin-bottom: 8px"
          />
          <p class="label">识别文字（可改）</p>
          <el-input
            v-model="editableText"
            type="textarea"
            :rows="8"
            placeholder="识别成功后可在此修正题目文字"
            :disabled="current.status !== 'succeeded' || busy"
          />
          <div v-if="editableText.trim()" class="math-preview">
            <p class="label">公式预览</p>
            <div class="block scrollable">
              <MathStem :text="editableText" />
            </div>
          </div>
        </template>
        <el-empty v-else description="上传题目图片并识别后，原文与文字会显示在这里" :image-size="80" />
      </section>
    </div>

    <section class="panel work-panel" v-if="current && current.status === 'succeeded'">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="AI 解答" name="solve">
          <el-form label-width="88px">
            <el-form-item label="模型">
              <el-radio-group v-model="provider" :disabled="analyzing">
                <el-radio-button value="qwen">Qwen</el-radio-button>
                <el-radio-button value="deepseek">DeepSeek</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="隐私确认" required>
              <el-checkbox v-model="consentParse" :disabled="analyzing">
                我已了解：题目文字将发送给所选模型生成标准答案与解析（无需上传作答）
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="analyzing"
                :disabled="!consentParse || !editableText.trim()"
                @click="onAnalyze"
              >
                开始解答
              </el-button>
              <el-button :disabled="analyzing" @click="reloadAnalyses">刷新</el-button>
            </el-form-item>
          </el-form>

          <div v-if="analyses.length" class="result-box">
            <div class="history-head">
              <h3>解答历史（{{ analyses.length }}）</h3>
            </div>
            <el-collapse v-model="expandedAnalysisIds">
              <el-collapse-item
                v-for="item in analyses"
                :key="item.id"
                :name="item.id"
              >
                <template #title>
                  <div class="collapse-title">
                    <el-tag size="small">{{ providerText(item.provider) }}</el-tag>
                    <el-tag
                      size="small"
                      :type="
                        item.status === 'succeeded'
                          ? 'success'
                          : item.status === 'failed'
                            ? 'danger'
                            : 'info'
                      "
                    >
                      {{ statusText(item.status) }}
                    </el-tag>
                    <span class="meta-id">#{{ item.id }}</span>
                    <span class="meta-engine">{{ formatTime(item.createdAt) }}</span>
                    <span v-if="item.model" class="meta-engine">{{ item.model }}</span>
                    <el-button
                      class="del-btn"
                      link
                      type="danger"
                      :loading="deletingAnalysisId === item.id"
                      @click.stop="onDeleteAnalysis(item)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
                <el-alert
                  v-if="item.status === 'failed'"
                  type="error"
                  :closable="false"
                  :title="item.errorMessage || '解答失败'"
                  style="margin-bottom: 8px"
                />
                <el-alert
                  v-else-if="item.compareVerdict"
                  :type="compareAlertType(item.compareVerdict)"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 8px"
                  :title="compareAlertTitle(item)"
                >
                  <div v-if="item.compareNote" class="compare-note">
                    <MathStem :text="item.compareNote" />
                  </div>
                  <p class="compare-hint">
                    对比仅标明与其他模型的异同，不会改写本条答案；请人工核对。
                  </p>
                </el-alert>
                <el-collapse
                  v-if="item.status === 'succeeded'"
                  class="section-collapse"
                  :model-value="getSectionExpand(item.id)"
                  @update:model-value="(v: string | string[]) => setSectionExpand(item.id, v)"
                >
                  <el-collapse-item title="答案" name="answer">
                    <div class="block scrollable">
                      <MathStem :text="item.aiAnswerText" />
                    </div>
                  </el-collapse-item>
                  <el-collapse-item title="解析" name="analysis">
                    <div class="block scrollable tall">
                      <MathStem :text="item.aiAnalysisText" />
                    </div>
                  </el-collapse-item>
                  <el-collapse-item
                    v-if="item.knowledgePointsText"
                    title="本题考查的知识点"
                    name="knowledge"
                  >
                    <div class="block scrollable">
                      <MathStem :text="item.knowledgePointsText" />
                    </div>
                  </el-collapse-item>
                  <el-collapse-item
                    v-if="item.methodSummaryText"
                    title="解题思路总结"
                    name="method"
                  >
                    <div class="block scrollable">
                      <MathStem :text="item.methodSummaryText" />
                    </div>
                  </el-collapse-item>
                  <el-collapse-item
                    v-if="item.selfCheckText"
                    title="自检"
                    name="selfCheck"
                  >
                    <div class="block scrollable">
                      <MathStem :text="item.selfCheckText" />
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </el-collapse-item>
            </el-collapse>
          </div>
          <el-empty v-else description="尚未解答；也可直接到「作答批改」提交（无作答则 0 分并给标准解析）" :image-size="64" />
        </el-tab-pane>

        <el-tab-pane label="作答批改" name="grade">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="可填写文字作答，也可上传作答图。都不填则得分 0，并给出 AI 标准答案与解析。"
            style="margin-bottom: 12px"
          />
          <el-form label-width="88px">
            <el-form-item label="我的作答">
              <el-input
                v-model="studentAnswerText"
                type="textarea"
                :rows="6"
                placeholder="可空：留空且不上传作答图 → 0 分 + 标准解析"
                :disabled="grading"
              />
            </el-form-item>
            <el-form-item label="作答图片">
              <el-upload
                drag
                :auto-upload="false"
                :show-file-list="false"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
                :disabled="grading"
                :on-change="onAnswerFileChange"
              >
                <div class="upload-inner">
                  <p>可选：拖拽或点击上传作答图片（提交批改时 OCR）</p>
                </div>
              </el-upload>
              <div v-if="answerPreviewUrl" class="preview">
                <el-image
                  :src="answerPreviewUrl"
                  fit="contain"
                  :preview-src-list="[answerPreviewUrl]"
                  preview-teleported
                />
                <div class="preview-name">
                  {{ answerFileName }}
                  <el-button link type="danger" :disabled="grading" @click="clearAnswerFile">清除</el-button>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="模型">
              <el-radio-group v-model="gradeProvider" :disabled="grading">
                <el-radio-button value="qwen">Qwen</el-radio-button>
                <el-radio-button value="deepseek">DeepSeek</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="隐私确认" required>
              <el-checkbox v-model="consentGrade" :disabled="grading">
                我已了解：题目/作答文字（及作答图）将发送给所选模型批改
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="grading"
                :disabled="!consentGrade || !editableText.trim()"
                @click="onGrade"
              >
                提交批改
              </el-button>
              <el-button :disabled="grading" @click="reloadGradings">刷新</el-button>
            </el-form-item>
          </el-form>

          <div v-if="latestGrading" class="result-box">
            <h3>最新批改</h3>
            <div class="meta-row">
              <el-tag size="small">{{ providerText(latestGrading.provider) }}</el-tag>
              <el-tag
                size="small"
                :type="
                  latestGrading.status === 'succeeded'
                    ? 'success'
                    : latestGrading.status === 'failed'
                      ? 'danger'
                      : 'info'
                "
              >
                {{ statusText(latestGrading.status) }}
              </el-tag>
              <el-tag
                v-if="latestGrading.status === 'succeeded' && latestGrading.score !== null"
                size="small"
                type="warning"
              >
                {{ latestGrading.score }} 分
              </el-tag>
              <el-tag
                v-if="latestGrading.verdict"
                size="small"
                :type="verdictTagType(latestGrading.verdict)"
              >
                {{ verdictText(latestGrading.verdict) }}
              </el-tag>
              <span v-if="latestGrading.model" class="meta-engine">{{ latestGrading.model }}</span>
            </div>
            <el-alert
              v-if="latestGrading.status === 'failed'"
              type="error"
              :closable="false"
              :title="latestGrading.errorMessage || '批改失败'"
              style="margin-bottom: 8px"
            />
            <template v-else-if="latestGrading.status === 'succeeded'">
              <p class="label">过程点评</p>
              <div class="block scrollable">
                <MathStem :text="latestGrading.feedbackText" />
              </div>
              <p class="label">标准答案</p>
              <div class="block scrollable">
                <MathStem :text="latestGrading.correctAnswerText" />
              </div>
              <p class="label">标准解析</p>
              <div class="block scrollable tall">
                <MathStem :text="latestGrading.correctAnalysisText" />
              </div>
            </template>
          </div>
          <el-empty v-else description="暂无批改记录" :image-size="64" />
        </el-tab-pane>
      </el-tabs>
    </section>

    <section class="panel history">
      <div class="history-head">
        <h2>最近识别</h2>
        <el-button text type="primary" :disabled="!canUse" @click="reloadHistory">刷新</el-button>
      </div>
      <el-table v-if="history.length" :data="history" size="small" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="原图" width="88">
          <template #default="{ row }">
            <el-image
              v-if="row.attachmentUrl"
              class="hist-thumb"
              :src="fileUrl(row.attachmentUrl)"
              fit="cover"
              :preview-src-list="[fileUrl(row.attachmentUrl)]"
              preview-teleported
            />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="科目" width="70">
          <template #default="{ row }">{{ subjectText(row.subject) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="
                row.status === 'succeeded'
                  ? 'success'
                  : row.status === 'failed'
                    ? 'danger'
                    : 'info'
              "
            >
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预览" min-width="200">
          <template #default="{ row }">
            {{ previewText(row.recognizedTextRaw) || row.errorMessage || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="selectHistory(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无识别记录" :image-size="64" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { UploadFile } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchMe } from '@/api/auth'
import { uploadAttachment } from '@/api/attachments'
import {
  createAiOcrAnalysis,
  createAiOcrGrading,
  createAiOcrRecognition,
  deleteAiOcrAnalysis,
  listAiOcrAnalyses,
  listAiOcrGradings,
  listAiOcrRecognitions,
  type AiOcrAnalysis,
  type AiOcrCompareVerdict,
  type AiOcrGrading,
  type AiOcrProvider,
  type AiOcrRecognition,
  type AiOcrSubject,
  type AiOcrVerdict,
} from '@/api/ai-ocr'
import MathStem from '@/components/hs-math/MathStem.vue'
import { fileUrl } from '@/utils/api-base'
import errMsg from '@/utils/err-msg'
import { normalizeOcrLatexEscapes } from '@/utils/render-math'

const pageLoading = ref(false)
const recognizing = ref(false)
const analyzing = ref(false)
const grading = ref(false)
const canUseOcr = ref(false)
const canUseAi = ref(false)
const canUse = computed(() => canUseOcr.value && canUseAi.value)
const busy = computed(() => analyzing.value || grading.value)

const subject = ref<AiOcrSubject>('math')
const provider = ref<AiOcrProvider>('qwen')
const gradeProvider = ref<AiOcrProvider>('qwen')
const consentOcr = ref(false)
const consentParse = ref(false)
const consentGrade = ref(false)
const activeTab = ref('solve')

const questionFile = ref<File | null>(null)
const questionFileName = ref('')
const questionPreviewUrl = ref('')

const answerFile = ref<File | null>(null)
const answerFileName = ref('')
const answerPreviewUrl = ref('')

const current = ref<AiOcrRecognition | null>(null)
const editableText = ref('')
const studentAnswerText = ref('')
const analyses = ref<AiOcrAnalysis[]>([])
const expandedAnalysisIds = ref<string[]>([])
/** 每条解答内部：答案/解析/知识点/思路 的展开项，默认只开「答案」 */
const expandedSections = ref<Record<string, string[]>>({})
const deletingAnalysisId = ref<string | null>(null)
const latestGrading = ref<AiOcrGrading | null>(null)

function getSectionExpand(analysisId: string): string[] {
  if (!expandedSections.value[analysisId]) {
    expandedSections.value[analysisId] = ['answer']
  }
  return expandedSections.value[analysisId]
}

function setSectionExpand(analysisId: string, val: string | string[]) {
  expandedSections.value[analysisId] = Array.isArray(val) ? val : [val]
}
const history = ref<AiOcrRecognition[]>([])

const currentStemUrl = computed(() => {
  const u = current.value?.attachmentUrl
  return u ? fileUrl(u) : ''
})

function applyRecognitionText(raw: string | null | undefined) {
  return normalizeOcrLatexEscapes(String(raw || ''))
}

function subjectText(s: AiOcrSubject) {
  if (s === 'math') return '数学'
  if (s === 'physics') return '物理'
  return '化学'
}

function providerText(p: AiOcrProvider) {
  return p === 'qwen' ? 'Qwen' : 'DeepSeek'
}

function statusText(s: string) {
  if (s === 'succeeded') return '成功'
  if (s === 'failed') return '失败'
  return '处理中'
}

function verdictText(v: AiOcrVerdict) {
  if (v === 'correct') return '全对'
  if (v === 'partial') return '部分正确'
  if (v === 'wrong') return '错误'
  return '未作答'
}

function compareAlertType(v: AiOcrCompareVerdict) {
  if (v === 'agree') return 'success'
  if (v === 'differ') return 'warning'
  return 'info'
}

function compareAlertTitle(item: AiOcrAnalysis) {
  const prior = item.comparedAnalysisId ? `#${item.comparedAnalysisId}` : '先前解答'
  if (item.compareVerdict === 'agree') return `与 ${prior} 对比：答案一致`
  if (item.compareVerdict === 'differ')
    return `与 ${prior} 对比：答案不一致（各保留原文，请对照差异）`
  return `与 ${prior} 对比：无法确定是否一致`
}

function verdictTagType(v: AiOcrVerdict) {
  if (v === 'correct') return 'success'
  if (v === 'partial') return 'warning'
  if (v === 'wrong') return 'danger'
  return 'info'
}

function previewText(text: string | null) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  return t.length > 80 ? `${t.slice(0, 80)}…` : t
}

function formatTime(v: string) {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v || '').slice(0, 19)
  return d.toLocaleString()
}

function revokeUrl(url: string) {
  if (url) URL.revokeObjectURL(url)
}

function onQuestionFileChange(file: UploadFile) {
  const raw = file.raw
  if (!raw) return
  if (!raw.type.startsWith('image/') || /svg/i.test(raw.type) || /\.svg$/i.test(raw.name)) {
    ElMessage.warning('仅支持普通图片，不支持 SVG')
    return
  }
  revokeUrl(questionPreviewUrl.value)
  questionFile.value = raw
  questionFileName.value = raw.name
  questionPreviewUrl.value = URL.createObjectURL(raw)
}

function onAnswerFileChange(file: UploadFile) {
  const raw = file.raw
  if (!raw) return
  if (!raw.type.startsWith('image/') || /svg/i.test(raw.type) || /\.svg$/i.test(raw.name)) {
    ElMessage.warning('仅支持普通图片，不支持 SVG')
    return
  }
  revokeUrl(answerPreviewUrl.value)
  answerFile.value = raw
  answerFileName.value = raw.name
  answerPreviewUrl.value = URL.createObjectURL(raw)
}

function clearAnswerFile() {
  revokeUrl(answerPreviewUrl.value)
  answerFile.value = null
  answerFileName.value = ''
  answerPreviewUrl.value = ''
}

async function confirmPrivacy(message: string) {
  await ElMessageBox.confirm(message, '隐私确认', {
    type: 'warning',
    confirmButtonText: '同意并继续',
    cancelButtonText: '取消',
  })
}

async function onRecognize() {
  if (!canUse.value) {
    ElMessage.warning('请先开通 OCR 与 AI 权限')
    return
  }
  if (!questionFile.value) {
    ElMessage.warning('请先选择题目图片')
    return
  }
  if (!consentOcr.value) {
    ElMessage.warning('请先勾选隐私确认')
    return
  }
  try {
    await confirmPrivacy('确认将题目图片发送给外部识别服务（Qwen）？')
  } catch {
    return
  }

  recognizing.value = true
  try {
    const att = await uploadAttachment(questionFile.value)
    const row = await createAiOcrRecognition({
      subject: subject.value,
      attachmentId: att.id,
      consentAccepted: true,
    })
    current.value = row
    editableText.value = applyRecognitionText(row.recognizedTextRaw)
    studentAnswerText.value = ''
    clearAnswerFile()
    analyses.value = []
    expandedAnalysisIds.value = []
    expandedSections.value = {}
    latestGrading.value = null
    consentParse.value = false
    consentGrade.value = false
    activeTab.value = 'solve'
    ElMessage.success(row.status === 'succeeded' ? '识别完成，请核对文字' : '识别已记录')
    await reloadHistory()
  } catch (e) {
    ElMessage.error(errMsg(e, '识别失败'))
  } finally {
    recognizing.value = false
  }
}

async function onAnalyze() {
  if (!current.value || current.value.status !== 'succeeded') {
    ElMessage.warning('请先完成识别')
    return
  }
  if (!consentParse.value) {
    ElMessage.warning('请先勾选隐私确认')
    return
  }
  const text = editableText.value.trim()
  if (!text) {
    ElMessage.warning('题目文字不能为空')
    return
  }
  try {
    await confirmPrivacy(`确认将题目文字发送给 ${providerText(provider.value)} 生成解答？`)
  } catch {
    return
  }

  analyzing.value = true
  try {
    const row = await createAiOcrAnalysis(current.value.id, {
      provider: provider.value,
      inputText: text,
      consentAccepted: true,
    })
    await reloadAnalyses(row.id)
    ElMessage.success(row.status === 'succeeded' ? '解答完成' : '解答已记录')
  } catch (e) {
    ElMessage.error(errMsg(e, '解答失败'))
  } finally {
    analyzing.value = false
  }
}

async function onGrade() {
  if (!current.value || current.value.status !== 'succeeded') {
    ElMessage.warning('请先完成识别')
    return
  }
  if (!consentGrade.value) {
    ElMessage.warning('请先勾选隐私确认')
    return
  }
  const questionText = editableText.value.trim()
  if (!questionText) {
    ElMessage.warning('题目文字不能为空')
    return
  }
  const hasAnswerText = !!studentAnswerText.value.trim()
  const hasAnswerImage = !!answerFile.value
  try {
    if (!hasAnswerText && !hasAnswerImage) {
      await confirmPrivacy(
        `未填写作答且未上传作答图，将记 0 分并由 ${providerText(gradeProvider.value)} 给出标准解析。确认继续？`,
      )
    } else {
      await confirmPrivacy(
        `确认将题目与作答发送给 ${providerText(gradeProvider.value)} 批改？`,
      )
    }
  } catch {
    return
  }

  grading.value = true
  try {
    let answerAttachmentId: string | undefined
    if (answerFile.value) {
      const att = await uploadAttachment(answerFile.value)
      answerAttachmentId = att.id
    }
    // 仅作答图：不传 studentAnswerText，后端用 OCR；双空：传 '' 走 0 分
    const payload: {
      provider: AiOcrProvider
      questionText: string
      studentAnswerText?: string
      answerAttachmentId?: string
      consentAccepted: true
    } = {
      provider: gradeProvider.value,
      questionText,
      consentAccepted: true,
    }
    if (answerAttachmentId) payload.answerAttachmentId = answerAttachmentId
    if (hasAnswerText) payload.studentAnswerText = studentAnswerText.value.trim()
    else if (!hasAnswerImage) payload.studentAnswerText = ''

    const row = await createAiOcrGrading(current.value.id, payload)
    latestGrading.value = row
    if (
      row.status === 'succeeded' &&
      row.studentAnswerSnapshot &&
      !studentAnswerText.value.trim()
    ) {
      studentAnswerText.value = row.studentAnswerSnapshot
    }
    ElMessage.success(
      row.status === 'succeeded'
        ? row.verdict === 'no_answer'
          ? '未作答，已给出标准解析（0 分）'
          : `批改完成：${row.score ?? '—'} 分`
        : '批改已记录',
    )
  } catch (e) {
    ElMessage.error(errMsg(e, '批改失败'))
  } finally {
    grading.value = false
  }
}

async function reloadAnalyses(preferExpandId?: string) {
  if (!current.value) return
  try {
    const page = await listAiOcrAnalyses(current.value.id, {
      page: 1,
      pageSize: 50,
    })
    analyses.value = page.items
    const prefer =
      preferExpandId && page.items.some((x) => x.id === preferExpandId)
        ? preferExpandId
        : page.items[0]?.id
    expandedAnalysisIds.value = prefer ? [prefer] : []
  } catch (e) {
    ElMessage.error(errMsg(e, '加载解答失败'))
  }
}

async function onDeleteAnalysis(item: AiOcrAnalysis) {
  if (!current.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除该解答记录 #${item.id}（${providerText(item.provider)}）？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  deletingAnalysisId.value = item.id
  try {
    await deleteAiOcrAnalysis(current.value.id, item.id)
    delete expandedSections.value[item.id]
    expandedAnalysisIds.value = expandedAnalysisIds.value.filter(
      (id) => id !== item.id,
    )
    ElMessage.success('已删除')
    await reloadAnalyses()
  } catch (e) {
    ElMessage.error(errMsg(e, '删除失败'))
  } finally {
    deletingAnalysisId.value = null
  }
}

async function reloadGradings() {
  if (!current.value) return
  try {
    const page = await listAiOcrGradings(current.value.id, { page: 1, pageSize: 1 })
    latestGrading.value = page.items[0] || null
  } catch (e) {
    ElMessage.error(errMsg(e, '加载批改失败'))
  }
}

async function reloadHistory() {
  if (!canUse.value) {
    history.value = []
    return
  }
  try {
    const page = await listAiOcrRecognitions({ page: 1, pageSize: 20 })
    history.value = page.items
  } catch (e) {
    ElMessage.error(errMsg(e, '加载历史失败'))
  }
}

async function selectHistory(row: AiOcrRecognition) {
  current.value = row
  subject.value = row.subject
  editableText.value = applyRecognitionText(row.recognizedTextRaw)
  studentAnswerText.value = ''
  clearAnswerFile()
  consentParse.value = false
  consentGrade.value = false
  analyses.value = []
  expandedAnalysisIds.value = []
  expandedSections.value = {}
  latestGrading.value = null
  activeTab.value = 'solve'
  if (row.status === 'succeeded') {
    await Promise.all([reloadAnalyses(), reloadGradings()])
  }
}

onMounted(async () => {
  pageLoading.value = true
  try {
    const me = await fetchMe()
    canUseOcr.value = !!me.ocrEnabled
    canUseAi.value = !!me.aiEnabled
    if (canUse.value) await reloadHistory()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    pageLoading.value = false
  }
})
</script>

<style scoped>
.ai-ocr-page .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.ai-ocr-page h1 {
  margin: 0;
  font-size: 22px;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 12px;
  margin-bottom: 12px;
}
@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
.panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 16px 8px;
}
.work-panel {
  margin-bottom: 12px;
}
.panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}
.panel h3 {
  margin: 0 0 8px;
  font-size: 14px;
}
.upload-inner {
  padding: 12px 0;
  color: var(--el-text-color-regular);
}
.upload-inner .hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.preview {
  margin-top: 10px;
}
.preview .el-image {
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}
.preview-name {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
  display: flex;
  gap: 8px;
  align-items: center;
}
.stem-image {
  margin-bottom: 10px;
}
.stem-image .el-image {
  width: 100%;
  max-height: 280px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank);
}
.math-preview {
  margin-top: 8px;
}
.hist-thumb {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.meta-id,
.meta-engine {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.result-box {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.label {
  margin: 8px 0 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.block {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
}
.block.scrollable {
  max-height: 240px;
  overflow-y: auto;
  overflow-x: auto;
}
.block.scrollable.tall {
  max-height: 420px;
}
.history {
  margin-bottom: 8px;
}
.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.history-head h2,
.history-head h3 {
  margin: 0;
}
.collapse-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding-right: 8px;
  width: 100%;
}
.collapse-title .del-btn {
  margin-left: auto;
}
.ai-ocr-page :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 48px;
  line-height: 1.4;
  padding: 8px 0;
}
.section-collapse {
  border: none;
}
.section-collapse :deep(.el-collapse-item__header) {
  min-height: 36px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border-bottom-color: var(--el-border-color-extra-light);
}
.section-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: var(--el-border-color-extra-light);
}
.section-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}
.compare-note {
  margin-top: 4px;
  line-height: 1.5;
  font-size: 13px;
}
.compare-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
