<template>
  <div class="picker">
    <div class="title">选择伙伴</div>
    <div class="grid">
      <button
        v-for="s in PET_SKINS"
        :key="s.id"
        type="button"
        class="card"
        :class="{ active: s.id === modelValue }"
        @click="$emit('update:modelValue', s.id)"
      >
        <span class="emoji">{{ s.emoji }}</span>
        <span class="name">{{ s.name }}</span>
        <span class="wake">唤醒：{{ s.defaultWakeWord }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PET_SKINS, type PetSkinId } from './skins'

defineProps<{ modelValue: PetSkinId }>()
defineEmits<{ 'update:modelValue': [PetSkinId] }>()
</script>

<style scoped>
.picker {
  padding: 4px 0;
}
.title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color, #ddd);
  background: var(--el-fill-color-blank, #fff);
  cursor: pointer;
  text-align: left;
}
.card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}
.emoji {
  font-size: 22px;
  align-self: center;
}
.name {
  font-size: 13px;
  font-weight: 600;
}
.wake {
  font-size: 11px;
  opacity: 0.65;
}
</style>
