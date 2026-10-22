<template>
  <div class="page-fill train-setup" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goBack">← 返回专项</el-button>
      <h1>训练设置</h1>
    </div>

    <el-card shadow="never" class="card">
      <p class="meta">
        <strong>{{ specialtyName }}</strong>
        · {{ categoryName }}
      </p>

      <el-form label-position="top" class="form">
        <el-form-item label="难度">
          <el-radio-group v-model="difficulty">
            <el-radio-button :value="1">基础</el-radio-button>
            <el-radio-button :value="2">提高</el-radio-button>
            <el-radio-button :value="3">挑战</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="题量">
          <el-radio-group v-model="count">
            <el-radio-button :value="5">5 题</el-radio-button>
            <el-radio-button :value="10">10 题</el-radio-button>
            <el-radio-button :value="20">20 题</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="训练模式">
          <el-radio-group v-model="mode">
            <el-radio-button value="sequential">顺序训练</el-radio-button>
            <el-radio-button value="random">随机训练</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="canUseTestPool" label="题库">
          <el-radio-group v-model="poolMode">
            <el-radio-button value="formal">正式训练</el-radio-button>
            <el-radio-button value="test">个人试运行训练</el-radio-button>
          </el-radio-group>
          <p class="hint">
            个人试运行仅管理员或已授权账号可见；复用 AI 试运行题池与判题；不计入正式统计与积分。
          </p>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="canUseTestPool && poolMode === 'test'"
        type="warning"
        :closable="false"
        show-icon
        title="AI初审题库，尚未完成全部人工学科审核。"
        style="margin-bottom: 12px"
      />

      <el-alert
        v-if="availability"
        :type="availability.availableCount > 0 ? 'success' : 'warning'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>
          <template v-if="availability.availableCount > 0">
            当前可用题目：{{ availability.availableCount }} 道
            <span class="sep">·</span>
            计划训练题量：{{ count }} 道
          </template>
          <template v-else>{{ emptyHint }}</template>
        </template>
        <p v-if="availability.availableCount > 0" class="avail-note">
          可用题量按所选难度精确统计；无对应难度时为 0，不会回退到其他难度。
          <template v-if="availability.availableCount < count">
            可用不足计划量时，将按实际可用题开始。
          </template>
        </p>
      </el-alert>

      <div class="actions">
        <el-button
          type="primary"
          :disabled="!availability || availability.availableCount <= 0"
          :loading="starting"
          @click="start"
        >
          开始训练
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createChemTrainSession,
  getChemTrainAvailability,
  getChemTrainTestAccess,
  type TrainAvailability,
  type TrainMode,
  type TrainPoolMode,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const starting = ref(false)
const specialtyCode = ref(String(route.params.code || ''))
const categoryCode = ref(String(route.query.category || ''))
const specialtyName = ref(String(route.query.specialtyName || specialtyCode.value))
const categoryName = ref(String(route.query.categoryName || categoryCode.value))
const difficulty = ref(1)
const count = ref<5 | 10 | 20>(5)
const mode = ref<TrainMode>('sequential')
const poolMode = ref<TrainPoolMode>('formal')
const canUseTestPool = ref(false)
const availability = ref<TrainAvailability | null>(null)

const emptyHint = computed(() => {
  if (!availability.value || availability.value.availableCount > 0) return ''
  if (poolMode.value === 'formal' && canUseTestPool.value) {
    return '正式题库暂无题目。请切换到「个人试运行训练」；方程式专项可先试「方程式正误判断」。'
  }
  if (poolMode.value === 'test') {
    return (
      availability.value.emptyMessage ||
      '该分类下暂无个人试运行题，请换「方程式正误判断」等已有题目的分类，或降低/调整难度。'
    )
  }
  return availability.value.emptyMessage || '该专项暂无已审核的训练题目。'
})

function goBack() {
  void router.push(`/chemistry/${encodeURIComponent(specialtyCode.value)}`)
}

async function refreshAvailability() {
  if (!specialtyCode.value || !categoryCode.value) return
  loading.value = true
  try {
    availability.value = await getChemTrainAvailability({
      specialtyCode: specialtyCode.value,
      categoryCode: categoryCode.value,
      difficulty: difficulty.value,
      poolMode: poolMode.value,
    })
  } catch (e) {
    availability.value = null
    ElMessage.error(errMsg(e, '查询可用题目失败'))
  } finally {
    loading.value = false
  }
}

async function start() {
  if (!availability.value || availability.value.availableCount <= 0) {
    ElMessage.warning('该专项暂无已审核的训练题目。')
    return
  }
  starting.value = true
  try {
    const session = await createChemTrainSession({
      specialtyCode: specialtyCode.value,
      categoryCode: categoryCode.value,
      difficulty: difficulty.value,
      count: count.value,
      mode: mode.value,
      poolMode: poolMode.value,
    })
    void router.push(`/chemistry/train/session/${session.id}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '创建训练失败'))
  } finally {
    starting.value = false
  }
}

watch([difficulty, poolMode], () => {
  void refreshAvailability()
})

onMounted(async () => {
  if (!specialtyCode.value || !categoryCode.value) {
    ElMessage.error('缺少专项或分类参数')
    goBack()
    return
  }
  try {
    const a = await getChemTrainTestAccess()
    canUseTestPool.value = a.canUseTestPool
    // 授权账号默认进入个人试运行（正式池当前为 0）
    poolMode.value = a.canUseTestPool ? 'test' : 'formal'
  } catch {
    canUseTestPool.value = false
    poolMode.value = 'formal'
  }
  await refreshAvailability()
})
</script>

<style scoped>
.train-setup {
  padding: 16px 20px 32px;
  max-width: 720px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 1.25rem;
}
.meta {
  margin: 0 0 16px;
  color: #606266;
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #909399;
}
.avail-note {
  margin: 6px 0 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
.sep {
  margin: 0 4px;
  opacity: 0.5;
}
.actions {
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 640px) {
  .train-setup {
    padding: 12px;
  }
}
</style>
