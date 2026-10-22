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
          <h1>创建账号</h1>
          <p class="brand-sub">几步开始：错题本、复习节奏与学习伙伴</p>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="email@example.com" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="至少 6 位"
            />
          </el-form-item>
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="昵称" />
          </el-form-item>
          <el-form-item label="年级" prop="grade">
            <el-select
              v-model="form.grade"
              placeholder="请选择年级"
              style="width: 100%"
              :loading="gradesLoading"
            >
              <el-option v-for="g in grades" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <div class="auth-primary-wrap">
              <el-button
                type="primary"
                class="auth-primary"
                :loading="submitting"
                @click="onSubmit"
              >
                注册
              </el-button>
              <BorderBeam :size="80" :duration="7" color-from="#60a5fa" color-to="#93c5fd" />
            </div>
            <el-button @click="$router.push('/login')">去登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </AuroraBackground>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'
import { fetchGrades } from '@/api/meta'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/utils/theme'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { BorderBeam } from '@/components/ui/border-beam'

const router = useRouter()
const formRef = ref<FormInstance>()
const grades = ref<string[]>([])
const gradesLoading = ref(false)
const submitting = ref(false)
const { theme, setTheme } = useTheme()

const form = reactive({
  email: '',
  password: '',
  nickname: '',
  grade: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
}

function onThemeChange(mode: ThemeMode) {
  setTheme(mode)
}

onMounted(async () => {
  gradesLoading.value = true
  try {
    grades.value = await fetchGrades()
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '加载年级失败'
    ElMessage.error(message)
  } finally {
    gradesLoading.value = false
  }
})

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await register({ ...form })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '注册失败'
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
