<template>
  <div class="page-fill kb-home" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goChem">← 返回专项中心</el-button>
        <h1>化学知识库</h1>
        <p class="sub">浏览已发布的结构化化学知识（元素 / 物质 / 反应 / 实验等）</p>
      </div>
      <el-input
        v-model="q"
        clearable
        placeholder="搜索当前类型"
        style="width: 240px"
        @keyup.enter="reload"
        @clear="reload"
      >
        <template #append>
          <el-button @click="reload">搜索</el-button>
        </template>
      </el-input>
    </div>

    <el-tabs v-model="activeType" @tab-change="onTab">
      <el-tab-pane
        v-for="t in types"
        :key="t"
        :label="CHEM_KB_TYPE_LABELS[t]"
        :name="t"
      />
    </el-tabs>

    <el-empty v-if="!loading && !items.length" description="暂无已发布内容" />

    <div v-else class="list">
      <el-card
        v-for="row in items"
        :key="String(row.id)"
        shadow="hover"
        class="item"
        @click="goDetail(String(row.id))"
      >
        <div class="title">{{ titleOf(row) }}</div>
        <div class="meta">
          <ChemFormula v-if="formulaOf(row)" :text="formulaOf(row)" />
          <span v-else class="hint">{{ hintOf(row) }}</span>
        </div>
      </el-card>
    </div>

    <div v-if="total > pageSize" class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="page"
        @current-change="reload"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ChemFormula from '@/components/chemistry/ChemFormula.vue'
import {
  CHEM_KB_TYPE_LABELS,
  CHEM_KB_TYPES,
  listChemKb,
  type ChemKbType,
} from '@/api/chemistry-kb'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const types = [...CHEM_KB_TYPES]
const activeType = ref<ChemKbType>('element')
const loading = ref(false)
const items = ref<Record<string, unknown>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const q = ref('')

function goChem() {
  void router.push('/chemistry')
}

function goDetail(id: string) {
  void router.push(`/chemistry/kb/${activeType.value}/${encodeURIComponent(id)}`)
}

function titleOf(row: Record<string, unknown>) {
  if (activeType.value === 'element') {
    return `${row.nameZh ?? ''}（${row.symbol ?? ''}）`
  }
  if (activeType.value === 'question') {
    return String(row.stem ?? '').slice(0, 48) || '题目'
  }
  return String(row.name ?? row.expression ?? '未命名')
}

function formulaOf(row: Record<string, unknown>) {
  if (activeType.value === 'substance') return String(row.canonicalFormula ?? '')
  if (activeType.value === 'reaction') return String(row.equation ?? '')
  if (activeType.value === 'formula') return String(row.expression ?? '')
  if (activeType.value === 'element') return String(row.symbol ?? '')
  return ''
}

function hintOf(row: Record<string, unknown>) {
  if (activeType.value === 'experiment') return String(row.category ?? '')
  if (activeType.value === 'concept') return String(row.definition ?? '').slice(0, 60)
  if (activeType.value === 'knowledge') return String(row.description ?? '').slice(0, 60)
  if (activeType.value === 'question') return String(row.qtype ?? '')
  return ''
}

async function reload() {
  loading.value = true
  try {
    const res = await listChemKb(activeType.value, {
      page: page.value,
      pageSize,
      q: q.value.trim() || undefined,
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    ElMessage.error(errMsg(e, '加载知识库失败'))
  } finally {
    loading.value = false
  }
}

function onTab() {
  page.value = 1
  void reload()
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.kb-home {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}
.toolbar h1 {
  margin: 4px 0 0;
  font-size: 22px;
  font-weight: 650;
}
.sub {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.65;
}
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  padding-bottom: 16px;
}
.item {
  cursor: pointer;
  border-radius: 10px;
}
.title {
  font-weight: 650;
  font-size: 15px;
  margin-bottom: 8px;
}
.meta {
  font-size: 13px;
  opacity: 0.8;
  min-height: 20px;
}
.hint {
  opacity: 0.65;
}
.pager {
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
}
</style>
