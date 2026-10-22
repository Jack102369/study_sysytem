<template>
  <div class="page" v-loading="loading">
    <template v-if="user">
      <h1>首页</h1>
      <p>昵称：{{ user.nickname }}</p>
      <p>年级：{{ user.grade }}</p>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/settings/subjects')">设置</el-button>
        <el-button type="danger" plain @click="onLogout">退出登录</el-button>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="未获取到用户信息" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchMe, type AuthUser } from '@/api/auth'
import { clearToken, getToken } from '@/utils/auth-token'

const router = useRouter()
const loading = ref(false)
const user = ref<AuthUser | null>(null)

onMounted(async () => {
  if (!getToken()) {
    router.replace('/login')
    return
  }

  loading.value = true
  try {
    user.value = await fetchMe()
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '获取用户信息失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
})

function onLogout() {
  clearToken()
  router.push('/login')
}
</script>

<style scoped>
.page {
  padding: 24px;
  min-height: 160px;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
</style>
