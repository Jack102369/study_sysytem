<template>
  <component
    :is="inline ? 'span' : 'div'"
    class="math-stem"
    :class="{ display, inline }"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMathHtml } from '@/utils/render-math'

const props = withDefaults(
  defineProps<{
    text?: string | null
    display?: boolean
    /** 行内嵌入（rubric feedback 等） */
    inline?: boolean
  }>(),
  { text: '', display: false, inline: false },
)

const html = computed(() => renderMathHtml(props.text || ''))
</script>

<style scoped>
.math-stem {
  overflow-x: auto;
  max-width: 100%;
  line-height: 1.6;
  word-break: break-word;
}
.math-stem.inline {
  display: inline;
  overflow-x: visible;
}
.math-stem :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  margin: 0.4em 0;
}
.math-stem :deep(.katex) {
  font-size: 1.05em;
}
.display {
  font-size: 1.05em;
}
</style>
