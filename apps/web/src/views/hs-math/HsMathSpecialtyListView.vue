<template>
  <div class="page-fill hs-list" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goHome">← 返回数学首页</el-button>
        <h1>专项目录</h1>
        <p class="sub">人教 A 版 · 章节名称来自题库配置</p>
      </div>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      style="margin-bottom: 12px"
    >
      <el-button size="small" type="primary" link @click="load">重试</el-button>
    </el-alert>

    <el-empty v-if="!loading && !rows.length" description="暂无启用专项" />

    <section v-for="group in groups" :key="group.book" class="book">
      <h2>{{ bookTitle(group.book) }}</h2>
      <div class="grid">
        <el-card
          v-for="sp in group.items"
          :key="sp.id"
          shadow="never"
          class="card"
        >
          <div class="row">
            <div>
              <div class="name">
                <span v-if="sp.chapterNo != null" class="ch">第{{ sp.chapterNo }}章</span>
                {{ sp.name }}
              </div>
              <div class="meta">{{ sp.categoryCount }} 个分类 · {{ sp.code }}</div>
              <p v-if="sp.intro" class="intro">{{ sp.intro }}</p>
            </div>
            <el-button type="primary" size="small" @click="goDetail(sp.code)">
              查看分类
            </el-button>
          </div>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listHsMathSpecialties,
  type HsMathSpecialtySummary,
} from '@/api/hs-math'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const loadError = ref('')
const rows = ref<HsMathSpecialtySummary[]>([])

const groups = computed(() => {
  const map = new Map<string, HsMathSpecialtySummary[]>()
  for (const sp of rows.value) {
    const key = sp.bookCode || '其他'
    const list = map.get(key) || []
    list.push(sp)
    map.set(key, list)
  }
  return [...map.entries()].map(([book, items]) => ({ book, items }))
})

function bookTitle(book: string) {
  if (book === '必修一') return '必修第一册'
  if (book === '必修二') return '必修第二册'
  return book
}

function goHome() {
  void router.push('/hs-math')
}
function goDetail(code: string) {
  void router.push(`/hs-math/specialties/${encodeURIComponent(code)}`)
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await listHsMathSpecialties()
  } catch (e) {
    rows.value = []
    loadError.value = errMsg(e, '加载专项目录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => void load())
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
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
.book {
  margin-bottom: 20px;
}
.book h2 {
  margin: 0 0 10px;
  font-size: 16px;
}
.grid {
  display: grid;
  gap: 10px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.name {
  font-weight: 600;
}
.ch {
  color: var(--el-color-primary);
  margin-right: 6px;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.intro {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
