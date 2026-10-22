<template>
  <div class="page-fill" v-loading="loading">
    <div class="toolbar">
      <h1>用户管理</h1>
      <el-button type="primary" @click="openCreate">新增</el-button>
    </div>

    <div class="table-wrap">
      <el-table v-if="rows.length" :data="rows" stripe height="100%">
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="grade" label="年级" width="120" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'" size="small">
              {{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" sortable :sort-method="sortByDisabled">
          <template #default="{ row }">
            <el-tag :type="row.isDisabled ? 'info' : 'success'" size="small">
              {{ row.isDisabled ? '已停用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="OCR权限" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.ocrEnabled"
              @change="(v: string | number | boolean) => onToggleOcr(row, Boolean(v))"
            />
          </template>
        </el-table-column>
        <el-table-column label="AI权限" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.aiEnabled"
              @change="(v: string | number | boolean) => onToggleAi(row, Boolean(v))"
            />
          </template>
        </el-table-column>
        <el-table-column label="化学试运行" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.chemTrainTestEnabled"
              :disabled="row.role === 'ADMIN'"
              @change="(v: string | number | boolean) => onToggleChemTrain(row, Boolean(v))"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" sortable>
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              :type="row.isDisabled ? 'success' : 'warning'"
              :disabled="row.id === meId"
              @click="toggleDisabled(row)"
            >
              {{ row.isDisabled ? '启用' : '停用' }}
            </el-button>
            <el-button link type="primary" @click="openReset(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无用户" />
    </div>

    <el-dialog v-model="createVisible" title="新增用户" width="460px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="邮箱" required>
          <el-input v-model="createForm.email" placeholder="email@example.com" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
            placeholder="至少 6 位"
          />
        </el-form-item>
        <el-form-item label="昵称" required>
          <el-input v-model="createForm.nickname" maxlength="64" />
        </el-form-item>
        <el-form-item label="年级" required>
          <el-select v-model="createForm.grade" style="width: 100%" :loading="gradesLoading">
            <el-option v-for="g in grades" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="createForm.role">
            <el-radio label="USER">普通用户</el-radio>
            <el-radio label="ADMIN">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" title="重置密码" width="420px" destroy-on-close>
      <p class="hint" v-if="resetTarget">为 {{ resetTarget.nickname }}（{{ resetTarget.email }}）设置新密码</p>
      <el-form label-width="90px">
        <el-form-item label="新密码" required>
          <el-input
            v-model="resetPassword"
            type="password"
            show-password
            placeholder="至少 6 位"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onReset">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAdminUser,
  listAdminUsers,
  resetUserPassword,
  setUserAiEnabled,
  setUserChemTrainTestEnabled,
  setUserDisabled,
  setUserOcrEnabled,
  type AdminUser,
} from '@/api/admin-users'
import { fetchMe } from '@/api/auth'
import { fetchGrades } from '@/api/meta'
import errMsg from '@/utils/err-msg'

function sortByDisabled(a: AdminUser, b: AdminUser) {
  return Number(a.isDisabled) - Number(b.isDisabled)
}

const loading = ref(false)
const saving = ref(false)
const rows = ref<AdminUser[]>([])
const meId = ref('')
const grades = ref<string[]>([])
const gradesLoading = ref(false)

const createVisible = ref(false)
const createForm = reactive({
  email: '',
  password: '',
  nickname: '',
  grade: '',
  role: 'USER' as 'ADMIN' | 'USER',
})

const resetVisible = ref(false)
const resetTarget = ref<AdminUser | null>(null)
const resetPassword = ref('')

function formatTime(raw: string | Date | null | undefined) {
  if (!raw) return '—'
  return String(raw).slice(0, 19).replace('T', ' ')
}

async function load() {
  loading.value = true
  try {
    rows.value = await listAdminUsers()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载用户失败'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createForm.email = ''
  createForm.password = ''
  createForm.nickname = ''
  createForm.grade = grades.value[0] || ''
  createForm.role = 'USER'
  createVisible.value = true
}

async function onCreate() {
  if (!createForm.email.trim() || !createForm.password || !createForm.nickname.trim() || !createForm.grade) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (createForm.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  saving.value = true
  try {
    await createAdminUser({
      email: createForm.email.trim(),
      password: createForm.password,
      nickname: createForm.nickname.trim(),
      grade: createForm.grade,
      role: createForm.role,
    })
    ElMessage.success('已新增用户')
    createVisible.value = false
    await load()
  } catch (e) {
    ElMessage.error(errMsg(e, '新增失败'))
  } finally {
    saving.value = false
  }
}

async function toggleDisabled(row: AdminUser) {
  const next = !row.isDisabled
  try {
    await ElMessageBox.confirm(
      next ? `确定停用用户「${row.nickname}」？` : `确定启用用户「${row.nickname}」？`,
      '提示',
      { type: 'warning' },
    )
    await setUserDisabled(row.id, next)
    ElMessage.success(next ? '已停用' : '已启用')
    await load()
  } catch (e) {
    if (e === 'cancel') return
    ElMessage.error(errMsg(e, '操作失败'))
  }
}

async function onToggleOcr(row: AdminUser, enabled: boolean) {
  try {
    await setUserOcrEnabled(row.id, enabled)
    row.ocrEnabled = enabled
    ElMessage.success(enabled ? '已开通 OCR' : '已关闭 OCR')
  } catch (e) {
    ElMessage.error(errMsg(e, '更新 OCR 权限失败'))
    await load()
  }
}

async function onToggleAi(row: AdminUser, enabled: boolean) {
  try {
    await setUserAiEnabled(row.id, enabled)
    row.aiEnabled = enabled
    ElMessage.success(enabled ? '已开通 AI' : '已关闭 AI')
  } catch (e) {
    ElMessage.error(errMsg(e, '更新 AI 权限失败'))
    await load()
  }
}

async function onToggleChemTrain(row: AdminUser, enabled: boolean) {
  try {
    await setUserChemTrainTestEnabled(row.id, enabled)
    row.chemTrainTestEnabled = enabled
    ElMessage.success(enabled ? '已开通化学个人试运行' : '已关闭化学个人试运行')
  } catch (e) {
    ElMessage.error(errMsg(e, '更新化学试运行权限失败'))
    await load()
  }
}

function openReset(row: AdminUser) {
  resetTarget.value = row
  resetPassword.value = ''
  resetVisible.value = true
}

async function onReset() {
  if (!resetTarget.value) return
  if (resetPassword.value.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  saving.value = true
  try {
    await resetUserPassword(resetTarget.value.id, resetPassword.value)
    ElMessage.success('密码已重置')
    resetVisible.value = false
  } catch (e) {
    ElMessage.error(errMsg(e, '重置失败'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  gradesLoading.value = true
  try {
    const [me, g] = await Promise.all([fetchMe(), fetchGrades().catch(() => [] as string[])])
    meId.value = me.id
    grades.value = g
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    gradesLoading.value = false
  }
  await load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.hint {
  margin: 0 0 12px;
  color: var(--app-text-secondary);
  font-size: 13px;
}
</style>
