<template>
  <div class="page-fill train-setup" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goBack">← 返回</el-button>
      <h1>训练设置</h1>
    </div>

    <el-card shadow="never" class="card">
      <el-form label-position="top" class="form">
        <el-form-item label="章节" required>
          <el-select
            v-model="specialtyId"
            filterable
            placeholder="选择章节"
            style="width: 100%"
            :disabled="lockedFromQuery"
            @change="onSpecialtyChange"
          >
            <el-option
              v-for="sp in specialties"
              :key="sp.id"
              :label="sp.name"
              :value="sp.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="小节">
          <el-select
            v-model="categorySelect"
            filterable
            placeholder="选择小节"
            style="width: 100%"
            :disabled="!specialtyId"
          >
            <el-option label="本章全部（跨小节）" value="__all__" />
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
          <p class="hint">「本章全部」按章节+难度抽题；指定小节则仅该分类。</p>
        </el-form-item>

        <el-form-item label="难度">
          <el-radio-group v-model="difficultyMode">
            <el-radio-button value="1">基础</el-radio-button>
            <el-radio-button value="2">提高</el-radio-button>
            <el-radio-button value="3">压轴</el-radio-button>
            <el-radio-button value="trueH3">真 H3</el-radio-button>
          </el-radio-group>
          <p class="hint">
            「压轴」= 全部难度 3；「真 H3」= 题号前缀 CAND-H3（不含 HARD14）。真 H3
            仅部分章节有题。
          </p>
        </el-form-item>

        <el-form-item label="题型">
          <el-radio-group v-model="questionTypeFilter">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="single">单选</el-radio-button>
            <el-radio-button value="multi">多选</el-radio-button>
            <el-radio-button value="judge">判断</el-radio-button>
            <el-radio-button value="numeric">数值</el-radio-button>
            <el-radio-button value="application">应用题</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="题量">
          <el-radio-group v-model="count">
            <el-radio-button :value="5">5 题</el-radio-button>
            <el-radio-button :value="10">10 题</el-radio-button>
            <el-radio-button :value="20">20 题</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="选题方式">
          <el-radio-group v-model="mode">
            <el-radio-button value="sequential">顺序</el-radio-button>
            <el-radio-button value="random">随机</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="仅使用正式题库（formal）。题库不足时会按实际可抽题数开始并提示差额。"
        style="margin-bottom: 16px"
      />

      <div class="actions">
        <el-button
          type="primary"
          :disabled="!canStart"
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
  getHsMathSpecialty,
  listHsMathSpecialties,
  type HsMathCategoryItem,
  type HsMathSpecialtySummary,
} from '@/api/hs-math'
import {
  createHsMathTrainSession,
  type HsMathMode,
  type HsMathQtype,
} from '@/api/hs-math-train'
import errMsg from '@/utils/err-msg'

/** 前端「全部」用 all；请求时不传 questionType */
type QuestionTypeFilter = 'all' | HsMathQtype
/** 真 H3 单独一档；压轴=全部 difficulty=3 */
type DifficultyMode = '1' | '2' | '3' | 'trueH3'

const WHOLE_CHAPTER = '__all__'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const starting = ref(false)
const specialties = ref<HsMathSpecialtySummary[]>([])
const categories = ref<HsMathCategoryItem[]>([])
const specialtyId = ref('')
const specialtyCode = ref(String(route.params.code || ''))
const categorySelect = ref<string>(WHOLE_CHAPTER)
const difficultyMode = ref<DifficultyMode>('1')
const count = ref<5 | 10 | 20>(5)
const mode = ref<HsMathMode>('sequential')
const questionTypeFilter = ref<QuestionTypeFilter>('all')

/** 从章节页带 specialtyId 进入时锁定章节，避免误切 */
const lockedFromQuery = computed(() => {
  return Boolean(route.query.specialtyId) && Boolean(route.params.code)
})

const canStart = computed(() => Boolean(specialtyId.value))

function goBack() {
  if (specialtyCode.value) {
    void router.push(`/hs-math/specialties/${encodeURIComponent(specialtyCode.value)}`)
    return
  }
  void router.push('/hs-math')
}

async function loadCategoriesForSpecialty(id: string) {
  const sp = specialties.value.find((s) => s.id === id)
  if (!sp) {
    categories.value = []
    return
  }
  specialtyCode.value = sp.code
  try {
    const detail = await getHsMathSpecialty(sp.code)
    categories.value = detail.categories || []
  } catch (e) {
    categories.value = []
    ElMessage.error(errMsg(e, '加载小节失败'))
  }
}

async function onSpecialtyChange(id: string) {
  categorySelect.value = WHOLE_CHAPTER
  await loadCategoriesForSpecialty(id)
}

async function bootstrap() {
  loading.value = true
  try {
    specialties.value = await listHsMathSpecialties()
    const qSpId = String(route.query.specialtyId || '')
    const qCatId = String(route.query.categoryId || '')
    const code = String(route.params.code || '')

    if (qSpId && specialties.value.some((s) => s.id === qSpId)) {
      specialtyId.value = qSpId
    } else if (code) {
      const byCode = specialties.value.find((s) => s.code === code)
      if (byCode) specialtyId.value = byCode.id
    }

    if (specialtyId.value) {
      await loadCategoriesForSpecialty(specialtyId.value)
      if (qCatId && categories.value.some((c) => c.id === qCatId)) {
        categorySelect.value = qCatId
      } else {
        categorySelect.value = WHOLE_CHAPTER
      }
    }

    // 深链：?trueH3=1 优先；否则 ?difficulty=1|2|3
    const qTrueH3 = String(route.query.trueH3 || '')
    if (qTrueH3 === '1' || qTrueH3 === 'true') {
      difficultyMode.value = 'trueH3'
    } else {
      const qDiff = Number(route.query.difficulty)
      if (qDiff === 1 || qDiff === 2 || qDiff === 3) {
        difficultyMode.value = String(qDiff) as DifficultyMode
      }
    }
  } catch (e) {
    ElMessage.error(errMsg(e, '加载章节失败'))
  } finally {
    loading.value = false
  }
}

async function start() {
  if (!specialtyId.value) {
    ElMessage.warning('请选择章节')
    return
  }
  if (starting.value) return
  starting.value = true
  try {
    const trueH3Only = difficultyMode.value === 'trueH3'
    const difficulty: 1 | 2 | 3 = trueH3Only
      ? 3
      : (Number(difficultyMode.value) as 1 | 2 | 3)
    const body: Parameters<typeof createHsMathTrainSession>[0] = {
      specialtyId: specialtyId.value,
      difficulty,
      count: count.value,
      mode: mode.value,
      poolMode: 'formal',
      ...(questionTypeFilter.value !== 'all'
        ? { questionType: questionTypeFilter.value }
        : {}),
      ...(trueH3Only ? { trueH3Only: true } : {}),
    }
    if (categorySelect.value !== WHOLE_CHAPTER) {
      body.categoryId = categorySelect.value
    }
    const session = await createHsMathTrainSession(body)
    if (session.shortfall && session.shortfall > 0) {
      ElMessage.warning(
        `可用题目不足，已按 ${session.actualCount} 题开始（缺 ${session.shortfall} 题）`,
      )
    }
    void router.push(`/hs-math/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    const msg = errMsg(e, '创建训练失败')
    if (msg.includes('暂无已批准') || msg.includes('暂无') || msg.includes('真 H3')) {
      ElMessage.warning(
        '暂无可训练题目，请更换章节、小节、难度或题型，或联系管理员补充题库',
      )
    } else {
      ElMessage.error(msg)
    }
  } finally {
    starting.value = false
  }
}

watch(
  () => route.fullPath,
  () => {
    void bootstrap()
  },
)

onMounted(() => {
  void bootstrap()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
.toolbar h1 {
  margin: 4px 0 0;
  font-size: 22px;
}
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
.actions {
  margin-top: 8px;
}
</style>
