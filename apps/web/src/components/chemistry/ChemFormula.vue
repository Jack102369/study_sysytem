<template>
  <span class="chem-formula" v-html="html" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text?: string | null }>()

/** 将 H2O / SO4^2- / ↑↓ 转为带上下标 HTML（不做 KaTeX） */
function toHtml(raw: string) {
  if (!raw) return ''
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .replace(/\^(\{[^}]+\}|[+\-]?\d+[+\-]?|[+\-])/g, (_m, g1: string) => {
      const inner = g1.startsWith('{') ? g1.slice(1, -1) : g1
      return `<sup>${inner}</sup>`
    })
    .replace(/([A-Za-z\)\]])(\d+)/g, '$1<sub>$2</sub>')
    .replace(/↑/g, '<span class="arrow">↑</span>')
    .replace(/↓/g, '<span class="arrow">↓</span>')
}

const html = computed(() => toHtml(props.text ?? ''))
</script>

<style scoped>
.chem-formula {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.01em;
}
.chem-formula :deep(sub) {
  font-size: 0.75em;
}
.chem-formula :deep(sup) {
  font-size: 0.75em;
}
.chem-formula :deep(.arrow) {
  opacity: 0.85;
}
</style>
