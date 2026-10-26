<template>
  <el-radio-group :model-value="modelValue" :disabled="disabled" @update:model-value="onChange">
    <el-radio :value="true">正确</el-radio>
    <el-radio :value="false">错误</el-radio>
  </el-radio-group>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function onChange(v: string | number | boolean | undefined) {
  if (typeof v === 'boolean') emit('update:modelValue', v)
}
</script>
