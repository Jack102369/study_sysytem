<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>积分奖励</h1>
      <el-button text type="primary" @click="loadLedger">刷新流水</el-button>
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="「未解锁」只表示积分还没达到该档，不影响编辑。点「编辑」可改所需积分、称号、家长约定奖励（可提前写好）。"
      style="margin-bottom: 16px"
    />

    <el-row :gutter="16" v-if="summary">
      <el-col :span="8">
        <el-statistic title="累计积分" :value="summary.totalPoints" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="本周积分" :value="summary.weekPoints" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="每日上限" :value="summary.dailyCap" />
      </el-col>
    </el-row>

    <h2 class="section">奖励档位</h2>
    <el-table v-if="tiers.length" :data="tiers" stripe>
      <el-table-column prop="pointsNeeded" label="所需积分" width="110" sortable />
      <el-table-column prop="title" label="称号" width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.unlocked ? 'success' : 'info'" size="small">
            {{ row.unlocked ? '已解锁' : '未解锁' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rewardNote" label="约定奖励" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.rewardNote || '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <h2 class="section">最近流水</h2>
    <el-table v-if="ledger.length" :data="ledger" stripe size="small">
      <el-table-column prop="reasonLabel" label="原因" width="120" />
      <el-table-column prop="points" label="分" width="70" />
      <el-table-column prop="note" label="说明" min-width="140" show-overflow-tooltip />
      <el-table-column label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
    </el-table>
    <el-empty v-else-if="!loading" description="暂无积分流水" :image-size="48" />

    <el-dialog
      v-model="editVisible"
      title="编辑奖励档"
      width="460px"
      append-to-body
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="所需积分" required>
          <el-input-number v-model="editForm.pointsNeeded" :min="1" :max="100000" :step="50" />
        </el-form-item>
        <el-form-item label="称号" required>
          <el-input v-model="editForm.title" maxlength="64" />
        </el-form-item>
        <el-form-item label="约定奖励">
          <el-input
            v-model="editForm.rewardNote"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="如：周末看电影 / 加一顿火锅（未解锁前也可先填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTier">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPointsMe,
  listPointLedger,
  updateRewardTier,
  type PointLedgerItem,
  type PointsSummary,
  type RewardTier,
} from '@/api/points'
import { formatDateTime } from '@/utils/datetime'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const saving = ref(false)
const summary = ref<PointsSummary | null>(null)
const tiers = ref<RewardTier[]>([])
const ledger = ref<PointLedgerItem[]>([])
const editVisible = ref(false)
const editingId = ref('')
const editForm = reactive({
  pointsNeeded: 100,
  title: '',
  rewardNote: '',
})

function formatTime(v: string) {
  return formatDateTime(v)
}

async function load() {
  loading.value = true
  try {
    summary.value = await getPointsMe()
    tiers.value = summary.value.tiers || []
    await loadLedger()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function loadLedger() {
  try {
    const data = await listPointLedger({ page: 1, pageSize: 30 })
    ledger.value = data.items
  } catch (e) {
    ElMessage.error(errMsg(e, '流水加载失败'))
  }
}

function openEdit(row: RewardTier) {
  editingId.value = row.id
  editForm.pointsNeeded = Number(row.pointsNeeded) || 1
  editForm.title = row.title
  editForm.rewardNote = row.rewardNote || ''
  editVisible.value = true
}

async function saveTier() {
  if (!editingId.value) return
  if (!editForm.title.trim()) {
    ElMessage.warning('请填写称号')
    return
  }
  saving.value = true
  try {
    await updateRewardTier(editingId.value, {
      pointsNeeded: editForm.pointsNeeded,
      title: editForm.title.trim(),
      rewardNote: editForm.rewardNote.trim() || null,
    })
    ElMessage.success('已保存')
    editVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.section {
  margin: 20px 0 10px;
  font-size: 16px;
}
</style>
