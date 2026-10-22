<template>
  <div class="page-fill" v-loading="loading">
    <div class="toolbar">
      <h1>功能管理</h1>
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="按页面模块开关功能。关闭后仅影响对应页面的按钮显示与接口，其它模块不受影响。"
      style="margin-bottom: 12px"
    />

    <div v-for="group in groups" :key="group.moduleName" class="module-block">
      <h2>{{ group.moduleName }}</h2>
      <el-table :data="group.items" stripe>
        <el-table-column prop="label" label="功能" min-width="180" />
        <el-table-column prop="description" label="说明" min-width="280" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              @change="(v: string | number | boolean) => onToggle(row, Boolean(v))"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-empty v-if="!loading && !groups.length" description="暂无功能项" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listFeatureFlags,
  setFeatureFlagEnabled,
  type FeatureFlag,
} from '@/api/feature-flags'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const rows = ref<FeatureFlag[]>([])

const groups = computed(() => {
  const map = new Map<string, FeatureFlag[]>()
  for (const row of rows.value) {
    const list = map.get(row.moduleName) || []
    list.push(row)
    map.set(row.moduleName, list)
  }
  return [...map.entries()].map(([moduleName, items]) => ({ moduleName, items }))
})

async function load() {
  loading.value = true
  try {
    rows.value = await listFeatureFlags()
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function onToggle(row: FeatureFlag, enabled: boolean) {
  try {
    const updated = await setFeatureFlagEnabled(row.flagKey, enabled)
    row.enabled = updated.enabled
    ElMessage.success(enabled ? `已开启：${row.label}` : `已关闭：${row.label}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '更新失败'))
    await load()
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.module-block {
  margin-bottom: 20px;
}
.module-block h2 {
  margin: 0 0 8px;
  font-size: 16px;
}
</style>
