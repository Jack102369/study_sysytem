<template>
  <div class="page import-page" v-loading="busy">
    <header class="head">
      <div>
        <h1>高一数学 · 题库批量导入</h1>
        <p class="sub">
          JSON 预览 → 确认写入 draft。不自动批准。结构合法 ≠ 数学正确。
        </p>
      </div>
      <div class="acts">
        <el-button @click="goItems">题库管理</el-button>
        <el-button @click="downloadTemplate">下载模板</el-button>
      </div>
    </header>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="批准前须人工核对题干、选项、答案、解析、知识点与难度。"
      class="mb"
    />

    <section class="upload-row">
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="file"
        @change="onFile"
      />
      <el-button type="primary" :disabled="busy" @click="pickFile">
        选择 JSON 文件
      </el-button>
      <span v-if="fileName" class="fname">{{ fileName }}</span>
      <el-button
        type="success"
        :disabled="!rawItems.length || busy"
        @click="runPreview"
      >
        预览校验
      </el-button>
      <el-button
        type="danger"
        :disabled="!canConfirm || busy || confirmLock"
        @click="runConfirm"
      >
        确认入库（draft）
      </el-button>
    </section>

    <p v-if="localError" class="err">{{ localError }}</p>

    <div v-if="preview" class="summary">
      <el-tag>共 {{ preview.itemCount }} 题</el-tag>
      <el-tag type="danger">error {{ preview.errorCount }}</el-tag>
      <el-tag type="warning">warning {{ preview.warningCount }}</el-tag>
      <el-tag :type="preview.canConfirm ? 'success' : 'info'">
        {{ preview.canConfirm ? '可确认' : '不可确认' }}
      </el-tag>
      <span v-if="preview.expiresAt" class="exp">
        令牌至 {{ preview.expiresAt }}
      </span>
    </div>

    <el-alert
      v-if="preview?.notice"
      type="info"
      :closable="false"
      :title="preview.notice"
      class="mb"
    />

    <el-alert
      v-if="confirmResult"
      :type="confirmResult.success ? 'success' : 'error'"
      :closable="false"
      :title="confirmSummary"
      class="mb"
    />

    <div v-if="!preview?.items?.length" class="empty">
      选择 JSON 并预览后显示逐题报告。
    </div>

    <el-collapse v-else v-model="openPanels">
      <el-collapse-item
        v-for="row in preview!.items"
        :key="row.index"
        :name="String(row.index)"
      >
        <template #title>
          <span class="ctitle">
            #{{ row.index + 1 }}
            <el-tag size="small" :type="row.ok ? 'success' : 'danger'">
              {{ row.ok ? 'OK' : 'ERR' }}
            </el-tag>
            {{ row.code }}
            <template v-if="row.preview">
              · {{ row.preview.qtype }} · {{ difficultyLabel(row.preview.difficulty) }}
              · {{ row.preview.specialtyCode }}/{{ row.preview.categoryCode }}
            </template>
          </span>
        </template>

        <div v-if="row.errors.length" class="issues">
          <div v-for="(e, ei) in row.errors" :key="'e' + ei" class="e">
            [error {{ e.code }}] {{ e.message }}
          </div>
        </div>
        <div v-if="row.warnings.length" class="issues">
          <div v-for="(w, wi) in row.warnings" :key="'w' + wi" class="w">
            [warning {{ w.code }}] {{ w.message }}
          </div>
        </div>

        <template v-if="row.preview">
          <p class="meta">
            知识点：{{ row.preview.knowledgePointCodes.join(', ') }}
            （主：{{ row.preview.primaryKnowledgePointCode }}）
          </p>
          <div class="block">
            <div class="label">题干</div>
            <MathStem :text="row.preview.stem" />
          </div>
          <div
            v-if="row.preview.options?.options?.length"
            class="block"
          >
            <div class="label">选项</div>
            <ul class="opts">
              <li
                v-for="op in row.preview.options.options"
                :key="op.id"
              >
                <strong>{{ op.id }}.</strong>
                <MathStem :text="op.text" />
              </li>
            </ul>
          </div>
          <div class="block">
            <div class="label">标准答案</div>
            <pre class="ans">{{ formatAnswer(row.preview.answerPayload) }}</pre>
          </div>
          <div class="block">
            <div class="label">解析</div>
            <MathStem :text="row.preview.analysis" />
          </div>
        </template>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MathStem from '@/components/hs-math/MathStem.vue'
import {
  confirmAdminHsMathTrainItemsImport,
  previewAdminHsMathTrainItemsImport,
  type HsMathImportConfirmResult,
  type HsMathImportPreviewResult,
} from '@/api/hs-math-admin'
import { difficultyLabel } from '@/utils/hs-math-format'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const rawItems = ref<unknown[]>([])
const localError = ref('')
const busy = ref(false)
const preview = ref<HsMathImportPreviewResult | null>(null)
const confirmResult = ref<HsMathImportConfirmResult | null>(null)
const confirmLock = ref(false)
const openPanels = ref<string[]>([])

const canConfirm = computed(
  () =>
    Boolean(preview.value?.canConfirm && preview.value?.previewToken) &&
    rawItems.value.length > 0,
)

const confirmSummary = computed(() => {
  const r = confirmResult.value
  if (!r) return ''
  return `${r.notice} 成功 ${r.successCount}，失败 ${r.failCount}（mode=${r.mode}）`
})

function pickFile() {
  fileInput.value?.click()
}

function goItems() {
  router.push({ name: 'settings-hs-math-train-items' })
}

function downloadTemplate() {
  const a = document.createElement('a')
  a.href = '/hs-math-import-template.json'
  a.download = 'hs-math-import-template.json'
  a.click()
}

async function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  localError.value = ''
  preview.value = null
  confirmResult.value = null
  confirmLock.value = false
  if (!file) return
  fileName.value = file.name
  if (file.size > 900_000) {
    localError.value = '文件过大（建议不超过 900KB）'
    rawItems.value = []
    return
  }
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : null
    if (!items) {
      localError.value = 'JSON 须为数组，或 { "items": [...] }'
      rawItems.value = []
      return
    }
    if (items.length === 0) {
      localError.value = '题目数组为空'
      rawItems.value = []
      return
    }
    if (items.length > 100) {
      localError.value = '单批最多 100 题'
      rawItems.value = []
      return
    }
    rawItems.value = items
    ElMessage.success(`已读取 ${items.length} 题，请预览`)
  } catch {
    localError.value = 'JSON 解析失败'
    rawItems.value = []
  } finally {
    // 保留 fileName；清空 input 以便可重选同名文件
    if (input) input.value = ''
  }
}

async function runPreview() {
  if (!rawItems.value.length) return
  busy.value = true
  localError.value = ''
  confirmResult.value = null
  confirmLock.value = false
  try {
    preview.value = await previewAdminHsMathTrainItemsImport(rawItems.value)
    openPanels.value = preview.value.items
      .filter((i) => !i.ok)
      .map((i) => String(i.index))
      .slice(0, 20)
    if (preview.value.canConfirm) {
      ElMessage.success('预览通过，可确认入库')
    } else {
      ElMessage.warning('存在 error，不可确认')
    }
  } catch (e) {
    preview.value = null
    ElMessage.error(errMsg(e, '预览失败'))
  } finally {
    busy.value = false
  }
}

async function runConfirm() {
  if (!canConfirm.value || !preview.value?.previewToken) return
  try {
    await ElMessageBox.confirm(
      '将整批写入 draft（事务），不自动批准。确认？',
      '确认导入',
      { type: 'warning' },
    )
  } catch {
    return
  }
  busy.value = true
  confirmLock.value = true
  try {
    confirmResult.value = await confirmAdminHsMathTrainItemsImport({
      previewToken: preview.value.previewToken,
      items: rawItems.value,
    })
    ElMessage.success(confirmResult.value.notice)
    preview.value = {
      ...preview.value,
      previewToken: null,
      canConfirm: false,
    }
    await ElMessageBox.confirm('导入完成，前往题库管理？', '完成', {
      confirmButtonText: '前往',
      cancelButtonText: '留下',
      type: 'success',
    })
      .then(() => goItems())
      .catch(() => undefined)
  } catch (e) {
    confirmLock.value = false
    ElMessage.error(errMsg(e, '确认失败'))
  } finally {
    busy.value = false
  }
}

function formatAnswer(payload: unknown) {
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}
</script>

<style scoped>
.import-page {
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
  flex-shrink: 0;
}
.mb {
  margin-bottom: 12px;
}
.upload-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.file {
  display: none;
}
.fname {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.err {
  color: var(--el-color-danger);
  margin: 0 0 8px;
}
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.exp {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.empty {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.ctitle {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.issues {
  margin-bottom: 8px;
}
.issues .e {
  color: var(--el-color-danger);
  font-size: 13px;
}
.issues .w {
  color: var(--el-color-warning);
  font-size: 13px;
}
.meta {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.block {
  margin: 10px 0;
}
.label {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}
.opts {
  margin: 0;
  padding-left: 18px;
}
.opts li {
  margin: 4px 0;
}
.ans {
  margin: 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  overflow: auto;
}
</style>
