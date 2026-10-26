<template>
  <div class="page-fill hs-kp-detail" v-loading="loading">
    <div class="toolbar">
      <el-button text @click="goBack">← 返回</el-button>
    </div>

    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      :closable="false"
    />

    <template v-else-if="detail">
      <header class="head">
        <h1>{{ detail.name }}</h1>
        <p class="code">{{ detail.code }}</p>
        <p class="path">
          {{ detail.specialty.name }}
          <span v-if="detail.category"> · {{ detail.category.name }}</span>
          <span v-if="detail.parent"> · 上级：{{ detail.parent.name }}</span>
        </p>
      </header>

      <el-card shadow="never" class="summary-card">
        <template #header>知识点说明</template>
        <div
          v-if="detail.summary"
          class="summary"
          v-html="summaryHtml"
        />
        <el-empty v-else description="暂无说明" :image-size="64" />
      </el-card>

      <div class="acts">
        <el-button @click="goCategory">所属小节知识点</el-button>
        <el-button type="primary" @click="goSpecialty">返回章节</el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getHsMathKnowledgePoint,
  type HsMathKnowledgeDetail,
} from '@/api/hs-math'
import errMsg from '@/utils/err-msg'
import { renderMathHtml } from '@/utils/render-math'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const detail = ref<HsMathKnowledgeDetail | null>(null)

const summaryHtml = computed(() =>
  renderMathHtml(detail.value?.summary || ''),
)

function goBack() {
  const fromCat = String(route.query.fromCategoryId || '')
  const spCode = String(route.query.specialtyCode || detail.value?.specialty.code || '')
  if (fromCat && spCode) {
    void router.push({
      path: `/hs-math/specialties/${encodeURIComponent(spCode)}/categories/${encodeURIComponent(fromCat)}/knowledge`,
      query: {
        specialtyCode: spCode,
        specialtyName: detail.value?.specialty.name,
        categoryName: detail.value?.category.name,
        categoryCode: detail.value?.category.code,
        specialtyId: detail.value?.specialty.id,
      },
    })
    return
  }
  if (spCode) {
    void router.push(`/hs-math/specialties/${encodeURIComponent(spCode)}`)
    return
  }
  void router.push('/hs-math/specialties')
}

function goCategory() {
  if (!detail.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(detail.value.specialty.code)}/categories/${encodeURIComponent(detail.value.category.id)}/knowledge`,
    query: {
      specialtyCode: detail.value.specialty.code,
      specialtyName: detail.value.specialty.name,
      specialtyId: detail.value.specialty.id,
      categoryName: detail.value.category.name,
      categoryCode: detail.value.category.code,
    },
  })
}

function goSpecialty() {
  if (!detail.value) return
  void router.push(
    `/hs-math/specialties/${encodeURIComponent(detail.value.specialty.code)}`,
  )
}

async function load(code: string) {
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    detail.value = await getHsMathKnowledgePoint(code)
  } catch (e) {
    error.value = errMsg(e, '加载知识点失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => void load(String(route.params.code || '')))
watch(
  () => route.params.code,
  (c) => {
    if (c) void load(String(c))
  },
)
</script>

<style scoped>
.toolbar {
  margin-bottom: 8px;
}
.head h1 {
  margin: 0 0 4px;
  font-size: 22px;
}
.code {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.path {
  margin: 8px 0 16px;
  font-size: 14px;
}
.summary-card {
  margin-bottom: 16px;
}
.summary {
  line-height: 1.7;
  word-break: break-word;
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
