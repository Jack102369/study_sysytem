<template>
  <AuroraBackground class="min-h-full">
    <div class="page-shell auth-page auth-shell">
      <div class="theme-bar">
        <el-select v-model="theme" size="small" style="width: 100px" @change="onThemeChange">
          <el-option label="浅色" value="light" />
          <el-option label="深色" value="dark" />
        </el-select>
      </div>
      <div class="auth-card">
        <div class="brand-block">
          <p class="brand-name">学习系统</p>
          <h1>欢迎回来</h1>
          <p class="brand-sub">记录错题 · 复盘进步 · 有伙伴陪你学</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="email@example.com" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item>
            <div class="auth-primary-wrap">
              <el-button
                type="primary"
                class="auth-primary"
                :loading="submitting"
                @click="onSubmit"
              >
                登录
              </el-button>
              <BorderBeam :size="80" :duration="7" color-from="#60a5fa" color-to="#93c5fd" />
            </div>
            <el-button @click="$router.push('/register')">去注册</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </AuroraBackground>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/utils/theme'
import { setToken } from '@/utils/auth-token'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { BorderBeam } from '@/components/ui/border-beam'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const { theme, setTheme } = useTheme()

const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

function onThemeChange(mode: ThemeMode) {
  setTheme(mode)
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const { accessToken } = await login({ ...form })
    setToken(accessToken)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '登录失败'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-shell {
  background: transparent !important;
}
.auth-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 100%;
}
.theme-bar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}
.auth-card {
  width: min(440px, 100%);
  padding: 28px 28px 20px;
  border-radius: var(--app-radius-lg);
  background: color-mix(in srgb, var(--app-card-bg) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-border) 80%, transparent);
  box-shadow: var(--app-shadow-md);
  backdrop-filter: blur(14px);
}
.brand-block {
  margin-bottom: 18px;
}
.brand-name {
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--app-primary);
  font-weight: 600;
}
.auth-card h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.brand-sub {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.5;
}
.auth-primary-wrap {
  position: relative;
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 12px;
}
.auth-primary {
  min-width: 96px;
  margin: 0 !important;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--app-primary) 28%, transparent);
}
</style>
