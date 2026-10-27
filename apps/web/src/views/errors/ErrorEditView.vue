<template>
  <div class="page-scroll" v-loading="loading">
    <div class="toolbar">
      <h1>{{ isNew ? '新增错题' : '编辑错题' }}</h1>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-form label-width="90px" style="max-width: 820px">
      <el-form-item label="科目" required>
        <el-select v-model="form.subjectId" style="width: 100%">
          <el-option v-for="s in subjects" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="分类" required>
        <el-select v-model="form.categoryId" style="width: 100%" placeholder="请选择分类">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期" required>
        <el-date-picker v-model="form.occurredAt" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item label="来源">
        <el-input v-model="form.source" maxlength="64" />
      </el-form-item>
      <el-form-item label="难度">
        <el-rate v-model="form.difficulty" />
      </el-form-item>
      <el-form-item label="标签">
        <el-select v-model="form.tagIds" multiple style="width: 100%">
          <el-option v-for="t in tags" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="题干">
        <div class="field-block">
          <el-input v-model="form.stemText" type="textarea" :rows="4" />
          <div class="upload-bar">
            <el-upload
              :show-file-list="false"
              accept="image/*"
              :http-request="uploadStem"
            >
              <el-button :loading="uploadingStem">上传题干图片</el-button>
            </el-upload>
            <el-button
              v-if="showErrorOcr"
              :loading="ocrStemLoading"
              :disabled="!stemImages.length"
              @click="ocrInto('STEM', undefined, 'general')"
            >
              识别填入题干
            </el-button>
            <el-button
              v-if="showErrorOcr"
              type="success"
              plain
              :loading="ocrStemLoading"
              :disabled="!stemImages.length"
              @click="ocrInto('STEM', undefined, 'smart')"
            >
              智能识别填入题干
            </el-button>
          </div>
          <div class="imgs" v-if="stemImages.length">
            <div v-for="(img, idx) in stemImages" :key="img.id" class="img-item">
              <el-image
                class="thumb"
                :src="fileUrl(img.url)"
                :preview-src-list="stemPreviewList"
                :initial-index="idx"
                fit="cover"
                preview-teleported
              />
              <div class="img-actions">
                <el-button
                  v-if="showErrorOcr"
                  size="small"
                  link
                  type="primary"
                  :loading="ocrStemLoading"
                  @click="ocrInto('STEM', img, 'general')"
                >
                  识别此图
                </el-button>
                <el-button
                  v-if="showErrorOcr"
                  size="small"
                  link
                  type="success"
                  :loading="ocrStemLoading"
                  @click="ocrInto('STEM', img, 'smart')"
                >
                  智能识别
                </el-button>
                <el-button
                  v-if="showErrorOcr"
                  size="small"
                  link
                  :loading="ocrStemLoading"
                  @click="ocrInto('STEM', img, 'formula')"
                >
                  纯公式
                </el-button>
                <el-button size="small" type="danger" link @click="removeImage('STEM', img)">
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="解析">
        <div class="field-block">
          <el-input v-model="form.analysisText" type="textarea" :rows="4" />
          <div class="upload-bar">
            <el-upload
              :show-file-list="false"
              accept="image/*,video/*,.mp4,.webm,.mov,.avi,.mkv"
              :http-request="uploadAnalysis"
            >
              <el-button :loading="uploadingAnalysis">上传解析图片/视频</el-button>
            </el-upload>
            <el-button
              v-if="showErrorOcr"
              :loading="ocrAnalysisLoading"
              :disabled="!analysisImageFiles.length"
              @click="ocrInto('ANALYSIS', undefined, 'general')"
            >
              识别填入解析
            </el-button>
            <el-button
              v-if="showErrorOcr"
              type="success"
              plain
              :loading="ocrAnalysisLoading"
              :disabled="!analysisImageFiles.length"
              @click="ocrInto('ANALYSIS', undefined, 'smart')"
            >
              智能识别填入解析
            </el-button>
          </div>
          <div class="imgs" v-if="analysisFiles.length">
            <div v-for="(file, idx) in analysisFiles" :key="file.id" class="img-item">
              <el-image
                v-if="isImageMedia(file)"
                class="thumb"
                :src="fileUrl(file.url)"
                :preview-src-list="analysisImagePreviewList"
                :initial-index="analysisImageIndex(idx)"
                fit="cover"
                preview-teleported
              />
              <video
                v-else-if="isVideoMedia(file)"
                class="thumb video-thumb"
                :src="fileUrl(file.url)"
                controls
                preload="metadata"
              />
              <a v-else :href="fileUrl(file.url)" target="_blank" class="file-link">查看文件</a>
              <div class="img-actions">
                <el-button
                  v-if="showErrorOcr && isImageMedia(file)"
                  size="small"
                  link
                  type="primary"
                  :loading="ocrAnalysisLoading"
                  @click="ocrInto('ANALYSIS', file, 'general')"
                >
                  识别此图
                </el-button>
                <el-button
                  v-if="showErrorOcr && isImageMedia(file)"
                  size="small"
                  link
                  type="success"
                  :loading="ocrAnalysisLoading"
                  @click="ocrInto('ANALYSIS', file, 'smart')"
                >
                  智能识别
                </el-button>
                <el-button
                  v-if="showErrorOcr && isImageMedia(file)"
                  size="small"
                  link
                  :loading="ocrAnalysisLoading"
                  @click="ocrInto('ANALYSIS', file, 'formula')"
                >
                  纯公式
                </el-button>
                <el-button size="small" type="danger" link @click="removeImage('ANALYSIS', file)">
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="要点">
        <el-input v-model="form.keyPoints" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item v-if="!isNew" label="状态">
        <el-select v-model="form.status" style="width: 200px">
          <el-option
            v-for="o in ERROR_STATUS_OPTIONS"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save(false)">保存</el-button>
        <el-button
          v-if="isNew"
          type="success"
          :loading="saving"
          @click="save(true)"
        >
          保存并继续
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { uploadAttachment } from '@/api/attachments'
import { listErrorCategories, type ErrorCategory } from '@/api/categories'
import {
  createErrorQuestion,
  getErrorQuestion,
  linkAttachment,
  ocrErrorAttachment,
  unlinkAttachment,
  updateErrorQuestion,
} from '@/api/errors'
import { fetchMe } from '@/api/auth'
import { listFeatureFlags } from '@/api/feature-flags'
import { listSubjects, type Subject } from '@/api/subjects'
import { listTags, type Tag } from '@/api/tags'
import { ERROR_STATUS_OPTIONS } from '@/utils/status-label'
import errMsg from '@/utils/err-msg'
import { fileUrl } from '@/utils/api-base'

type MediaItem = { id: string; url: string; mimeType?: string | null; linked?: boolean }

const route = useRoute()
const router = useRouter()
const isNew = computed(() => route.params.id === 'new' || route.name === 'error-new')
const loading = ref(false)
const saving = ref(false)
const uploadingStem = ref(false)
const uploadingAnalysis = ref(false)
const ocrStemLoading = ref(false)
const ocrAnalysisLoading = ref(false)
const canUseOcr = ref(false)
const errorsOcrFeatureOn = ref(false)
const showErrorOcr = computed(() => canUseOcr.value && errorsOcrFeatureOn.value)
const subjects = ref<Subject[]>([])
const tags = ref<Tag[]>([])
const categories = ref<ErrorCategory[]>([])
const stemImages = ref<MediaItem[]>([])
const analysisFiles = ref<MediaItem[]>([])

const stemPreviewList = computed(() => stemImages.value.map((i) => fileUrl(i.url)))
const analysisImagePreviewList = computed(() =>
  analysisFiles.value.filter((f) => isImageMedia(f)).map((i) => fileUrl(i.url)),
)
const analysisImageFiles = computed(() => analysisFiles.value.filter((f) => isImageMedia(f)))

const form = reactive({
  subjectId: '',
  categoryId: '' as string | undefined,
  occurredAt: new Date().toISOString().slice(0, 10),
  title: '',
  source: '',
  difficulty: 0,
  tagIds: [] as string[],
  stemText: '',
  analysisText: '',
  keyPoints: '',
  status: 'NEW',
})

function isImageMedia(item: { url: string; mimeType?: string | null }) {
  if (item.mimeType?.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(item.url)
}

function isVideoMedia(item: { url: string; mimeType?: string | null }) {
  if (item.mimeType?.startsWith('video/')) return true
  return /\.(mp4|webm|mov|avi|mkv|m4v|ogg)(\?|$)/i.test(item.url)
}

function analysisImageIndex(listIdx: number) {
  const before = analysisFiles.value
    .slice(0, listIdx)
    .filter((f) => isImageMedia(f)).length
  return before
}

watch(
  () => form.subjectId,
  async (sid) => {
    if (!sid) {
      categories.value = []
      return
    }
    categories.value = await listErrorCategories({ subjectId: sid }).catch(() => [])
  },
)

async function onUpload(role: 'STEM' | 'ANALYSIS', opt: UploadRequestOptions) {
  const file = opt.file as File
  if (role === 'ANALYSIS' && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    const okByExt = /\.(png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov|avi|mkv|m4v)$/i.test(file.name)
    if (!okByExt) {
      ElMessage.warning('解析仅支持图片或视频')
      return
    }
  }
  const maxMb = 500
  if (file.size > maxMb * 1024 * 1024) {
    ElMessage.error(`文件过大，最大支持 ${maxMb}MB`)
    return
  }
  const loadingRef = role === 'STEM' ? uploadingStem : uploadingAnalysis
  loadingRef.value = true
  try {
    const att = await uploadAttachment(file)
    const item: MediaItem = {
      id: att.id,
      url: att.url,
      mimeType: att.mimeType,
      linked: false,
    }
    if (role === 'STEM') stemImages.value.push(item)
    else analysisFiles.value.push(item)

    if (!isNew.value) {
      await linkAttachment(String(route.params.id), { attachmentId: att.id, role })
      item.linked = true
    }
    ElMessage.success(role === 'ANALYSIS' && isVideoMedia(item) ? '视频已上传' : '图片已上传')
    opt.onSuccess?.(att as any)
  } catch (e) {
    ElMessage.error(errMsg(e, '上传失败'))
    opt.onError?.(e as any)
  } finally {
    loadingRef.value = false
  }
}

function uploadStem(opt: UploadRequestOptions) {
  return onUpload('STEM', opt)
}

function uploadAnalysis(opt: UploadRequestOptions) {
  return onUpload('ANALYSIS', opt)
}

async function removeImage(role: 'STEM' | 'ANALYSIS', img: MediaItem) {
  try {
    if (!isNew.value && img.linked !== false) {
      await unlinkAttachment(String(route.params.id), img.id)
    }
    if (role === 'STEM') {
      stemImages.value = stemImages.value.filter((i) => i.id !== img.id)
    } else {
      analysisFiles.value = analysisFiles.value.filter((i) => i.id !== img.id)
    }
  } catch (e) {
    ElMessage.error(errMsg(e, '移除失败'))
  }
}

async function ocrInto(
  role: 'STEM' | 'ANALYSIS',
  specific?: MediaItem,
  mode: 'general' | 'formula' | 'smart' = 'general',
) {
  const list =
    role === 'STEM'
      ? stemImages.value
      : analysisFiles.value.filter((f) => isImageMedia(f))
  const target = specific || list[0]
  if (!target) {
    ElMessage.warning(role === 'STEM' ? '请先上传题干图片' : '请先上传解析图片')
    return
  }
  if (role === 'ANALYSIS' && !isImageMedia(target)) {
    ElMessage.warning('视频无法识别文字，请上传解析图片')
    return
  }

  const current = role === 'STEM' ? form.stemText.trim() : form.analysisText.trim()
  if (current) {
    try {
      await ElMessageBox.confirm('当前已有文字，识别结果将覆盖，是否继续？', '提示', {
        type: 'warning',
      })
    } catch {
      return
    }
  }

  const loadingRef = role === 'STEM' ? ocrStemLoading : ocrAnalysisLoading
  loadingRef.value = true
  if (mode === 'smart') {
    ElMessage.info({
      message: '智能识别中…',
      duration: 2500,
    })
  } else if (mode === 'formula') {
    ElMessage.info({
      message: '公式识别中…',
      duration: 2500,
    })
  }
  try {
    const data = await ocrErrorAttachment(target.id, mode)
    if (role === 'STEM') form.stemText = data.text
    else form.analysisText = data.text
    const via = data.engine ? `（${data.engine}）` : ''
    ElMessage.success(
      mode === 'smart'
        ? `智能识别完成${via}，请核对分式后保存`
        : mode === 'formula'
          ? `纯公式识别完成${via}，请核对后保存`
          : `识别完成${via}，请核对后保存`,
    )
  } catch (e) {
    ElMessage.error(
      errMsg(
        e,
        mode === 'smart'
          ? '智能识别失败（请检查 Qwen Vision 配置，或 OCR_ENGINE=local 启用本机 OCR）'
          : mode === 'formula'
            ? '纯公式识别失败（含中文请用智能识别，或裁切公式后再试）'
            : '识别失败（请检查 Qwen Vision 配置，或改 OCR_ENGINE=local）',
      ),
    )
  } finally {
    loadingRef.value = false
  }
}

async function linkPending(errorId: string) {
  for (const img of stemImages.value) {
    if (img.linked) continue
    await linkAttachment(errorId, { attachmentId: img.id, role: 'STEM' })
    img.linked = true
  }
  for (const img of analysisFiles.value) {
    if (img.linked) continue
    await linkAttachment(errorId, { attachmentId: img.id, role: 'ANALYSIS' })
    img.linked = true
  }
}

/** 连续录入：清空题目差异字段，保留科目/分类/日期/来源/难度/标签 */
function resetForContinue() {
  form.title = ''
  form.stemText = ''
  form.analysisText = ''
  form.keyPoints = ''
  stemImages.value = []
  analysisFiles.value = []
}

async function save(continueNext = false) {
  if (!form.subjectId || !form.occurredAt) {
    ElMessage.warning('请填写科目和日期')
    return
  }
  if (!form.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  saving.value = true
  try {
    const payload = {
      subjectId: form.subjectId,
      categoryId: form.categoryId,
      occurredAt: form.occurredAt,
      title: form.title || null,
      source: form.source || null,
      difficulty: form.difficulty || null,
      tagIds: form.tagIds,
      stemText: form.stemText || null,
      analysisText: form.analysisText || null,
      keyPoints: form.keyPoints || null,
      ...(isNew.value ? {} : { status: form.status }),
    }
    if (isNew.value) {
      const created = await createErrorQuestion(payload)
      await linkPending(created.id)
      if (continueNext) {
        resetForContinue()
        ElMessage.success('已保存，可继续录入下一题')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        ElMessage.success('创建成功')
        router.replace(`/errors/${created.id}`)
      }
    } else {
      await updateErrorQuestion(String(route.params.id), payload)
      ElMessage.success('保存成功')
    }
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [me, flags] = await Promise.all([
      fetchMe().catch(() => null),
      listFeatureFlags().catch(() => []),
    ])
    canUseOcr.value = !!me?.ocrEnabled
    errorsOcrFeatureOn.value = !!flags.find((f) => f.flagKey === 'errors.ocr_fill')?.enabled
    subjects.value = await listSubjects()
    tags.value = await listTags()
    if (!isNew.value) {
      const detail = await getErrorQuestion(String(route.params.id))
      form.subjectId = detail.subjectId
      form.categoryId = detail.categoryId || undefined
      form.occurredAt = String(detail.occurredAt).slice(0, 10)
      form.title = detail.title || ''
      form.source = detail.source || ''
      form.difficulty = detail.difficulty || 0
      form.tagIds = detail.tags.map((t) => t.id)
      form.stemText = detail.stemText || ''
      form.analysisText = detail.analysisText || ''
      form.keyPoints = detail.keyPoints || ''
      form.status = detail.status
      stemImages.value = detail.attachments
        .filter((a) => a.role === 'STEM')
        .map((a) => ({ id: a.id, url: a.url, mimeType: a.mimeType, linked: true }))
      analysisFiles.value = detail.attachments
        .filter((a) => a.role === 'ANALYSIS')
        .map((a) => ({ id: a.id, url: a.url, mimeType: a.mimeType, linked: true }))
    }
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field-block {
  width: 100%;
}
.upload-bar {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
.img-item {
  width: auto;
  min-width: 140px;
}
.img-actions {
  margin-top: 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.img-item .thumb {
  width: 140px;
  height: 100px;
  border: 1px solid var(--app-border, #ebeef5);
  border-radius: 4px;
  cursor: pointer;
  display: block;
}
.img-item .video-thumb {
  width: 200px;
  height: auto;
  max-height: 140px;
  background: #000;
}
.img-item .file-link {
  display: inline-block;
  font-size: 13px;
}
</style>
