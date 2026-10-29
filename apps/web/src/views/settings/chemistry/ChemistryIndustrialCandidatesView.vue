<template>
  <div class="page-fill ind-cand" v-loading="loading">
    <div class="toolbar">
      <div>
        <h1>工业实验候选审核</h1>
        <p class="sub">
          PHASE_E2-B7：可导出多模型审核包。正确顺序仍为：来源核验 → 案例有效审核 →
          重新质检 → 逐题人审 → 正式发布检查（默认 OFF）。自动质检 ≠ 人工审核；
          外部 AI 意见 ≠ verified_by_admin / humanDecision。
        </p>
      </div>
      <div class="actions">
        <el-button @click="$router.push('/settings/chemistry-train-items')">训练题库</el-button>
        <el-button type="primary" plain :loading="exporting" @click="doExportBundle">
          导出多模型审核包
        </el-button>
        <el-button @click="reload">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="designNote"
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      :title="designNote"
    />
    <el-alert
      v-if="e2bNote"
      type="info"
      :closable="false"
      show-icon
      class="mb"
      :title="e2bNote"
    />
    <el-alert
      v-if="realPublishNote"
      type="warning"
      :closable="false"
      show-icon
      class="mb"
      :title="`real publish=${realPublishEnabled ? 'ON' : 'OFF'} · ${realPublishNote}`"
    />
    <el-alert
      v-if="listError"
      type="error"
      :closable="false"
      show-icon
      class="mb"
      :title="listError"
    />

    <el-card shadow="never" class="mb">
      <el-form :inline="true">
        <el-form-item label="批次">
          <el-input
            v-model="filters.batchId"
            clearable
            style="width: 320px"
            placeholder="industrial_formal_candidate_…"
            @change="reload"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 180px" @change="reload">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="filters.qtype" clearable style="width: 120px" @change="reload">
            <el-option label="单选" value="single" />
            <el-option label="判断" value="judge" />
            <el-option label="填空" value="blank" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="rows" stripe height="280" :empty-text="listEmptyText">
      <el-table-column prop="candidateId" label="候选ID" width="180" show-overflow-tooltip />
      <el-table-column prop="caseCode" label="案例" width="160" />
      <el-table-column prop="qtype" label="题型" width="70" />
      <el-table-column prop="difficulty" label="难度" width="60" />
      <el-table-column prop="generationSource" label="来源" width="120" />
      <el-table-column prop="reviewStatus" label="审核状态" width="150" />
      <el-table-column label="质检" width="160">
        <template #default="{ row }">
          {{ row.qualityOverall || '—' }}
          <span v-if="row.blockingCount"> /B{{ row.blockingCount }}</span>
          <span v-if="row.unknownCount"> /U{{ row.unknownCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可入库" width="80">
        <template #default="{ row }">
          <el-tag :type="row.formalPublishEligible ? 'success' : 'info'" size="small">
            {{ row.formalPublishEligible ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.candidateId)">审核</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="drawer" size="78%" title="工业候选集中审核" destroy-on-close>
      <template v-if="detail && packet">
        <el-alert
          type="error"
          :closable="false"
          class="mb"
          :title="`正式发布阻断（${(packet.formalImportBlockers || []).length}）`"
          :description="(packet.formalImportBlockers || []).join(' · ') || '—'"
        />
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          class="mb"
          :title="`审核步骤 · real publish=${realPublishEnabled ? 'ON' : 'OFF'}`"
          :description="(packet.reviewWorkflowSteps || defaultWorkflowSteps).join(' → ')"
        />
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="mb"
          title="QUALITY_BLOCKERS 为空 ≠ 科学已核验；unknown ≠ pass；来源未核验 ≠ 案例已通过；案例未通过 ≠ 候选可正式发布；候选人审未完成 ≠ 审核完成；人审通过 ≠ 自动正式发布"
        />
        <el-alert
          v-if="packet.sourceVerificationStatus === 'SOURCE_VERIFICATION_INCOMPLETE'"
          type="warning"
          :closable="false"
          class="mb"
          title="SOURCE_VERIFICATION_INCOMPLETE：不得仅因 published 视为科学已确认"
        />
        <el-alert
          v-if="packet.case?.fixtureStillDraft"
          type="warning"
          :closable="false"
          class="mb"
          title="原始 fixture 仍为 draft：有效审核来自覆盖层，≠ 改写 published"
        />
        <el-alert
          v-if="packet.case?.effectiveReview?.grantsEffectivePublishEligibility"
          type="success"
          :closable="false"
          class="mb"
          title="案例有效审核已授予发布资格（请重新质检候选后再人审）"
        />

        <el-descriptions :column="2" border class="mb">
          <el-descriptions-item label="candidateId">{{ packet.candidateId }}</el-descriptions-item>
          <el-descriptions-item label="plannedCode">{{ packet.plannedItemCode || '—' }}</el-descriptions-item>
          <el-descriptions-item label="revision">{{ packet.revision }}</el-descriptions-item>
          <el-descriptions-item label="批次">{{ packet.e1BatchId || '—' }}</el-descriptions-item>
          <el-descriptions-item label="专项">{{ packet.specialtyCode }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ packet.categoryCode }}</el-descriptions-item>
          <el-descriptions-item label="题型/难度">
            {{ packet.question?.qtype }} / {{ packet.question?.difficulty }}
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">{{ packet.reviewStatus }}</el-descriptions-item>
          <el-descriptions-item label="审计哈希">
            {{ shortHash(packet.contentHashes?.auditContentHash) }}
          </el-descriptions-item>
          <el-descriptions-item label="流程SVG">
            {{ shortHash(packet.contentHashes?.flowSvgContentHash) }}
          </el-descriptions-item>
          <el-descriptions-item label="装置SVG">
            {{ shortHash(packet.contentHashes?.apparatusSvgContentHash) }}
          </el-descriptions-item>
          <el-descriptions-item label="人审可交接">
            {{ packet.readyForHumanReview ? 'YES' : 'NO' }}
          </el-descriptions-item>
        </el-descriptions>

        <h3>题干 / 选项 / 答案 / 解析</h3>
        <el-form label-width="80px" class="mb">
          <el-form-item label="题干">
            <el-input v-model="edit.stem" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item v-if="packet.question?.options?.length" label="选项">
            <div class="opt">
              <div v-for="(o, i) in packet.question.options" :key="i">{{ i + 1 }}. {{ o }}</div>
            </div>
          </el-form-item>
          <el-form-item label="答案">
            <el-input v-model="edit.answer" />
          </el-form-item>
          <el-form-item label="解析">
            <el-input v-model="edit.explanation" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>

        <h3>科学来源</h3>
        <el-alert
          type="warning"
          :closable="false"
          class="mb"
          title="fixture 来源均为 unverified 时不得一键视为科学正确；辅助材料见仓库 scientific_source_packets/（≠ verified_by_admin）"
        />
        <el-alert
          v-if="
            packet.scientificEvidenceHelpers?.sourceEvidenceStatus ===
            'SOURCE_EVIDENCE_INCOMPLETE'
          "
          type="error"
          :closable="false"
          class="mb"
          title="SOURCE_EVIDENCE_INCOMPLETE：证据不足时保留阻断，勿为验收强行批准"
          :description="packet.scientificEvidenceHelpers?.adminHint || ''"
        />
        <el-table
          :data="packet.case?.sourceReferences || []"
          size="small"
          class="mb"
          empty-text="无案例来源条目"
        >
          <el-table-column prop="sourceType" label="类型" width="120" />
          <el-table-column prop="sourceTitle" label="标题" min-width="160" show-overflow-tooltip />
          <el-table-column prop="verificationStatus" label="核验" width="110" />
          <el-table-column prop="sourceIdentifier" label="标识/页码" width="120" show-overflow-tooltip />
          <el-table-column prop="sourceDescription" label="说明" min-width="180" show-overflow-tooltip />
          <el-table-column prop="risk" label="风险" min-width="140" show-overflow-tooltip />
        </el-table>
        <h4 class="sub">B5 辅助外链（打开原文；ACCESSED ≠ 已核验）</h4>
        <p v-if="packet.scientificEvidenceHelpers?.adminHint" class="sub mb">
          {{ packet.scientificEvidenceHelpers.adminHint }}
        </p>
        <el-table
          :data="packet.scientificEvidenceHelpers?.links || []"
          size="small"
          class="mb"
          empty-text="无辅助外链"
        >
          <el-table-column prop="sourceId" label="ID" width="150" />
          <el-table-column prop="accessStatus" label="访问" width="120" />
          <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
          <el-table-column label="打开" width="90">
            <template #default="{ row }">
              <el-link
                v-if="row.url"
                :href="row.url"
                target="_blank"
                type="primary"
                rel="noopener noreferrer"
              >
                原文
              </el-link>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注" min-width="180" show-overflow-tooltip />
        </el-table>
        <h4 class="sub">提交案例审核时的来源证据（须本人填写；默认不预填已核验）</h4>
        <el-table :data="sourceEvidenceRows" size="small" class="mb" empty-text="无来源">
          <el-table-column prop="sourceTitle" label="sourceTitle" min-width="180" show-overflow-tooltip />
          <el-table-column label="outcome" width="160">
            <template #default="{ row }">
              <el-select v-model="row.outcome" size="small" style="width: 140px">
                <el-option label="无法核验" value="cannot_verify" />
                <el-option label="需修改" value="needs_revision" />
                <el-option label="不适用" value="not_applicable" />
                <el-option label="管理员已核验" value="verified_by_admin" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="evidenceNote（≥8）" min-width="220">
            <template #default="{ row }">
              <el-input v-model="row.evidenceNote" size="small" placeholder="打开原文后手写证据" />
            </template>
          </el-table-column>
        </el-table>
        <ul v-if="packet.sourceBasis?.length" class="mb bullets">
          <li v-for="(s, i) in packet.sourceBasis" :key="i">{{ s }}</li>
        </ul>

        <h3>案例（原始 fixture vs 有效审核）</h3>
        <el-descriptions v-if="packet.case && !packet.case.missing" :column="2" border class="mb">
          <el-descriptions-item label="code">{{ packet.case.caseCode }}</el-descriptions-item>
          <el-descriptions-item label="fixture 状态">
            {{ packet.case.rawReviewStatus || packet.case.reviewStatus }}
          </el-descriptions-item>
          <el-descriptions-item label="有效审核态">
            {{ packet.case.effectiveReview?.effectiveReviewStatus || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="有效来源">
            {{ packet.case.effectiveReview?.effectiveSourceVerification || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="fixture publishEligible">
            {{ packet.case.publishEligible ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="有效 publishEligible">
            {{ packet.case.effectiveReview?.publishEligible ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="覆盖层决策">
            {{ packet.case.effectiveReview?.overlayDecision || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="覆盖层当前">
            {{ packet.case.effectiveReview?.isCurrent ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="案例哈希">
            {{ shortHash(packet.case.contentHash) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核绑定哈希">
            {{ shortHash(packet.case.effectiveReview?.reviewedContentHash) }}
          </el-descriptions-item>
          <el-descriptions-item label="课程审核">
            {{ packet.case.curriculumReviewStatus }}
          </el-descriptions-item>
          <el-descriptions-item label="阻断">
            {{ (packet.case.effectiveReview?.blockingReasons || []).join(' · ') || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ packet.case.title }}</el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">{{ packet.case.description }}</el-descriptions-item>
        </el-descriptions>

        <h3>KB 拟绑定（不写 chem_train_item_links）</h3>
        <el-table
          :data="packet.kbBindingPlan || []"
          size="small"
          class="mb"
          empty-text="无 KB 计划"
        >
          <el-table-column prop="entityType" label="类型" width="100" />
          <el-table-column prop="entityId" label="ID" width="70" />
          <el-table-column prop="entityName" label="名称" width="140" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="human_unreviewed" width="140">
            <template #default="{ row }">
              <el-tag
                v-if="(row.reviewNoteFlags || []).includes('human_unreviewed')"
                type="danger"
                size="small"
              >
                需核验
              </el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column prop="currentLink" label="DB绑定" width="100" />
          <el-table-column prop="note" label="依据" show-overflow-tooltip />
        </el-table>

        <h3>工业流程图（教学示意）</h3>
        <IndustrialFlowDiagram v-if="svgPayload" :payload="svgPayload" class="mb" />
        <el-empty v-else description="无流程图" />

        <h3>工业装置图（schematic，非施工图）</h3>
        <el-alert
          v-if="packet.diagrams?.apparatus?.schematicDisclaimer"
          type="info"
          :closable="false"
          class="mb"
          :title="packet.diagrams.apparatus.schematicDisclaimer"
        />
        <el-alert
          v-if="packet.diagrams?.apparatus?.safety?.unknowns?.length"
          type="info"
          :closable="false"
          class="mb"
          :title="`装置 unknown ${packet.diagrams.apparatus.safety.unknowns.length}（不得自动通过）`"
        />
        <el-alert
          v-if="packet.diagrams?.apparatus?.safety?.blocking?.length"
          type="error"
          :closable="false"
          class="mb"
          :title="(packet.diagrams.apparatus.safety.blocking || []).join(' | ')"
        />
        <el-table
          v-if="packet.diagrams?.apparatus?.components?.length"
          :data="packet.diagrams.apparatus.components"
          size="small"
          class="mb"
        >
          <el-table-column prop="componentId" label="ID" width="100" />
          <el-table-column prop="componentType" label="类型" width="140" />
          <el-table-column prop="displayLabel" label="标签" />
        </el-table>
        <IndustrialFlowDiagram v-if="apparatusPayload" :payload="apparatusPayload" class="mb" />
        <el-empty v-else description="本候选无装置图" />

        <h3>自动质检 · blocking / unknown</h3>
        <p class="sub">
          overall={{ packet.quality?.overallStatus }} · qualityCurrent={{
            packet.quality?.qualityCurrent
          }}
          · formalPublishEligible={{ packet.quality?.formalPublishEligible }}
        </p>
        <el-table
          :data="packet.quality?.failChecks || []"
          size="small"
          class="mb"
          empty-text="无 fail"
        >
          <el-table-column prop="checkId" label="checkId" width="160" />
          <el-table-column prop="dimension" label="维度" width="100" />
          <el-table-column prop="severity" label="级别" width="80" />
          <el-table-column prop="message" label="说明" show-overflow-tooltip />
        </el-table>
        <el-table
          :data="packet.quality?.unknownChecks || []"
          size="small"
          max-height="220"
          class="mb"
          empty-text="无 unknown"
        >
          <el-table-column prop="checkId" label="checkId" width="160" />
          <el-table-column prop="dimension" label="维度" width="100" />
          <el-table-column prop="message" label="说明" show-overflow-tooltip />
        </el-table>

        <h3>人工审核待办</h3>
        <ul class="mb bullets">
          <li v-for="(t, i) in packet.humanTodos || []" :key="i">{{ t }}</li>
        </ul>

        <h3>修订历史（只读）</h3>
        <el-table
          :data="(detail.revisionHistory || []).slice().reverse()"
          size="small"
          class="mb"
          max-height="180"
          empty-text="无修订历史"
        >
          <el-table-column prop="at" label="时间" width="170" />
          <el-table-column prop="action" label="动作" width="160" />
          <el-table-column prop="revision" label="rev" width="60" />
          <el-table-column prop="note" label="备注" show-overflow-tooltip />
        </el-table>
        <p class="sub">辅助材料见仓库 docs/.../human_review_packets/（不自动批准）</p>

        <h3>管理员审核清单（不升格入库）</h3>
        <el-form label-width="120px" class="mb">
          <el-form-item label="来源核验">
            <el-select v-model="checklist.sourceOutcome" style="width: 220px">
              <el-option label="管理员已核验" value="verified_by_admin" />
              <el-option label="无法核验" value="cannot_verify" />
              <el-option label="需修改" value="needs_revision" />
              <el-option label="不适用" value="not_applicable" />
            </el-select>
          </el-form-item>
          <el-form-item label="案例意见(清单)">
            <el-select v-model="checklist.caseOutcome" style="width: 220px">
              <el-option label="确认仍为 draft" value="acknowledge_draft" />
              <el-option label="要求修改" value="request_changes" />
              <el-option label="来源不完整" value="sources_incomplete" />
              <el-option label="无法核验" value="cannot_verify" />
            </el-select>
          </el-form-item>
          <el-form-item label="案例覆盖层">
            <el-select v-model="caseReviewDecision" style="width: 280px">
              <el-option label="确认仍为 draft" value="acknowledge_draft" />
              <el-option label="要求修改" value="request_changes" />
              <el-option label="来源不完整" value="sources_incomplete" />
              <el-option label="无法核验" value="cannot_verify" />
              <el-option
                label="批准有效发布资格(approve_for_publish)"
                value="approve_for_publish"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="KB计划合理">
            <el-switch v-model="checklist.kbPlanOk" />
          </el-form-item>
          <el-form-item label="KB备注">
            <el-input v-model="checklist.kbPlanNote" />
          </el-form-item>
          <el-form-item label="流程备注">
            <el-input v-model="checklist.flowNotes" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="装置备注">
            <el-input v-model="checklist.apparatusNotes" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input v-model="checklist.note" type="textarea" :rows="2" />
          </el-form-item>
        </el-form>

        <div class="actions-row">
          <el-button type="primary" :loading="busy" @click="savePatch">保存题干修改</el-button>
          <el-button :loading="busy" @click="doRecheck">重新质检</el-button>
          <el-button type="primary" plain :loading="busy" @click="doChecklist">
            保存审核清单
          </el-button>
          <el-button type="warning" :loading="busy" @click="doHuman('needs_revision')">
            退回修改
          </el-button>
          <el-button type="danger" :loading="busy" @click="doHuman('reject')">驳回</el-button>
          <el-button type="success" :loading="busy" @click="doHuman('approve')">
            尝试审核通过(受闸门)
          </el-button>
          <el-button :loading="busy" @click="doImport">正式入库 dry-run</el-button>
          <el-button type="primary" plain :loading="busy" @click="doCaseReview">
            提交案例审核覆盖层
          </el-button>
        </div>
        <el-alert
          v-if="actionMsg"
          class="mt"
          :type="actionOk ? 'success' : 'error'"
          :title="actionMsg"
          :closable="false"
        />
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import IndustrialFlowDiagram from '@/components/chemistry/IndustrialFlowDiagram.vue'
import type { IndustrialSvgDisplayPayload } from '@/api/industrial-diagram'
import {
  downloadIndustrialReviewBundle,
  formalImportIndustrialCandidate,
  getIndustrialCandidate,
  humanReviewIndustrialCandidate,
  listIndustrialCandidates,
  patchIndustrialCandidate,
  recheckIndustrialCandidate,
  submitIndustrialAdminChecklist,
  submitIndustrialCaseReview,
  type IndustrialReviewListItem,
} from '@/api/industrial-review'

const E1_BATCH = 'industrial_formal_candidate_20261029_121958'

const loading = ref(false)
const busy = ref(false)
const exporting = ref(false)
const rows = ref<IndustrialReviewListItem[]>([])
const listError = ref('')
const designNote = ref('')
const e2bNote = ref('')
const realPublishEnabled = ref(false)
const realPublishNote = ref('')
const filters = reactive({ status: '', qtype: '', batchId: E1_BATCH })
const listEmptyText = computed(() =>
  listError.value ? '加载失败（见上方错误）' : '暂无候选',
)
const drawer = ref(false)
const detail = ref<Record<string, any> | null>(null)
const packet = ref<Record<string, any> | null>(null)
const edit = reactive({ stem: '', answer: '', explanation: '' })
const checklist = reactive({
  sourceOutcome: 'cannot_verify' as string,
  caseOutcome: 'acknowledge_draft' as string,
  kbPlanOk: false,
  kbPlanNote: '',
  flowNotes: '',
  apparatusNotes: '',
  note: '',
})
const caseReviewDecision = ref('acknowledge_draft')
const sourceEvidenceRows = ref<
  Array<{
    sourceTitle: string
    outcome: string
    evidenceNote: string
  }>
>([])
const svgPayload = ref<IndustrialSvgDisplayPayload | null>(null)
const apparatusPayload = ref<IndustrialSvgDisplayPayload | null>(null)
const actionMsg = ref('')
const actionOk = ref(false)
const defaultWorkflowSteps = [
  '1 科学来源核验（ACCESSED≠verified）',
  '2 工业案例有效审核（覆盖层）',
  '3 候选重新自动质检',
  '4 候选人工审核（通过≠入库）',
  '5 正式发布资格检查（real publish 默认 OFF）',
]

const statusOptions = [
  'generated',
  'pending_quality_review',
  'quality_checked',
  'pending_human_review',
  'needs_revision',
  'rejected',
  'approved_for_import',
  'imported',
]

function shortHash(h: unknown) {
  const s = String(h || '')
  return s ? `${s.slice(0, 16)}…` : '—'
}

/** 默认 cannot_verify；禁止预填 verified_by_admin / 已核实文案 */
function syncSourceEvidenceRows(pkt: Record<string, any> | null) {
  const refs = pkt?.case?.sourceReferences || []
  sourceEvidenceRows.value = refs.map((s: any) => ({
    sourceTitle: s.sourceTitle || '',
    outcome: 'cannot_verify',
    evidenceNote: '',
  }))
}

async function doExportBundle() {
  const batchId = String(filters.batchId || '').trim()
  if (!batchId) {
    ElMessage.warning('请先选择 / 填写批次 batchId')
    return
  }
  exporting.value = true
  try {
    const { blob, fileName } = await downloadIndustrialReviewBundle(batchId)
    if (!blob || blob.size < 64) {
      throw new Error('导出文件为空或过小')
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已下载 ${fileName}（只读导出；≠ 人审完成）`)
  } catch (e: any) {
    const msg =
      e?.response?.data instanceof Blob
        ? await e.response.data.text().catch(() => '')
        : e?.response?.data?.message || e?.message || '导出失败'
    ElMessage.error(String(msg || '导出失败').slice(0, 300))
  } finally {
    exporting.value = false
  }
}

async function reload() {
  loading.value = true
  actionMsg.value = ''
  listError.value = ''
  try {
    // API client 已解包 { success, data } → 业务 payload
    const payload = await listIndustrialCandidates({
      status: filters.status || undefined,
      qtype: filters.qtype || undefined,
      batchId: filters.batchId || undefined,
    })
    if (!payload || !Array.isArray(payload.items)) {
      listError.value =
        '响应结构异常：缺少 items（请检查 ApiSuccess 解包，勿将包装层当业务数据）'
      rows.value = []
      ElMessage.error(listError.value)
      return
    }
    rows.value = payload.items
    designNote.value = payload.formalAllowedDesignNote || ''
    e2bNote.value = payload.e2bNote || ''
    realPublishEnabled.value = !!payload.realPublishEnabled
    realPublishNote.value = payload.realPublishNote || ''
  } catch (e: any) {
    rows.value = []
    listError.value =
      e?.response?.data?.message || e?.message || '加载候选列表失败'
    ElMessage.error(listError.value)
  } finally {
    loading.value = false
  }
}

function buildSvgPayload(d: Record<string, any>) {
  if (!d.svg || !d.renderReport) {
    svgPayload.value = null
  } else {
    svgPayload.value = {
      svg: d.svg,
      width: d.renderReport?.metrics?.canvasWidth || 800,
      height: d.renderReport?.metrics?.canvasHeight || 400,
      viewBox: `0 0 ${d.renderReport?.metrics?.canvasWidth || 800} ${d.renderReport?.metrics?.canvasHeight || 400}`,
      renderReport: d.renderReport,
      publicContentHash: d.publicDiagram?.publicContentHash || '',
    }
  }
  if (d.apparatusSvg) {
    apparatusPayload.value = {
      svg: d.apparatusSvg,
      width: 800,
      height: 400,
      viewBox: '0 0 800 400',
      renderReport: {
        valid: true,
        errors: [],
        warnings: [],
        metrics: {
          diagramId: d.apparatusDefinition?.apparatusId || 'apparatus',
          diagramVersion: d.apparatusDefinition?.apparatusVersion || '1.0.0',
          publicContentHash: d.apparatusSvgContentHash || '',
          rendererVersion: '1.0.0',
          nodeCount: 0,
          edgeCount: 0,
          drawnNodeCount: 0,
          drawnEdgeCount: 0,
          canvasWidth: 800,
          canvasHeight: 400,
        },
      },
      publicContentHash: d.apparatusSvgContentHash || d.apparatusPublic?.publicContentHash || '',
    }
  } else {
    apparatusPayload.value = null
  }
}

async function openDetail(id: string) {
  loading.value = true
  try {
    const data = await getIndustrialCandidate(id)
    detail.value = data as Record<string, any>
    packet.value = (data as any).adminReviewPacket || null
    syncSourceEvidenceRows(packet.value)
    checklist.sourceOutcome = 'cannot_verify'
    checklist.caseOutcome = 'acknowledge_draft'
    caseReviewDecision.value = 'acknowledge_draft'
    checklist.note = ''
    const cand = (data as any).candidate || {}
    edit.stem = cand.stem || ''
    edit.answer = String(cand.answer ?? '')
    edit.explanation = cand.explanation || ''
    buildSvgPayload(detail.value)
    drawer.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '详情加载失败')
  } finally {
    loading.value = false
  }
}

async function refreshDetail() {
  if (!detail.value) return
  const data = await getIndustrialCandidate(detail.value.candidateId)
  detail.value = data as Record<string, any>
  packet.value = (data as any).adminReviewPacket || null
  buildSvgPayload(detail.value)
}

async function savePatch() {
  if (!detail.value) return
  busy.value = true
  actionMsg.value = ''
  try {
    await patchIndustrialCandidate(detail.value.candidateId, {
      expectedRevision: detail.value.revision,
      stem: edit.stem,
      answer: edit.answer,
      explanation: edit.explanation,
    })
    actionOk.value = true
    actionMsg.value = '已保存；质检与人工审核已失效，请重新质检'
    await refreshDetail()
    await reload()
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || e?.message || '保存失败'
  } finally {
    busy.value = false
  }
}

async function doRecheck() {
  if (!detail.value) return
  busy.value = true
  try {
    await recheckIndustrialCandidate(detail.value.candidateId)
    actionOk.value = true
    actionMsg.value = '已重新质检'
    await refreshDetail()
    await reload()
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || '质检失败'
  } finally {
    busy.value = false
  }
}

async function doChecklist() {
  if (!detail.value || !packet.value) return
  busy.value = true
  try {
    const unknownIds = (packet.value.quality?.unknownChecks || []).map(
      (c: any) => c.checkId,
    )
    await submitIndustrialAdminChecklist(detail.value.candidateId, {
      expectedRevision: detail.value.revision,
      ...checklist,
      unknownAcknowledgedCheckIds: unknownIds,
    })
    actionOk.value = true
    actionMsg.value = '审核清单已保存（未升格 approved_for_import；未写 KB links）'
    await refreshDetail()
    await reload()
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || '清单保存失败'
  } finally {
    busy.value = false
  }
}

async function doCaseReview() {
  if (!packet.value?.case?.caseCode) return
  const note = String(checklist.note || '').trim()
  if (caseReviewDecision.value === 'approve_for_publish') {
    const bad = sourceEvidenceRows.value.filter(
      (r) =>
        r.outcome !== 'verified_by_admin' ||
        String(r.evidenceNote || '').trim().length < 8,
    )
    if (bad.length) {
      ElMessage.warning(
        'approve_for_publish 要求每条来源 outcome=管理员已核验，且 evidenceNote≥8（须本人填写，禁止空模板）',
      )
      return
    }
    if (!note || note.length < 8) {
      ElMessage.warning('approve_for_publish 要求审核意见≥8字')
      return
    }
    try {
      const incomplete =
        packet.value.scientificEvidenceHelpers?.sourceEvidenceStatus ===
        'SOURCE_EVIDENCE_INCOMPLETE'
      await ElMessageBox.confirm(
        incomplete
          ? 'SOURCE_EVIDENCE_INCOMPLETE：辅助外链证据不足。仅当你已用自备教材完成核验并在 evidenceNote 写明出处时才可继续；否则请取消并选 sources_incomplete。'
          : '将授予案例「有效发布资格」（不改写 fixture published）。相关候选质检将失效，须重新质检。是否继续？',
        '案例有效审核',
        { type: 'warning' },
      )
    } catch {
      return
    }
  }
  busy.value = true
  try {
    const data = await submitIndustrialCaseReview({
      caseCode: packet.value.case.caseCode,
      contentHashAtReview: packet.value.case.contentHash,
      decision: caseReviewDecision.value,
      note:
        note ||
        (caseReviewDecision.value === 'approve_for_publish'
          ? ''
          : 'case review retain draft'),
      sourceNotes: sourceEvidenceRows.value.map((r) => ({
        sourceTitle: r.sourceTitle,
        outcome: r.outcome,
        evidenceNote: String(r.evidenceNote || '').trim() || 'not verified yet',
      })),
      expectedPriorContentHash:
        packet.value.case.overlay?.contentHashAtReview || undefined,
    })
    const eff = (data as any)?.effective
    actionOk.value = true
    actionMsg.value = `案例覆盖层已写入；fixture仍draft；有效资格=${
      eff?.grantsEffectivePublishEligibility ? 'YES' : 'NO'
    }；失效候选=${(data as any)?.candidatesInvalidated?.count ?? 0}`
    await refreshDetail()
    await reload()
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || '案例意见失败'
  } finally {
    busy.value = false
  }
}

async function doHuman(decision: string) {
  if (!detail.value || !packet.value) return
  const blockers = packet.value.formalImportBlockers || []
  if (decision === 'approve' && blockers.length) {
    try {
      await ElMessageBox.confirm(
        `当前仍有正式发布阻断：\n${blockers.join('\n')}\n\n服务端将拒绝升格 approved_for_import。是否仍尝试调用？`,
        '闸门提示',
        { type: 'warning' },
      )
    } catch {
      return
    }
  }
  busy.value = true
  try {
    const data = await humanReviewIndustrialCandidate(detail.value.candidateId, {
      decision,
      expectedRevision: detail.value.revision,
      note: checklist.note || decision,
    })
    actionOk.value = true
    actionMsg.value = `人工审核：${decision} → ${(data as any).reviewStatus}`
    await refreshDetail()
    await reload()
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || e?.message || '审核失败'
  } finally {
    busy.value = false
  }
}

async function doImport() {
  if (!detail.value) return
  busy.value = true
  try {
    const data = await formalImportIndustrialCandidate(detail.value.candidateId, {
      dryRun: true,
      expectedRevision: detail.value.revision,
    })
    actionOk.value = !!(data as any).ok
    actionMsg.value = `dry-run：${(data as any).message || JSON.stringify(data)}`
  } catch (e: any) {
    actionOk.value = false
    actionMsg.value = e?.response?.data?.message || '入库请求失败'
  } finally {
    busy.value = false
  }
}

onMounted(reload)
</script>

<style scoped>
.ind-cand {
  padding: 16px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.sub {
  color: #64748b;
  margin: 4px 0 0;
  font-size: 13px;
}
.mb {
  margin-bottom: 12px;
}
.mt {
  margin-top: 12px;
}
.actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.bullets {
  margin: 0 0 12px;
  padding-left: 1.25rem;
  color: #334155;
  font-size: 13px;
}
.opt {
  font-size: 13px;
  color: #334155;
  line-height: 1.6;
}
</style>
