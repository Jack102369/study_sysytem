<template>
  <div class="app-layout">
    <header class="header">
      <div class="brand" @click="$router.push('/')">学习系统</div>
      <el-menu mode="horizontal" :ellipsis="true" :default-active="active" router>
        <el-menu-item index="/">仪表盘</el-menu-item>
        <el-menu-item index="/errors">错题</el-menu-item>
        <el-menu-item index="/reviews">今日复习</el-menu-item>
        <el-menu-item index="/assessments">成绩</el-menu-item>
        <el-sub-menu index="more-learn">
          <template #title>学习工具</template>
          <el-menu-item index="/extensions">延伸训练</el-menu-item>
          <el-menu-item index="/chemistry">高一化学</el-menu-item>
          <el-menu-item index="/listening">英文听力</el-menu-item>
          <el-menu-item v-if="canUseAi" index="/ai-reference">AI 参考</el-menu-item>
          <el-menu-item v-if="canUseAi" index="/writing-coach">结构教练</el-menu-item>
          <el-menu-item v-if="canUseAi" index="/knowledge-cards">公式定理</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="more-data">
          <template #title>分析</template>
          <el-menu-item index="/errors/stats">错题统计</el-menu-item>
          <el-menu-item index="/assessments/trends">趋势</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/settings/subjects">设置</el-menu-item>
      </el-menu>
      <div class="actions">
        <div v-if="profile" class="welcome" :title="welcomeTitle">
          <span class="welcome-hi">你好，</span>
          <span class="welcome-name">{{ profile.nickname || '同学' }}</span>
          <span v-if="profile.grade" class="welcome-sep">·</span>
          <span v-if="profile.grade" class="welcome-grade">{{ profile.grade }}</span>
        </div>
        <el-select
          v-model="theme"
          size="small"
          style="width: 100px"
          @change="onThemeChange"
        >
          <el-option label="浅色" value="light" />
          <el-option label="深色" value="dark" />
        </el-select>
        <el-button text type="danger" @click="onLogout">退出</el-button>
      </div>
    </header>
    <main class="main">
      <div class="main-inner">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="fade-page" mode="out-in">
            <component :is="Component" :key="r.path" />
          </Transition>
        </RouterView>
      </div>
    </main>
    <PetCompanion />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/utils/theme'
import { clearToken } from '@/utils/auth-token'
import { fetchMe, type AuthUser } from '@/api/auth'
import PetCompanion from '@/components/pet/PetCompanion.vue'
import { usePetStore } from '@/stores/pet'

const route = useRoute()
const router = useRouter()
const { theme, setTheme } = useTheme()
const canUseAi = ref(false)
const profile = ref<AuthUser | null>(null)
const pet = usePetStore()

const welcomeTitle = computed(() => {
  if (!profile.value) return ''
  const parts = [profile.value.nickname, profile.value.grade, profile.value.email].filter(Boolean)
  return parts.join(' · ')
})

onMounted(async () => {
  try {
    const me = await fetchMe()
    profile.value = me
    canUseAi.value = !!me.aiEnabled
    pet.canUseAi = !!me.aiEnabled
  } catch {
    profile.value = null
    canUseAi.value = false
    pet.canUseAi = false
  }
})

const active = computed(() => {
  const p = route.path
  if (p.startsWith('/settings')) return '/settings/subjects'
  if (p.startsWith('/errors/stats')) return '/errors/stats'
  if (p.startsWith('/errors')) return '/errors'
  if (p.startsWith('/extensions')) return '/extensions'
  if (p.startsWith('/listening')) return '/listening'
  if (p.startsWith('/ai-reference')) return '/ai-reference'
  if (p.startsWith('/writing-coach')) return '/writing-coach'
  if (p.startsWith('/knowledge-cards')) return '/knowledge-cards'
  if (p.startsWith('/chemistry')) return '/chemistry'
  if (p.startsWith('/reviews')) return '/reviews'
  if (p.startsWith('/assessments/trends') || p.startsWith('/assessments/insight'))
    return '/assessments/trends'
  if (p.startsWith('/assessments')) return '/assessments'
  return '/'
})

function onThemeChange(mode: ThemeMode) {
  setTheme(mode)
}

function onLogout() {
  clearToken()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--app-bg);
  color: var(--app-text);
}
.header {
  flex-shrink: 0;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(12px);
  z-index: 20;
}
.brand {
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  color: var(--app-text);
  letter-spacing: -0.02em;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.welcome {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  height: 32px;
  padding: 0 12px 0 2px;
  border-right: 1px solid var(--app-border);
  white-space: nowrap;
  overflow: hidden;
  font-size: 13px;
  line-height: 1;
}
.welcome-hi {
  color: var(--app-text-secondary);
  flex-shrink: 0;
}
.welcome-name {
  color: var(--app-text);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
}
.welcome-sep {
  color: var(--app-border);
  flex-shrink: 0;
}
.welcome-grade {
  color: var(--app-text-secondary);
  flex-shrink: 0;
}
.main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px;
  box-sizing: border-box;
}
.main-inner {
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.main-inner > * {
  height: 100%;
}
.header :deep(.el-menu) {
  flex: 1;
  border-bottom: none;
  background: transparent;
  min-width: 0;
}
.header :deep(.el-menu-item),
.header :deep(.el-sub-menu__title) {
  color: var(--app-text-secondary);
}
.header :deep(.el-menu-item.is-active) {
  color: var(--app-primary) !important;
  font-weight: 600;
}
</style>
