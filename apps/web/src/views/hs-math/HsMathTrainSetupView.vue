<template>
  <div class="page-fill train-setup" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goBack">← 返回章节</el-button>
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
            <el-radio-button :value="3">压轴</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 题型筛选：默认全部，兼容旧行为；应用题可单独练习 -->
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
        title="P0 仅使用正式题库（formal）。若暂无已批准题目，将无法创建训练。"
        style="margin-bottom: 16px"
      />

      <div class="actions">
        <el-button
          type="primary"
          :disabled="!specialtyId || !categoryId"
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
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createHsMathTrainSession,
  type HsMathMode,
  type HsMathQtype,
} from '@/api/hs-math-train'
import errMsg from '@/utils/err-msg'

/** 前端「全部」用 all；请求时不传 questionType */
type QuestionTypeFilter = 'all' | HsMathQtype

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const starting = ref(false)
const specialtyCode = ref(String(route.params.code || ''))
const specialtyId = ref(String(route.query.specialtyId || ''))
const categoryId = ref(String(route.query.categoryId || ''))
const specialtyName = ref(String(route.query.specialtyName || specialtyCode.value))
const categoryName = ref(String(route.query.categoryName || ''))
const difficulty = ref<1 | 2 | 3>(1)
const count = ref<5 | 10 | 20>(5)
const mode = ref<HsMathMode>('sequential')
const questionTypeFilter = ref<QuestionTypeFilter>('all')

function goBack() {
  void router.push(`/hs-math/specialties/${encodeURIComponent(specialtyCode.value)}`)
}

async function start() {
  if (!specialtyId.value || !categoryId.value) {
    ElMessage.warning('缺少章节或分类，请从目录重新进入')
    return
  }
  if (starting.value) return
  starting.value = true
  try {
    const session = await createHsMathTrainSession({
      specialtyId: specialtyId.value,
      categoryId: categoryId.value,
      difficulty: difficulty.value,
      count: count.value,
      mode: mode.value,
      poolMode: 'formal',
      ...(questionTypeFilter.value !== 'all'
        ? { questionType: questionTypeFilter.value }
        : {}),
    })
    if (session.shortfall && session.shortfall > 0) {
      ElMessage.warning(
        `可用题目不足，已按 ${session.actualCount} 题开始（缺 ${session.shortfall} 题）`,
      )
    }
    void router.push(`/hs-math/train/session/${encodeURIComponent(session.id)}`)
  } catch (e) {
    const msg = errMsg(e, '创建训练失败')
    if (msg.includes('暂无已批准') || msg.includes('暂无')) {
      ElMessage.warning(
        '暂无可训练题目，请更换分类、难度或题型，或联系管理员补充题库',
      )
    } else {
      ElMessage.error(msg)
    }
  } finally {
    starting.value = false
  }
}

onMounted(() => {
  if (!specialtyId.value || !categoryId.value) {
    ElMessage.warning('请从章节分类页选择分类后再开始训练')
  }
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
.meta {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
}
.actions {
  margin-top: 8px;
}
</style>
