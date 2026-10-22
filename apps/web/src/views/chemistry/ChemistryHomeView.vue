<template>
  <div class="page-fill chem-home" v-loading="loading">
    <!-- 区1：今日状态 -->
    <header class="hero">
      <div>
        <h1>今天的化学学习</h1>
        <p class="sub">
          北京时间 {{ home?.today || '—' }} · 建议路径：基础巩固 → 错题复习 → 变式 → 提高/挑战（非强制）
        </p>
      </div>
      <div class="acts">
        <el-button type="success" @click="goAnalytics">学习分析</el-button>
        <el-button @click="goHistory">训练历史</el-button>
        <el-button type="primary" plain @click="goKb">化学知识库</el-button>
      </div>
    </header>

    <el-alert
      v-if="loadError"
      type="error"
      :closable="false"
      show-icon
      :title="loadError"
      style="margin-bottom: 12px"
    />

    <div v-if="home" class="status-strip">
      <div class="chip">
        <span class="lab">基础巩固</span>
        <strong>{{ dailyPhaseLabel }}</strong>
      </div>
      <div class="chip">
        <span class="lab">今日待复习错题</span>
        <strong>{{ home.wrong.dueTodayCount }}</strong>
      </div>
      <div class="chip">
        <span class="lab">今日已完成训练</span>
        <strong>{{ home.activityToday.submittedSessions }}</strong>
      </div>
      <div class="chip">
        <span class="lab">今日已练习题次</span>
        <strong>{{ home.activityToday.practicedItems }}</strong>
      </div>
    </div>
    <p class="hint-top">
      「基础巩固完成」仅统计每日10分钟；错题复练/变式/提高/专项不计入每日完成。
    </p>

    <!-- 区2：今日任务 -->
    <section class="tasks">
      <h2>今日学习任务</h2>

      <el-card shadow="never" class="task daily">
        <div class="task-inner">
          <div>
            <h3>1. 每日10分钟基础巩固</h3>
            <p>
              建议约 {{ home?.daily.estimatedMinutes || 10 }} 分钟 · 目标约
              {{ home?.daily.targetCount || 10 }} 题 · 状态：{{ dailyPhaseLabel }}
            </p>
            <p v-if="home?.daily.emptyHint" class="warn">{{ home.daily.emptyHint }}</p>
          </div>
          <div class="task-acts">
            <el-button
              v-if="home?.daily.inProgressSessionId"
              type="primary"
              @click="continueDaily"
            >
              继续（{{ home.daily.inProgressAnswered }}/{{ home.daily.inProgressActual }}）
            </el-button>
            <el-button
              type="primary"
              :plain="!!home?.daily.inProgressSessionId"
              :disabled="!home?.daily.canTrain && !home?.daily.inProgressSessionId"
              @click="goDaily"
            >
              {{
                home?.daily.phase === 'completed'
                  ? '再次练习'
                  : home?.daily.inProgressSessionId
                    ? '打开每日页'
                    : '开始'
              }}
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="task wrong">
        <div class="task-inner">
          <div>
            <h3>2. 今日错题复习</h3>
            <p v-if="(home?.wrong.dueTodayCount || 0) > 0">
              待攻克 {{ home?.wrong.openCount }} · 到期巩固中
              {{ home?.wrong.consolidatingDueTodayCount }} · 今日建议复习
              {{ home?.wrong.dueTodayCount }}
            </p>
            <p v-else>今天暂无需要复习的错题。</p>
          </div>
          <el-button
            type="danger"
            :disabled="!((home?.wrong?.dueTodayCount ?? 0) > 0)"
            @click="goWrongDue"
          >
            复习今日错题
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="task variation">
        <div class="task-inner">
          <div>
            <h3>3. 错题变式巩固</h3>
            <p>
              {{ home?.variation.note || '在错题详情中查看可靠变式并开始训练。' }}
            </p>
          </div>
          <el-button type="danger" plain @click="goWrong">进入错题中心</el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="task advanced">
        <div class="task-inner">
          <div>
            <h3>4. 提高与挑战训练（可选）</h3>
            <template v-if="home?.recommendAdvanced?.availableCount">
              <p>
                推荐：{{ home.recommendAdvanced.specialtyName }} ·
                {{ modeLabel(home.recommendAdvanced.difficultyMode) }} · 可练约
                {{ home.recommendAdvanced.availableCount }} 道
              </p>
              <p class="meta">{{ home.recommendAdvanced.reason }}</p>
              <p v-if="home.recommendAdvanced.shortfallHint" class="warn">
                {{ home.recommendAdvanced.shortfallHint }}
              </p>
            </template>
            <p v-else>
              {{ home?.recommendAdvanced?.emptyHint || '可以自主选择提高或挑战训练。' }}
            </p>
          </div>
          <div class="task-acts">
            <el-button
              v-if="home?.recommendAdvanced?.path"
              type="warning"
              @click="goRecommendAdvanced"
            >
              进入推荐训练
            </el-button>
            <el-button type="warning" plain @click="goAdvanced">提高与挑战</el-button>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 区3：概览 -->
    <section v-if="home" class="overview">
      <el-card shadow="never" class="ov-card">
        <h3>今日概览</h3>
        <ul>
          <li>已提交训练 {{ home.activityToday.submittedSessions }} 次</li>
          <li>已练习题次 {{ home.activityToday.practicedItems }}</li>
          <li>
            明确正确 {{ home.activityToday.correctCount }} / 错误
            {{ home.activityToday.wrongCount }}
          </li>
          <li>
            正确率
            {{
              home.activityToday.accuracyPercent == null
                ? '—'
                : home.activityToday.accuracyPercent + '%'
            }}
          </li>
          <li v-if="home.activityToday.pendingReviewCount">
            待复核 {{ home.activityToday.pendingReviewCount }}（不计入正确率）
          </li>
        </ul>
      </el-card>
      <el-card shadow="never" class="ov-card">
        <h3>近7天概览</h3>
        <p class="meta">{{ home.activity7d.windowNote }}（{{ home.activity7d.windowStart }} ~ {{ home.activity7d.windowEnd }}）</p>
        <ul>
          <li>已提交训练 {{ home.activity7d.submittedSessions }} 次</li>
          <li>已练习题次 {{ home.activity7d.practicedItems }}</li>
          <li>
            明确正确率
            {{
              home.activity7d.accuracyPercent == null
                ? '—'
                : home.activity7d.accuracyPercent + '%'
            }}
          </li>
          <li>窗内新增错题 {{ home.activity7d.newWrongItems }}</li>
          <li>
            {{ home.activity7d.masteredWrongItemsLabel }}
            {{ home.activity7d.masteredWrongItems }}
          </li>
        </ul>
      </el-card>
    </section>

    <!-- 区4：全部功能 -->
    <section class="all-funcs">
      <h2>全部学习功能</h2>
      <el-alert
        v-if="canUseTestPool"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
        title="个人试运行训练已开放"
        description="专项训练请选择「个人试运行」。AI初审题库，尚未完成全部人工学科审核。不计入正式积分。"
      />

      <div class="entry-row">
        <el-button type="primary" @click="goDaily">每日10分钟</el-button>
        <el-button type="warning" plain @click="goAdvanced">提高与挑战</el-button>
        <el-button type="danger" plain @click="goWrong">我的错题</el-button>
        <el-button type="success" plain @click="goAnalytics">学习分析</el-button>
        <el-button @click="goHistory">训练历史</el-button>
        <el-button type="primary" plain @click="goKb">化学知识库</el-button>
      </div>

      <el-empty
        v-if="!loading && !rows.length"
        description="暂无专项数据，请确认已执行数据库迁移"
      />
      <div v-else class="grid">
        <el-card
          v-for="item in rows"
          :key="item.code"
          shadow="hover"
          class="spec-card"
          @click="goSpecialty(item.code)"
        >
          <div class="card-top">
            <div class="badge" :data-tone="toneOf(item.sortOrder)">
              {{ shortLabel(item.name) }}
            </div>
            <el-tag size="small" type="info" effect="plain">
              {{ item.categoryCount }} 个分类
            </el-tag>
          </div>
          <h2 class="title">{{ item.name }}</h2>
          <p class="intro">{{ item.intro || '专项训练' }}</p>
          <div class="foot">
            <el-button type="primary" link @click.stop="goSpecialty(item.code)">
              进入专项 →
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
import { ElMessage } from 'element-plus'
import {
  listChemSpecialties,
  type ChemSpecialtySummary,
} from '@/api/chemistry'
import {
  getChemLearningHome,
  getChemTrainTestAccess,
  type ChemLearningHome,
} from '@/api/chemistry-train'
import errMsg from '@/utils/err-msg'

const router = useRouter()
const loading = ref(false)
const rows = ref<ChemSpecialtySummary[]>([])
const canUseTestPool = ref(false)
const home = ref<ChemLearningHome | null>(null)
const loadError = ref('')

const dailyPhaseLabel = computed(() => {
  const p = home.value?.daily?.phase
  if (p === 'in_progress') return '进行中'
  if (p === 'completed') return '已完成'
  return '未开始'
})

function shortLabel(name: string) {
  return (name || '化').slice(0, 1)
}

function toneOf(sort: number) {
  return String(((sort - 1) % 6) + 1)
}

function modeLabel(m: string | null | undefined) {
  if (m === 'raise') return '提高'
  if (m === 'challenge') return '挑战'
  if (m === 'mix') return '混合'
  return '提高/挑战'
}

function goSpecialty(code: string) {
  void router.push(`/chemistry/${encodeURIComponent(code)}`)
}
function goKb() {
  void router.push('/chemistry/kb')
}
function goHistory() {
  void router.push('/chemistry/train/history')
}
function goDaily() {
  void router.push('/chemistry/daily')
}
function continueDaily() {
  const id = home.value?.daily?.inProgressSessionId
  if (id) {
    void router.push(`/chemistry/train/session/${encodeURIComponent(id)}`)
    return
  }
  goDaily()
}
function goAdvanced() {
  void router.push('/chemistry/advanced')
}
function goRecommendAdvanced() {
  const path = home.value?.recommendAdvanced?.path || '/chemistry/advanced'
  void router.push(path)
}
function goWrong() {
  void router.push('/chemistry/wrong-questions')
}
function goWrongDue() {
  void router.push('/chemistry/wrong-questions?focus=due')
}
function goAnalytics() {
  void router.push('/chemistry/analytics')
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [list, access, lh] = await Promise.all([
      listChemSpecialties(),
      getChemTrainTestAccess().catch(() => ({ canUseTestPool: false })),
      getChemLearningHome().catch((e) => {
        loadError.value = errMsg(e, '学习中心数据加载失败，部分区块可能不可用')
        return null
      }),
    ])
    rows.value = list
    canUseTestPool.value = !!access.canUseTestPool
    home.value = lh
  } catch (e) {
    ElMessage.error(errMsg(e, '加载化学学习中心失败'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.chem-home {
  padding: 16px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}
.hero h1 {
  margin: 0;
  font-size: 1.35rem;
}
.sub {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.7;
}
.acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.status-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 8px 0 4px;
}
.chip {
  border-radius: 10px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border: 1px solid var(--el-border-color-lighter);
}
.chip .lab {
  display: block;
  font-size: 12px;
  opacity: 0.7;
}
.chip strong {
  font-size: 18px;
}
.hint-top,
.meta,
.warn {
  font-size: 12px;
  color: #909399;
  margin: 0 0 8px;
}
.warn {
  color: var(--el-color-warning);
}
.tasks h2,
.all-funcs h2 {
  margin: 12px 0 10px;
  font-size: 1.05rem;
}
.task {
  margin-bottom: 10px;
  border-radius: 12px;
}
.task.daily {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}
.task.wrong,
.task.variation {
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
  background: color-mix(in srgb, var(--el-color-danger) 5%, transparent);
}
.task.advanced {
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 35%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
}
.task-inner {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.task h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.task p {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
.task-acts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
}
.ov-card {
  border-radius: 12px;
}
.ov-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
}
.ov-card ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
}
.entry-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.spec-card {
  cursor: pointer;
  border-radius: 12px;
}
.card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}
.title {
  margin: 0 0 8px;
  font-size: 16px;
}
.intro {
  margin: 0;
  min-height: 36px;
  font-size: 13px;
  opacity: 0.72;
}
.foot {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 720px) {
  .status-strip,
  .overview {
    grid-template-columns: 1fr 1fr;
  }
  .chem-home {
    padding: 12px;
  }
}
</style>
