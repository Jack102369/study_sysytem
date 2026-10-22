<template>
  <el-tag size="small" disable-transitions :style="namedTagStyle(label, color)">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { namedTagStyle } from '@/utils/table-ui'

defineProps<{
  label: string
  color?: string | null
}>()
</script>
