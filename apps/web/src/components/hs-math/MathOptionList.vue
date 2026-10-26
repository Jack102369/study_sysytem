<template>
  <div class="opts">
    <el-radio-group
      v-if="mode === 'single'"
      :model-value="singleValue"
      :disabled="disabled"
      class="opt-col"
      @update:model-value="onSingle"
    >
      <el-radio v-for="opt in options" :key="opt.id" :value="opt.id">
        <MathStem :text="opt.text" />
      </el-radio>
    </el-radio-group>

    <el-checkbox-group
      v-else
      :model-value="multiValue"
      :disabled="disabled"
      class="opt-col"
      @update:model-value="onMulti"
    >
      <el-checkbox v-for="opt in options" :key="opt.id" :value="opt.id">
        <MathStem :text="opt.text" />
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HsMathOptionItem } from '@/api/hs-math-train'
import MathStem from './MathStem.vue'

const props = defineProps<{
  mode: 'single' | 'multi'
  options: HsMathOptionItem[]
  modelValue: string | string[] | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
}>()

const singleValue = computed(() =>
  typeof props.modelValue === 'string' ? props.modelValue : '',
)

const multiValue = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
)

function onSingle(v: string | number | boolean | undefined) {
  if (typeof v === 'string') emit('update:modelValue', v)
}

function onMulti(v: Array<string | number>) {
  const ids = [...new Set(v.map(String))]
  emit('update:modelValue', ids)
}
</script>

<style scoped>
.opt-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.opt-col :deep(.el-radio),
.opt-col :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
  white-space: normal;
  align-items: flex-start;
}
</style>
