<template>
  <div class="page-fill chem-detail" v-loading="loading">
    <div class="toolbar">
      <div class="left">
        <el-button text @click="goHome">← 返回专项中心</el-button>
        <h1>{{ detail?.name || '专项详情' }}</h1>
        <p class="sub">{{ detail?.intro }}</p>
      </div>
      <div class="right">
        <el-button @click="goHistory">训练历史</el-button>
        <el-tag v-if="detail" type="info" effect="plain">
          {{ detail.categoryCount }} 个二级分类
        </el-tag>
      </div>
    </div>

    <el-alert
      v-if="canUseTestPool"
      class="hint-alert"
      type="warning"
      :closable="false"
      show-icon
      title="个人试运行训练：选择分类后进入设置并选用试运行题库。AI初审题库，尚未完成全部人工学科审核。"
      style="margin-bottom: 12px"
    />
    <el-alert
      class="hint-alert"
      type="info"
      :closable="false"
      show-icon
      :title="
        canUseTestPool
          ? '选择二级分类进入训练设置。正式训练仅使用已审核题目；授权账号请用「个人试运行训练」。'
          : '选择二级分类进入训练设置。正式训练仅使用已审核题目。'
      "
      style="margin-bottom: 16px"
    />

    <el-empty
      v-if="!loading && detail && !detail.categories.length"
      description="该专项暂无二级分类"
    />

    <div v-else-if="detail" class="cat-scroll">
      <div class="cat-grid">
        <el-card
          v-for="(cat, idx) in detail.categories"
          :key="cat.code"
          shadow="never"
          class="cat-card"
        >
          <div class="cat-row">
            <span class="idx">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="meta">
              <div class="name">{{ cat.name }}</div>
              <div class="code">{{ cat.code }}</div>
            </div>
            <el-button size="small" type="primary" @click="goTrain(cat)">
              开始训练
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getChemSpecialty,
  type ChemCategoryItem,
  type ChemSpecialtyDetail,
} from '@/api/chemistry'
import { getChemTrainTestAccess } from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref<ChemSpecialtyDetail | null>(null)
const canUseTestPool = ref(false)

function goHome() {
  void router.push('/chemistry')
}

function goHistory() {
  void router.push('/chemistry/train/history')
}

function goTrain(cat: ChemCategoryItem) {
  if (!detail.value) return
  void router.push({
    path: `/chemistry/${encodeURIComponent(detail.value.code)}/train`,
    query: {
      category: cat.code,
      specialtyName: detail.value.name,
      categoryName: cat.name,
    },
  })
}

async function load(code: string) {
  loading.value = true
  detail.value = null
  try {
    const [d, access] = await Promise.all([
      getChemSpecialty(code),
      getChemTrainTestAccess().catch(() => ({ canUseTestPool: false })),
    ])
    detail.value = d
    canUseTestPool.value = !!access.canUseTestPool
  } catch (e) {
    ElMessage.error(errMsg(e, '加载专项失败'))
    void router.replace('/chemistry')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const code = String(route.params.code || '')
  if (code) void load(code)
})

watch(
  () => route.params.code,
  (code) => {
    if (code) void load(String(code))
  },
)
</script>

<style scoped>
.chem-detail {
  padding: 16px 20px 12px;
}
.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.toolbar h1 {
  margin: 4px 0 0;
  font-size: 1.35rem;
}
.sub {
  margin: 6px 0 0;
  color: #606266;
  font-size: 14px;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hint-alert {
  flex-shrink: 0;
}
.cat-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 24px;
}
.cat-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cat-card {
  border: 1px solid #ebeef5;
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.idx {
  font-family: ui-monospace, monospace;
  color: #909399;
  width: 28px;
}
.meta {
  flex: 1;
  min-width: 0;
}
.name {
  font-weight: 600;
}
.code {
  font-size: 12px;
  color: #909399;
}
@media (max-width: 640px) {
  .chem-detail {
    padding: 12px;
  }
}
</style>
