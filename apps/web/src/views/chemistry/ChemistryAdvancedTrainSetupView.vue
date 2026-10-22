<template>
  <div class="page-fill train-setup" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goHome">← 返回化学首页</el-button>
      <h1>提高与挑战训练</h1>
    </div>

    <el-card shadow="never" class="card">
      <p class="meta">
        跨专项提高/挑战组卷 · 绝不会为凑题抽取基础题
      </p>

      <el-form label-position="top" class="form">
        <el-form-item label="难度模式">
          <el-radio-group v-model="difficultyMode">
            <el-radio-button value="raise">提高</el-radio-button>
            <el-radio-button value="challenge">挑战</el-radio-button>
            <el-radio-button value="mix">混合（约70%提高+30%挑战）</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="专项范围">
          <el-select v-model="specialtyCode" filterable style="width: 100%">
            <el-option label="全部专项" value="all" />
            <el-option
              v-for="sp in specialties"
              :key="sp.code"
              :label="sp.name"
              :value="sp.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="specialtyCode !== 'all'" label="二级分类">
          <el-select
            v-model="categoryCode"
            filterable
            clearable
            placeholder="全部二级分类"
            style="width: 100%"
            :loading="loadingCats"
          >
            <el-option label="全部二级分类" value="all" />
            <el-option
              v-for="c in categories"
              :key="c.code"
              :label="c.name"
              :value="c.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="题目范围">
          <el-radio-group v-model="itemScope">
            <el-radio-button value="all">全部可用题目</el-radio-button>
            <el-radio-button value="s60">首批60道</el-radio-button>
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
            个人试运行仅管理员或已授权账号可见；不计入正式统计与积分。
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
        <div v-if="availability" class="avail-detail">
          <p>
            提高 {{ availability.raiseCount }} 道 · 挑战
            {{ availability.challengeCount }} 道 · 混合合计
            {{ availability.mixCount }} 道
          </p>
          <p class="avail-note">
            与组卷规则一致：严格按所选难度；混合模式不足时可在提高/挑战间调剂，绝不抽基础题。
          </p>
        </div>
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
  getChemSpecialty,
  listChemSpecialties,
  type ChemCategoryItem,
  type ChemSpecialtySummary,
} from '@/api/chemistry'
import {
  createChemAdvancedSession,
  getChemAdvancedAvailability,
  getChemTrainTestAccess,
  type AdvancedAvailability,
  type AdvancedDifficultyMode,
  type AdvancedItemScope,
  type TrainMode,
  type TrainPoolMode,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingCats = ref(false)
const starting = ref(false)
const specialties = ref<ChemSpecialtySummary[]>([])
const categories = ref<ChemCategoryItem[]>([])
const specialtyCode = ref('all')
const categoryCode = ref('all')
const difficultyMode = ref<AdvancedDifficultyMode>('raise')
const itemScope = ref<AdvancedItemScope>('all')
const count = ref<5 | 10 | 20>(5)
const mode = ref<TrainMode>('random')
const poolMode = ref<TrainPoolMode>('formal')
const canUseTestPool = ref(false)
const availability = ref<AdvancedAvailability | null>(null)

const emptyHint = computed(() => {
  if (!availability.value || availability.value.availableCount > 0) return ''
  return (
    availability.value.emptyMessage ||
    '当前筛选条件下暂无提高/挑战题。'
  )
})

function goHome() {
  void router.push('/chemistry')
}

async function loadCategories() {
  if (specialtyCode.value === 'all') {
    categories.value = []
    categoryCode.value = 'all'
    return
  }
  loadingCats.value = true
  try {
    const detail = await getChemSpecialty(specialtyCode.value)
    categories.value = detail.categories || []
    if (
      categoryCode.value !== 'all' &&
      !categories.value.some((c) => c.code === categoryCode.value)
    ) {
      categoryCode.value = 'all'
    }
  } catch (e) {
    categories.value = []
    ElMessage.error(errMsg(e, '加载二级分类失败'))
  } finally {
    loadingCats.value = false
  }
}

async function refreshAvailability() {
  loading.value = true
  try {
    availability.value = await getChemAdvancedAvailability({
      specialtyCode: specialtyCode.value,
      categoryCode:
        specialtyCode.value === 'all' || categoryCode.value === 'all'
          ? undefined
          : categoryCode.value,
      difficultyMode: difficultyMode.value,
      itemScope: itemScope.value,
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
    ElMessage.warning('当前筛选条件下暂无可用题目。')
    return
  }
  starting.value = true
  try {
    const session = await createChemAdvancedSession({
      specialtyCode: specialtyCode.value,
      categoryCode:
        specialtyCode.value === 'all' || categoryCode.value === 'all'
          ? undefined
          : categoryCode.value,
      difficultyMode: difficultyMode.value,
      itemScope: itemScope.value,
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

watch(specialtyCode, async () => {
  await loadCategories()
  await refreshAvailability()
})

watch([difficultyMode, itemScope, poolMode, categoryCode], () => {
  void refreshAvailability()
})

onMounted(async () => {
  try {
    const [list, access] = await Promise.all([
      listChemSpecialties(),
      getChemTrainTestAccess(),
    ])
    specialties.value = list
    canUseTestPool.value = access.canUseTestPool
    poolMode.value = access.canUseTestPool ? 'test' : 'formal'
    // URL 预选：?specialty=redox&mode=raise|challenge|mix
    const qSp = String(route.query.specialty || '')
    const qMode = String(route.query.mode || '')
    if (qSp && (qSp === 'all' || list.some((s) => s.code === qSp))) {
      specialtyCode.value = qSp
    }
    if (qMode === 'raise' || qMode === 'challenge' || qMode === 'mix') {
      difficultyMode.value = qMode
    }
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
.avail-detail {
  margin-top: 4px;
}
.avail-detail p {
  margin: 0;
  font-size: 13px;
  color: #606266;
}
.avail-note {
  margin-top: 6px !important;
  font-size: 12px !important;
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
