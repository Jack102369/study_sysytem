<template>
  <div class="page-scroll" v-loading="loading">
    <div class="toolbar" v-if="detail">
      <h1>错题详情</h1>
      <div>
        <el-button @click="$router.push(`/errors/${detail.id}/edit`)">编辑</el-button>
        <el-button
          v-if="canUseAi"
          type="primary"
          plain
          @click="$router.push(`/ai-reference?errorId=${detail.id}`)"
        >
          AI 参考出题
        </el-button>
        <el-button
          v-if="canUseAi"
          type="success"
          plain
          @click="
            $router.push(
              `/knowledge-cards?fromError=${detail.id}&subjectId=${detail.subjectId || ''}`,
            )
          "
        >
          AI 拉取本题公式
        </el-button>
        <el-button @click="$router.push('/errors')">返回列表</el-button>
      </div>
    </div>

    <template v-if="detail">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="科目">{{ detail.subjectName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ detail.categoryName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="errorStatusTagType(detail.status)" size="small">
            {{ statusLabel(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="日期">{{ detail.occurredAt }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detail.source || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下次复习">
          {{ detail.nextReviewAt ? String(detail.nextReviewAt).slice(0, 19) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <NamedColorTag
            v-for="t in detail.tags"
            :key="t.id"
            style="margin-right: 4px"
            :label="t.name"
            :color="t.color"
          />
        </el-descriptions-item>
      </el-descriptions>

      <el-card shadow="never" header="题干" style="margin-top: 16px">
        <pre class="text">{{ detail.stemText || '无' }}</pre>
        <div class="imgs" v-if="stemImgs.length">
          <el-image
            v-for="(a, idx) in stemImgs"
            :key="a.id"
            class="thumb"
            :src="fileUrl(a.url)"
            :preview-src-list="stemPreviewList"
            :initial-index="idx"
            fit="contain"
            preview-teleported
          />
        </div>
      </el-card>
      <el-card shadow="never" header="解析" style="margin-top: 12px">
        <pre class="text">{{ detail.analysisText || '无' }}</pre>
        <div class="imgs" v-if="analysisImgs.length">
          <template v-for="(a, idx) in analysisImgs" :key="a.id">
            <el-image
              v-if="isImageMedia(a)"
              class="thumb"
              :src="fileUrl(a.url)"
              :preview-src-list="analysisImagePreviewList"
              :initial-index="analysisImageIndex(idx)"
              fit="contain"
              preview-teleported
            />
            <video
              v-else-if="isVideoMedia(a)"
              class="video-player"
              :src="fileUrl(a.url)"
              controls
              preload="metadata"
            />
            <a v-else :href="fileUrl(a.url)" target="_blank" class="file-link">查看文件</a>
          </template>
        </div>
      </el-card>
      <el-card shadow="never" header="要点" style="margin-top: 12px">
        <pre class="text">{{ detail.keyPoints || '无' }}</pre>
      </el-card>

      <el-card
        v-if="canUseAi"
        shadow="never"
        class="section"
        header="关联公式/公理/思路"
        style="margin-top: 12px"
      >
        <div v-loading="kcLoading">
          <div v-if="linkedKc.length" class="kc-list">
            <div v-for="k in linkedKc" :key="k.id" class="kc-row">
              <el-tag size="small" style="margin-right: 8px">{{ kindLabel(k.kind) }}</el-tag>
              <strong>{{ k.title }}</strong>
              <el-button
                link
                type="primary"
                style="margin-left: 8px"
                @click="$router.push('/knowledge-cards')"
              >
                查看库
              </el-button>
              <el-button link type="danger" @click="unlinkKc(k.id)">取消关联</el-button>
              <div class="kc-content" v-html="mathHtml(k.content)" />
            </div>
          </div>
          <el-empty v-else description="尚未关联公式定理，可用上方按钮让 AI 拉取" :image-size="48" />
        </div>
      </el-card>

      <el-card shadow="never" class="section" header="再练记录">
        <p class="hint">针对原题再次作答；可多次记录，答对后本题标记为已掌握，不再继续再练。</p>
        <el-alert
          v-if="attemptDone"
          type="success"
          :closable="false"
          show-icon
          title="本题已答对，无需继续再练"
          style="margin-bottom: 12px"
        />
        <el-form v-else inline>
          <el-form-item label="结果">
            <el-select v-model="attemptForm.result" style="width: 140px">
              <el-option label="对" value="CORRECT" />
              <el-option label="错" value="WRONG" />
              <el-option label="部分对" value="PARTIAL" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="attemptForm.note" placeholder="可选" />
          </el-form-item>
          <el-form-item label="答案图">
            <div class="upload-inline">
              <el-upload
                :show-file-list="false"
                accept="image/*,.pdf,.doc,.docx"
                :http-request="uploadAttemptAnswer"
              >
                <el-button :loading="uploadingAttempt">上传答案</el-button>
              </el-upload>
              <template v-if="attemptAnswer">
                <el-image
                  v-if="isImageUrl(attemptAnswer.url)"
                  class="mini-thumb"
                  :src="fileUrl(attemptAnswer.url)"
                  :preview-src-list="[fileUrl(attemptAnswer.url)]"
                  fit="cover"
                  preview-teleported
                />
                <a v-else :href="fileUrl(attemptAnswer.url)" target="_blank" class="file-link">
                  已选文件
                </a>
                <el-button link type="danger" @click="attemptAnswer = null">清除</el-button>
              </template>
            </div>
          </el-form-item>
          <el-button type="primary" :loading="savingAttempt" @click="onAttempt">
            提交再练
          </el-button>
        </el-form>
        <el-table :data="detail.attempts" size="small" empty-text="暂无再练记录">
          <el-table-column prop="attemptedAt" label="时间" width="180">
            <template #default="{ row }">
              {{ String(row.attemptedAt).slice(0, 19).replace('T', ' ') }}
            </template>
          </el-table-column>
          <el-table-column label="结果" width="100">
            <template #default="{ row }">{{ resultLabel(row.result) }}</template>
          </el-table-column>
          <el-table-column prop="note" label="备注" min-width="120" />
          <el-table-column label="答案" width="120">
            <template #default="{ row }">
              <template v-if="row.answerAttachmentUrl">
                <el-image
                  v-if="isImageUrl(row.answerAttachmentUrl)"
                  class="mini-thumb"
                  :src="fileUrl(row.answerAttachmentUrl)"
                  :preview-src-list="[fileUrl(row.answerAttachmentUrl)]"
                  fit="cover"
                  preview-teleported
                />
                <a v-else :href="fileUrl(row.answerAttachmentUrl)" target="_blank">查看文件</a>
              </template>
              <span v-else>—</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { uploadAttachment } from '@/api/attachments'
import { addAttempt, getErrorQuestion, type ErrorQuestionDetail } from '@/api/errors'
import { fetchMe } from '@/api/auth'
import {
  listKnowledgeByError,
  unlinkKnowledgeFromError,
  type KnowledgeCard,
} from '@/api/knowledge-cards'
import { statusLabel } from '@/utils/status-label'
import { errorStatusTagType } from '@/utils/table-ui'
import { renderMathHtml } from '@/utils/render-math'
import errMsg from '@/utils/err-msg'
import { fileUrl } from '@/utils/api-base'

type PendingFile = { id: string; url: string }

const route = useRoute()
const loading = ref(false)
const detail = ref<ErrorQuestionDetail | null>(null)
const canUseAi = ref(false)
const linkedKc = ref<KnowledgeCard[]>([])
const kcLoading = ref(false)
const attemptForm = reactive({ result: 'WRONG' as string, note: '' })
const attemptAnswer = ref<PendingFile | null>(null)
const uploadingAttempt = ref(false)
const savingAttempt = ref(false)

const attemptDone = computed(
  () =>
    !!detail.value?.hasCorrectAttempt ||
    detail.value?.status === 'MASTERED' ||
    (detail.value?.attempts || []).some((a) => a.result === 'CORRECT'),
)

const stemImgs = computed(
  () => detail.value?.attachments.filter((a) => a.role === 'STEM') || [],
)
const analysisImgs = computed(
  () => detail.value?.attachments.filter((a) => a.role === 'ANALYSIS') || [],
)
const stemPreviewList = computed(() => stemImgs.value.map((a) => fileUrl(a.url)))
const analysisImagePreviewList = computed(() =>
  analysisImgs.value.filter((a) => isImageMedia(a)).map((a) => fileUrl(a.url)),
)

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

function isImageMedia(item: { url: string; mimeType?: string | null }) {
  if (item.mimeType?.startsWith('image/')) return true
  return isImageUrl(item.url)
}

function isVideoMedia(item: { url: string; mimeType?: string | null }) {
  if (item.mimeType?.startsWith('video/')) return true
  return /\.(mp4|webm|mov|avi|mkv|m4v|ogg)(\?|$)/i.test(item.url)
}

function analysisImageIndex(listIdx: number) {
  return analysisImgs.value.slice(0, listIdx).filter((a) => isImageMedia(a)).length
}

function resultLabel(r: string) {
  if (r === 'CORRECT') return '对'
  if (r === 'PARTIAL') return '部分对'
  return '错'
}

function kindLabel(k: string) {
  if (k === 'formula') return '公式'
  if (k === 'axiom') return '公理'
  if (k === 'theorem') return '定理'
  return '思路'
}

function mathHtml(s: string) {
  return renderMathHtml(s)
}

async function loadLinkedKc() {
  if (!detail.value || !canUseAi.value) {
    linkedKc.value = []
    return
  }
  kcLoading.value = true
  try {
    const res = await listKnowledgeByError(detail.value.id)
    linkedKc.value = res.items
  } catch {
    linkedKc.value = []
  } finally {
    kcLoading.value = false
  }
}

async function unlinkKc(cardId: string) {
  if (!detail.value) return
  try {
    await unlinkKnowledgeFromError(cardId, detail.value.id)
    ElMessage.success('已取消关联')
    await loadLinkedKc()
  } catch (e) {
    ElMessage.error(errMsg(e, '取消关联失败'))
  }
}

async function load() {
  loading.value = true
  try {
    const [eq, me] = await Promise.all([
      getErrorQuestion(String(route.params.id)),
      fetchMe().catch(() => null),
    ])
    detail.value = eq
    canUseAi.value = !!me?.aiEnabled
    await loadLinkedKc()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function uploadAttemptAnswer(opt: UploadRequestOptions) {
  uploadingAttempt.value = true
  try {
    const att = await uploadAttachment(opt.file as File)
    attemptAnswer.value = { id: att.id, url: att.url }
    ElMessage.success('答案已上传')
    opt.onSuccess?.(att as any)
  } catch (e) {
    ElMessage.error(errMsg(e, '上传失败'))
    opt.onError?.(e as any)
  } finally {
    uploadingAttempt.value = false
  }
}

async function onAttempt() {
  if (!detail.value) return
  savingAttempt.value = true
  const result = attemptForm.result
  try {
    await addAttempt(detail.value.id, {
      result,
      note: attemptForm.note || null,
      answerAttachmentId: attemptAnswer.value?.id || null,
    })
    attemptForm.note = ''
    attemptForm.result = 'WRONG'
    attemptAnswer.value = null
    ElMessage.success(result === 'CORRECT' ? '答对了，本题已掌握' : '已记录再练结果')
    const { usePetStore } = await import('@/stores/pet')
    const pet = usePetStore()
    pet.emitPetEvent(result === 'CORRECT' ? 'attempt_correct' : 'attempt_wrong')
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '提交失败'))
  } finally {
    savingAttempt.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.text {
  white-space: pre-wrap;
  margin: 0;
  font-family: inherit;
}
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.thumb {
  width: 240px;
  height: 180px;
  border: 1px solid var(--app-border, #ebeef5);
  border-radius: 4px;
  cursor: pointer;
  background: var(--app-card-bg, transparent);
}
.video-player {
  width: min(480px, 100%);
  max-height: 320px;
  border-radius: 4px;
  background: #000;
  display: block;
}
.section {
  margin-top: 12px;
}
.hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--app-text-secondary);
}
.upload-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--app-border, #ebeef5);
  cursor: pointer;
}
.file-link {
  font-size: 13px;
}
.kc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.kc-row {
  padding: 10px;
  border: 1px solid var(--app-border, #ebeef5);
  border-radius: 8px;
}
.kc-content {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
</style>
