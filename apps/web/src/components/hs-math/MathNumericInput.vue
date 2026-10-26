<template>
  <div class="numeric">
    <el-input
      :model-value="modelValue"
      :disabled="disabled"
      placeholder="请输入数值，如 2、-3.5、1/2"
      maxlength="64"
      @update:model-value="onInput"
    />
    <p class="hint">
      支持整数、小数、负数与分数（如 1/2）。不支持科学计数法。提交保留你的原始输入，由系统判题。
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(v: string) {
  emit('update:modelValue', v)
}
</script>

<style scoped>
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
