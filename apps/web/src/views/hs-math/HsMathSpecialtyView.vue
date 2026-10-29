<template>
  <div class="page-fill hs-detail" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goList">← 返回专项目录</el-button>
        <h1>{{ detail?.name || '专项详情' }}</h1>
        <p class="sub">
          <template v-if="detail?.bookCode">{{ detail.bookCode }}</template>
          <template v-if="detail?.chapterNo != null">
            · 第{{ detail.chapterNo }}章
          </template>
        </p>
        <p v-if="detail?.intro" class="intro">{{ detail.intro }}</p>
      </div>
      <div class="acts">
        <el-button type="primary" @click="goChapterTrain">本章训练</el-button>
        <el-button @click="goChapterH3">本章压轴（H3）</el-button>
        <el-button @click="goHistory">训练历史</el-button>
      </div>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="可先浏览小节知识点；也可整章抽题，或按小节开始。无已批准题目时开始训练会提示。"
      style="margin-bottom: 16px"
    />

    <el-empty
      v-if="!loading && detail && !detail.categories.length"
      description="该章节暂无分类"
    />

    <div v-else-if="detail" class="cat-grid">
      <el-card
        v-for="(cat, idx) in detail.categories"
        :key="cat.id"
        shadow="never"
        class="cat-card"
      >
        <div class="cat-row">
          <span class="idx">{{ String(idx + 1).padStart(2, '0') }}</span>
          <div class="meta">
            <div class="name">{{ cat.name }}</div>
            <div class="code">{{ cat.code }}</div>
          </div>
          <div class="btns">
            <el-button size="small" @click="goKnowledge(cat)">知识点</el-button>
            <el-button size="small" type="primary" @click="goTrain(cat)">
              开始专项训练
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getHsMathSpecialty,
  type HsMathCategoryItem,
  type HsMathSpecialtyDetail,
} from '@/api/hs-math'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref<HsMathSpecialtyDetail | null>(null)

function goList() {
  void router.push('/hs-math/specialties')
}
function goHistory() {
  void router.push('/hs-math/train/history')
}
function goChapterTrain() {
  if (!detail.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(detail.value.code)}/train`,
    query: {
      specialtyId: detail.value.id,
      specialtyName: detail.value.name,
    },
  })
}
function goChapterH3() {
  if (!detail.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(detail.value.code)}/train`,
    query: {
      specialtyId: detail.value.id,
      specialtyName: detail.value.name,
      difficulty: '3',
      trueH3: '1',
    },
  })
}
function goTrain(cat: HsMathCategoryItem) {
  if (!detail.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(detail.value.code)}/train`,
    query: {
      categoryId: cat.id,
      specialtyId: detail.value.id,
      specialtyName: detail.value.name,
      categoryName: cat.name,
    },
  })
}
function goKnowledge(cat: HsMathCategoryItem) {
  if (!detail.value) return
  void router.push({
    path: `/hs-math/specialties/${encodeURIComponent(detail.value.code)}/categories/${encodeURIComponent(cat.id)}/knowledge`,
    query: {
      specialtyCode: detail.value.code,
      specialtyId: detail.value.id,
      specialtyName: detail.value.name,
      categoryName: cat.name,
      categoryCode: cat.code,
    },
  })
}

async function load(code: string) {
  loading.value = true
  detail.value = null
  try {
    detail.value = await getHsMathSpecialty(code)
  } catch (e) {
    ElMessage.error(errMsg(e, '加载专项失败'))
    void router.replace('/hs-math/specialties')
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
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}
.toolbar h1 {
  margin: 4px 0;
  font-size: 22px;
}
.sub,
.intro {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.intro {
  margin-top: 6px;
}
.cat-grid {
  display: grid;
  gap: 10px;
}
.cat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.idx {
  font-family: ui-monospace, monospace;
  color: var(--el-color-primary);
  font-weight: 600;
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
.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
</style>
