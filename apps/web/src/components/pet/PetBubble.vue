<template>
  <transition name="pop">
    <div v-if="text" class="bubble">{{ text }}</div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{ text: string | null | undefined }>()
</script>

<style scoped>
.bubble {
  max-width: 200px;
  padding: 8px 12px;
  border-radius: 12px 12px 4px 12px;
  background: var(--el-bg-color-overlay, #fff);
  color: var(--app-text, #333);
  border: 1px solid var(--el-border-color-lighter, #e5e5e5);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  line-height: 1.45;
  word-break: break-word;
}
.pop-enter-active,
.pop-leave-active {
  transition: all 0.25s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
