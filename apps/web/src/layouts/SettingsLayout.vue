<template>
  <div class="settings-layout">
    <aside class="nav">
      <h2>基础配置</h2>
      <el-menu :default-active="active" router>
        <el-menu-item index="/settings/subjects">科目管理</el-menu-item>
        <el-menu-item index="/settings/categories">错题类别</el-menu-item>
        <el-menu-item index="/settings/assessment-types">考试类型</el-menu-item>
        <el-menu-item index="/settings/tags">标签管理</el-menu-item>
        <el-menu-item index="/settings/study-prefs">学情对比</el-menu-item>
        <el-menu-item index="/settings/rewards">积分奖励</el-menu-item>
        <el-menu-item index="/settings/pet">学习伙伴</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings/users">用户管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings/features">功能管理</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings/chemistry">化学知识库</el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings/chemistry-generator">
          化学出题器
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/settings/chemistry-train-items">
          化学训练题库
        </el-menu-item>
      </el-menu>
      <el-button class="seed" type="warning" plain @click="onSeed">
        初始化内置标签/考试类型
      </el-button>
    </aside>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchMe } from '@/api/auth'
import { seedDefaults } from '@/api/dashboard'
import errMsg from '@/utils/err-msg'

const route = useRoute()
const active = computed(() => route.path)
const isAdmin = ref(false)

onMounted(async () => {
  try {
    const me = await fetchMe()
    isAdmin.value = me.role === 'ADMIN'
  } catch {
    isAdmin.value = false
  }
})

async function onSeed() {
  try {
    await seedDefaults()
    ElMessage.success('已写入内置标签与考试类型（已存在则跳过）')
  } catch (e) {
    ElMessage.error(errMsg(e, '初始化失败'))
  }
}
</script>

<style scoped>
.settings-layout {
  height: 100%;
  display: flex;
  min-height: 0;
  background: var(--app-card-bg);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
}
.nav {
  width: 220px;
  flex-shrink: 0;
  padding: 12px;
  border-right: 1px solid var(--app-border);
  overflow: auto;
  box-sizing: border-box;
}
.nav h2 {
  margin: 4px 8px 12px;
  font-size: 16px;
  color: var(--app-text);
}
.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 12px 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.content > * {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}
/* page-fill 自己管内部滚动，避免外层再滚裁切表格 */
.content > :deep(.page-fill) {
  overflow: hidden;
}
.seed {
  margin-top: 12px;
  width: 100%;
}
</style>
