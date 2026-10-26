<template>
  <div class="page-fill hs-kp-list" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goBack">← 返回章节</el-button>
        <h1>{{ categoryName || '小节知识点' }}</h1>
        <p class="sub">
          <span v-if="specialtyName">{{ specialtyName }}</span>
          <span v-if="categoryCode"> · {{ categoryCode }}</span>
        </p>
      </div>
      <el-button
        v-if="specialtyCode"
        type="primary"
        @click="goTrain"
      >
        开始专项训练
      </el-button>
    </div>

    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
    />

    <el-empty
      v-else-if="!loading && !items.length"
      description="该小节暂无知识点"
    />

    <div v-else class="kp-grid">
      <el-card
        v-for="(kp, idx) in items"
        :key="kp.code"
        shadow="never"
        class="kp-card"
        @click="goDetail(kp.code)"
      >
        <div class="kp-row">
          <span class="idx">{{ String(idx + 1).padStart(2, '0') }}</span>
          <div class="meta">
            <div class="name">{{ kp.name }}</div>
            <div class="code">{{ kp.code }}</div>
          </div>
          <el-button size="small" text type="primary">查看</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listHsMathCategoryKnowledgePoints,
  type HsMathKnowledgeListItem,
} from '@/api/hs-math'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const items = ref<HsMathKnowledgeListItem[]>([])

const specialtyCode = ref(String(route.query.specialtyCode || ''))
const specialtyName = ref(String(route.query.specialtyName || ''))
const categoryName = ref(String(route.query.categoryName || ''))
const categoryCode = ref(String(route.query.categoryCode || ''))
const specialtyId = ref(String(route.query.specialtyId || ''))

function goBack() {
  if (specialtyCode.value) {
    void router.push(
      `/hs-math/specialties/${encodeURIComponent(specialtyCode.value)}`,
    )
  } else {
    void router.push('/hs-math/specialties')
  }
}

function goTrain() {
  if (!specialtyCode.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(specialtyCode.value)}/train`,
    query: {
      categoryId: String(route.params.categoryId || ''),
      specialtyId: specialtyId.value,
      specialtyName: specialtyName.value,
      categoryName: categoryName.value,
    },
  })
}

function goDetail(code: string) {
  void router.push({
    path: `/hs-math/kp/${encodeURIComponent(code)}`,
    query: {
      specialtyCode: specialtyCode.value,
      fromCategoryId: String(route.params.categoryId || ''),
    },
  })
}

async function load() {
  const categoryId = String(route.params.categoryId || '')
  if (!categoryId) {
    error.value = '缺少小节 ID'
    return
  }
  loading.value = true
  error.value = ''
  items.value = []
  try {
    items.value = await listHsMathCategoryKnowledgePoints(categoryId)
  } catch (e) {
    error.value = errMsg(e, '加载知识点失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => void load())
watch(
  () => route.params.categoryId,
  () => void load(),
)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.toolbar h1 {
  margin: 4px 0;
  font-size: 22px;
}
.sub {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.kp-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kp-card {
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
}
.kp-card:hover {
  border-color: var(--el-color-primary-light-5);
}
.kp-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.idx {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-secondary);
}
</style>
