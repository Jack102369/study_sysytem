<template>
  <div class="page-fill kb-detail" v-loading="loading">
    <div class="toolbar">
      <div>
        <el-button text @click="goList">← 返回知识库</el-button>
        <h1>{{ title }}</h1>
        <p class="sub">{{ CHEM_KB_TYPE_LABELS[type] }} · 已发布</p>
      </div>
      <el-tag type="success" effect="plain">published</el-tag>
    </div>

    <el-empty v-if="!loading && !detail" description="未找到内容" />

    <template v-else-if="detail">
      <el-alert
        v-if="type === 'experiment' && detail.isHazardous"
        type="error"
        :closable="false"
        show-icon
        :title="String(detail.homeForbiddenNote || '危险实验，禁止在家自行操作')"
        style="margin-bottom: 14px"
      />

      <el-alert
        v-if="warnings.length"
        type="warning"
        :closable="false"
        show-icon
        :title="warnings.join('；')"
        style="margin-bottom: 14px"
      />

      <section class="block">
        <h2>基本信息</h2>
        <el-descriptions :column="2" border>
          <el-descriptions-item
            v-for="f in basicFields"
            :key="f.key"
            :label="f.label"
          >
            <ChemFormula v-if="f.formula" :text="String(detail[f.key] ?? '')" />
            <span v-else>{{ displayVal(detail[f.key]) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section v-if="coreBlocks.length" class="block">
        <h2>核心知识</h2>
        <div v-for="b in coreBlocks" :key="b.label" class="core">
          <div class="core-label">{{ b.label }}</div>
          <div class="core-body">
            <ChemFormula v-if="b.formula" :text="b.text" />
            <span v-else style="white-space: pre-wrap">{{ b.text }}</span>
          </div>
        </div>
      </section>

      <section v-if="type === 'reaction' && species.length" class="block">
        <h2>反应物 / 生成物</h2>
        <el-table :data="species" size="small" stripe>
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              {{ roleLabel(row.role) }}
            </template>
          </el-table-column>
          <el-table-column label="化学式" min-width="120">
            <template #default="{ row }">
              <ChemFormula :text="`${row.coefficient === 1 ? '' : row.coefficient}${row.formula}`" />
            </template>
          </el-table-column>
          <el-table-column prop="stateSymbol" label="状态" width="80" />
          <el-table-column label="标记" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isGas" size="small" type="info">气体</el-tag>
              <el-tag v-if="row.isPrecipitate" size="small" type="warning">沉淀</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section v-if="related.length" class="block">
        <h2>关联知识</h2>
        <div class="links">
          <el-button
            v-for="(l, i) in related"
            :key="i"
            size="small"
            @click="goRelated(l)"
          >
            {{ CHEM_KB_TYPE_LABELS[l.toType as ChemKbType] || l.toType }}
            #{{ l.toId }}
            <span v-if="l.note" class="note">（{{ l.note }}）</span>
          </el-button>
        </div>
      </section>

      <section v-if="specialtyLabels.length" class="block">
        <h2>关联专项</h2>
        <el-tag
          v-for="s in specialtyLabels"
          :key="s"
          style="margin-right: 8px; margin-bottom: 6px"
        >
          {{ s }}
        </el-tag>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ChemFormula from '@/components/chemistry/ChemFormula.vue'
import {
  CHEM_KB_TYPE_LABELS,
  CHEM_KB_TYPES,
  getChemKb,
  type ChemKbType,
} from '@/api/chemistry-kb'
import { listChemSpecialties, type ChemSpecialtySummary } from '@/api/chemistry'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref<Record<string, unknown> | null>(null)
const allSpecialties = ref<ChemSpecialtySummary[]>([])

const type = computed(() => {
  const t = String(route.params.type || '')
  return (CHEM_KB_TYPES as readonly string[]).includes(t)
    ? (t as ChemKbType)
    : 'element'
})

const title = computed(() => {
  const d = detail.value
  if (!d) return '知识详情'
  if (type.value === 'element') return `${d.nameZh ?? ''}（${d.symbol ?? ''}）`
  if (type.value === 'question') return String(d.stem ?? '').slice(0, 40)
  return String(d.name ?? '知识详情')
})

const warnings = computed(() => {
  const w = detail.value?.warnings
  return Array.isArray(w) ? w.map(String) : []
})

const species = computed(() => {
  const s = detail.value?.species
  return Array.isArray(s) ? (s as Record<string, any>[]) : []
})

const related = computed(() => {
  const links = detail.value?.kbLinks
  return Array.isArray(links) ? (links as Array<{ toType: string; toId: string; note?: string }>) : []
})

const specialtyLabels = computed(() => {
  const ids = detail.value?.specialtyIds
  if (!Array.isArray(ids)) return [] as string[]
  const map = new Map(allSpecialties.value.map((s) => [String(s.id), s.name]))
  return ids.map((id) => map.get(String(id)) || `专项#${id}`)
})

type FieldDef = { key: string; label: string; formula?: boolean }

const basicFields = computed((): FieldDef[] => {
  switch (type.value) {
    case 'element':
      return [
        { key: 'symbol', label: '符号', formula: true },
        { key: 'nameZh', label: '中文名' },
        { key: 'nameEn', label: '英文名' },
        { key: 'atomicNumber', label: '原子序数' },
        { key: 'atomicMass', label: '相对原子质量' },
        { key: 'periodNo', label: '周期' },
        { key: 'groupLabel', label: '族' },
        { key: 'category', label: '类别' },
        { key: 'commonValences', label: '常见化合价' },
        { key: 'electronConfig', label: '电子排布' },
      ]
    case 'substance':
      return [
        { key: 'name', label: '名称' },
        { key: 'canonicalFormula', label: '化学式', formula: true },
        { key: 'commonNames', label: '俗称' },
        { key: 'color', label: '颜色' },
        { key: 'stateLabel', label: '状态' },
      ]
    case 'reaction':
      return [
        { key: 'name', label: '名称' },
        { key: 'equation', label: '方程式', formula: true },
        { key: 'ionicEquation', label: '离子方程式', formula: true },
        { key: 'conditions', label: '条件' },
        { key: 'oxidant', label: '氧化剂' },
        { key: 'reductant', label: '还原剂' },
        { key: 'difficulty', label: '难度' },
        { key: 'importance', label: '重要度' },
        { key: 'isVerified', label: '已核实' },
      ]
    case 'experiment':
      return [
        { key: 'name', label: '名称' },
        { key: 'category', label: '分类' },
        { key: 'isHazardous', label: '危险实验' },
      ]
    case 'formula':
      return [
        { key: 'name', label: '名称' },
        { key: 'expression', label: '表达式', formula: true },
        { key: 'units', label: '单位' },
      ]
    case 'concept':
      return [{ key: 'name', label: '名称' }]
    case 'knowledge':
      return [
        { key: 'name', label: '名称' },
        { key: 'difficulty', label: '难度' },
        { key: 'importance', label: '重要度' },
      ]
    case 'question':
      return [
        { key: 'qtype', label: '题型' },
        { key: 'difficulty', label: '难度' },
        { key: 'answer', label: '答案' },
      ]
    default:
      return []
  }
})

const coreBlocks = computed(() => {
  const d = detail.value
  if (!d) return [] as Array<{ label: string; text: string; formula?: boolean }>
  const pick = (label: string, key: string, formula = false) => {
    const text = String(d[key] ?? '').trim()
    return text ? { label, text, formula } : null
  }
  const list = [
    pick('原子结构', 'atomStructure'),
    pick('重要性质', 'keyProperties'),
    pick('常见用途', 'commonUses'),
    pick('溶解性', 'solubility'),
    pick('物理性质', 'physicalProps'),
    pick('化学性质', 'chemicalProps'),
    pick('检验方法', 'testMethods'),
    pick('保存方法', 'storageMethods'),
    pick('安全注意事项', 'safetyNotes'),
    pick('实验现象', 'phenomenon'),
    pick('反应原理', 'principle'),
    pick('电子转移', 'electronTransfer'),
    pick('实验目的', 'purpose'),
    pick('实验步骤', 'steps'),
    pick('实验结论', 'conclusion'),
    pick('注意事项', 'precautions'),
    pick('变量说明', 'variables'),
    pick('适用条件', 'applicableConditions'),
    pick('计算示例', 'examples'),
    pick('常见错误', 'commonMistakes'),
    pick('定义', 'definition'),
    pick('判断方法', 'judgeMethods'),
    pick('说明', 'description'),
    pick('题干', 'stem'),
    pick('解析', 'analysis'),
    pick('评分标准', 'scoring'),
  ].filter(Boolean) as Array<{ label: string; text: string; formula?: boolean }>
  return list
})

function displayVal(v: unknown) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? '是' : '否'
  return String(v)
}

function roleLabel(role: string) {
  if (role === 'reactant') return '反应物'
  if (role === 'product') return '生成物'
  if (role === 'catalyst') return '催化剂'
  return role
}

function goList() {
  void router.push('/chemistry/kb')
}

function goRelated(l: { toType: string; toId: string }) {
  if (!(CHEM_KB_TYPES as readonly string[]).includes(l.toType)) return
  void router.push(`/chemistry/kb/${l.toType}/${encodeURIComponent(l.toId)}`)
}

async function load() {
  loading.value = true
  detail.value = null
  try {
    detail.value = await getChemKb(type.value, String(route.params.id || ''))
  } catch (e) {
    ElMessage.error(errMsg(e, '加载详情失败'))
    void router.replace('/chemistry/kb')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    allSpecialties.value = await listChemSpecialties()
  } catch {
    allSpecialties.value = []
  }
  void load()
})

watch(
  () => [route.params.type, route.params.id],
  () => {
    void load()
  },
)
</script>

<style scoped>
.kb-detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
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
.block {
  margin-bottom: 20px;
}
.block h2 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 650;
}
.core {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}
.core-label {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 4px;
}
.core-body {
  font-size: 14px;
  line-height: 1.6;
}
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.note {
  opacity: 0.7;
  margin-left: 4px;
}
</style>
