<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>学情对比</h1>
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="用于仪表盘「心情条」：最近一场考试相对上一场，按你选择的口径判断进步/退步。"
      style="margin-bottom: 16px"
    />

    <el-form v-if="form" label-width="120px" style="max-width: 520px">
      <el-form-item label="对比口径">
        <el-radio-group v-model="form.compareMode">
          <el-radio label="score">分数 / 得分率</el-radio>
          <el-radio label="class_rank">班排</el-radio>
          <el-radio label="school_rank">校排</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="分数阈值">
        <el-input-number v-model="form.scoreThreshold" :min="0" :max="100" :step="1" :precision="1" />
        <span class="hint">分差或得分率百分点 ≥ 此值算进/退（默认 1）</span>
      </el-form-item>
      <el-form-item label="排名阈值">
        <el-input-number v-model="form.rankThreshold" :min="1" :max="1000" :step="1" />
        <span class="hint">名次变化 ≥ 此值算进/退（默认 1）</span>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getStudyPrefs,
  updateStudyPrefs,
  type StudyCompareMode,
} from '@/api/study-prefs'
import errMsg from '@/utils/err-msg'

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  compareMode: 'score' as StudyCompareMode,
  scoreThreshold: 1,
  rankThreshold: 1,
})

async function load() {
  loading.value = true
  try {
    const p = await getStudyPrefs()
    form.compareMode = p.compareMode
    form.scoreThreshold = p.scoreThreshold
    form.rankThreshold = p.rankThreshold
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    await updateStudyPrefs({
      compareMode: form.compareMode,
      scoreThreshold: form.scoreThreshold,
      rankThreshold: form.rankThreshold,
    })
    ElMessage.success('已保存，返回仪表盘可查看心情条')
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar h1 {
  margin: 0 0 12px;
  font-size: 20px;
}
.hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
